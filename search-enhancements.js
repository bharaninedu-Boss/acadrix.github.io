/* ACADRIX — regulation-aware unified search
   Builds one cached index for R-2021 + R-2025 and searches subjects, units and resource labels.
*/
(function () {
  'use strict';
  let cachedIndex = null;
  let buildingIndex = null;

  const DEPTS = [
    { id:'mech', name:'Mechanical Engineering', folder:'mechanical' },
    { id:'cse', name:'Computer Science', folder:'cse' },
    { id:'ece', name:'Electronics & Communication', folder:'electronics' },
    { id:'eee', name:'Electrical & Electronics', folder:'electrical' },
    { id:'it', name:'Information Technology', folder:'it' },
    { id:'civil', name:'Civil Engineering', folder:'civil' }
  ];

  function esc(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function normPath(path, deptId, regulation) {
    if (!path) return '';
    if (/^(https?:|#|\/)/i.test(path)) return path;
    if (regulation === 'r2025' && !path.startsWith('data/')) return `data/mechanical/r2025/${path}`;
    if (deptId === 'mech' && !path.startsWith('data/')) return `data/mechanical/${path}`;
    return path.startsWith('data/') ? path : `data/${path}`;
  }

  async function semester(path, dept, sem, regulation, index) {
    try {
      const res = await fetch(path);
      if (!res.ok) return;
      const json = await res.json();
      const subjects = Array.isArray(json) ? json : (json && Array.isArray(json.subjects) ? json.subjects : []);
      subjects.forEach(s => {
        const units = Array.isArray(s.units) ? s.units : [];
        const topics = units.map((u, i) => ({ title: typeof u === 'string' ? u : (u.title || u.name || `Unit ${i+1}`), unit:i+1 }));
        const resources = [];
        [['Notes',s.resource],['Important Questions',s.importantQuestions],['Formula Sheet',s.formulaSheet],['Solved Problems',s.solvedProblems],['Last-Day Revision',s.lastDayRevision]].forEach(([label,p]) => { if (p) resources.push(label); });
        index.push({ code:s.code || '', name:s.name || '', dept:dept.id, deptName:dept.name, sem, regulation, topics, resources, resource:s.resource || '' });
      });
    } catch (_) {}
  }

  async function buildIndex() {
    if (cachedIndex) return cachedIndex;
    if (buildingIndex) return buildingIndex;
    buildingIndex = (async () => {
      const index = [];
      
      for (const d of DEPTS) for (let sem=1; sem<=8; sem++) {
        await semester(d.id === 'mech' ? `data/mechanical/sem${sem}.json` : `data/${d.folder}/sem${sem}.json`, d, sem, 'r2021', index);
      }
      for (let sem=1; sem<=8; sem++) await semester(`data/mechanical/r2025/sem${sem}.json`, DEPTS[0], sem, 'r2025', index);
      cachedIndex = index;
      return cachedIndex;
    })();
    return buildingIndex;
  }

  function score(item, q) {
    const tests = [
      [item.code,120],[item.name,90],[...item.topics.map(t=>t.title),60],
      [item.deptName,35],[item.regulation,35],[`semester ${item.sem}`,30],[...item.resources,25]
    ];
    let total=0;
    tests.forEach(([value,weight]) => {
      const values = Array.isArray(value) ? value : [value];
      values.forEach(v => { const t=String(v||'').toLowerCase(); if (t===q) total+=weight*2; else if (t.includes(q)) total+=weight; });
    });
    return total;
  }

  async function enhancedSearch() {
    const input=document.getElementById('searchInput'), results=document.getElementById('searchResults');
    if (!input || !results) return;
    const q=input.value.trim().toLowerCase();
    if(q.length<2){results.style.display='none';return;}
    results.innerHTML='<div class="search-item"><small>Searching ACADRIX…</small></div>'; results.style.display='block';
    const index=await buildIndex();
    const ranked=index.map(item=>({item,score:score(item,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    const seen=new Set(), unique=[];
    ranked.forEach(x=>{const k=`${x.item.regulation}|${x.item.dept}|${x.item.sem}|${x.item.code}`;if(!seen.has(k)&&unique.length<12){seen.add(k);unique.push(x.item);}});
    results.innerHTML=unique.length ? unique.map(s=>{
      const route=s.dept==='mech' ? `#/dept/${s.dept}/${s.regulation}/sem${s.sem}/${encodeURIComponent(s.code)}` : `#/dept/${s.dept}/sem${s.sem}/${encodeURIComponent(s.code)}`;
      const matchedTopic=s.topics.find(t=>t.title.toLowerCase().includes(q));
      return `<a class="search-item" href="${route}" role="option"><strong>${esc(s.code||s.name)}</strong><br><small>${esc(s.name)} · ${s.regulation.toUpperCase()} · Semester ${s.sem}${matchedTopic ? ` · Unit ${matchedTopic.unit}` : ''}</small></a>`;
    }).join('') : '<div class="search-item"><strong>No results found</strong><br><small>Try a subject code, subject name, unit topic, regulation, semester or resource.</small></div>';
  }
  window.handleSearch=enhancedSearch;
})();
