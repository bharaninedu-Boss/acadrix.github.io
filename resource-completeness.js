/* ACADRIX Subject Resource Completeness + Roadmap
   Reports only resources explicitly present in the subject data schema.
*/
(function () {
  'use strict';

  const DEPT_ROOTS = { cse:'data/cse', ece:'data/electronics', eee:'data/electrical', it:'data/it', civil:'data/civil' };
  const RESOURCE_DEFS = [
    { key:'units', label:'Unit Notes', icon:'📘', available:s=>Array.isArray(s.units)&&s.units.some(u=>u&&u.notes) },
    { key:'importantQuestions', label:'Important Questions', icon:'🎯', available:s=>typeof s.importantQuestions==='string'&&s.importantQuestions.trim() },
    { key:'formulaSheet', label:'Formula Sheet', icon:'📐', available:s=>typeof s.formulaSheet==='string'&&s.formulaSheet.trim() },
    { key:'solvedProblems', label:'Solved Problems', icon:'🧮', available:s=>typeof s.solvedProblems==='string'&&s.solvedProblems.trim() },
    { key:'pyqs', label:'PYQs', icon:'📄', available:s=>Array.isArray(s.pyqs)&&s.pyqs.length>0 },
    { key:'lastDayRevision', label:'Last-Day Revision', icon:'⚡', available:s=>typeof s.lastDayRevision==='string'&&s.lastDayRevision.trim() }
  ];
  const ROADMAP = [
    { key:'units', label:'Learn', text:'Study the unit notes first.', icon:'1' },
    { key:'importantQuestions', label:'Practice', text:'Use important questions to test coverage.', icon:'2' },
    { key:'solvedProblems', label:'Solve', text:'Work through solved problems and numericals.', icon:'3' },
    { key:'pyqs', label:'Verify', text:'Compare preparation with verified PYQs when available.', icon:'4' },
    { key:'formulaSheet', label:'Recall', text:'Compress formulas and key facts for quick revision.', icon:'5' },
    { key:'lastDayRevision', label:'Revise', text:'Finish with last-day revision.', icon:'6' }
  ];
  let lastRoute='', timer=null;

  function routeInfo(){
    const p=(location.hash||'').replace(/^#\/?/,'').split('/').filter(Boolean);
    if(p[0]!=='dept'||!p[1]||!p[2]||!p[3]) return null;
    let regulation='r2021',sem,code;
    if(/^r20\d+$/i.test(p[2])){ regulation=p[2].toLowerCase(); sem=Number((p[3]||'').replace(/^sem/i,'')); code=p[4]; }
    else { sem=Number((p[2]||'').replace(/^sem/i,'')); code=p[3]; }
    if(!Number.isInteger(sem)||sem<1||sem>8||!code) return null;
    let decoded;try{decoded=decodeURIComponent(code)}catch(_){return null} return {dept:p[1].toLowerCase(),regulation,sem,code:decoded.toUpperCase()};
  }
  function dataPath(r){
    if(r.dept==='mech') return `${r.regulation==='r2025'?'data/mechanical/r2025':'data/mechanical'}/sem${r.sem}.json`;
    return r.regulation==='r2021'&&DEPT_ROOTS[r.dept]?`${DEPT_ROOTS[r.dept]}/sem${r.sem}.json`:null;
  }
  async function loadSubject(r){
    const path=dataPath(r); if(!path) return null;
    try{ const res=await fetch(path,{cache:'no-store'}); if(!res.ok)return null; const data=await res.json(); const list=Array.isArray(data)?data:(Array.isArray(data.subjects)?data.subjects:[]); return list.find(s=>String(s.code||'').toUpperCase()===r.code)||null; }catch(_){return null;}
  }
  function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function render(subject,route){
    const app=document.getElementById('app'); if(!app||!subject)return;
    const old=document.getElementById('acadrx-resource-completeness'); if(old)old.remove();
    const states=RESOURCE_DEFS.map(d=>({...d,ok:Boolean(d.available(subject))}));
    const available=states.filter(x=>x.ok).length,total=states.length;
    const panel=document.createElement('section'); panel.id='acadrx-resource-completeness'; panel.className='resource-completeness card';
    const regulation=route.regulation==='r2025'?'R-2025':'R-2021';
    panel.innerHTML=`<div class="resource-completeness-head"><div><span class="resource-completeness-kicker">RESOURCE COVERAGE</span><h2 id="resource-completeness-title">Study Resources</h2><p>Coverage check for ${esc(subject.code)} · ${regulation}. Missing items are shown as not added yet — no placeholder links are created.</p></div><div class="resource-completeness-score"><strong>${available}/${total}</strong><span>available</span></div></div><div class="resource-completeness-grid">${states.map(item=>{const href=item.key==='units'?'':(typeof subject[item.key]==='string'?subject[item.key].trim():'');const action=item.key==='units'?(item.ok?'Open unit notes from the tabs above':'No unit note links in data'):(href?`<a href="${esc(href)}">Open resource →</a>`:'');return `<article class="resource-check-item ${item.ok?'is-available':'is-missing'}"><div class="resource-check-icon">${item.icon}</div><div class="resource-check-main"><strong>${item.label}</strong><span>${item.ok?'Available':'Not added yet'}</span>${action?`<small>${action}</small>`:''}</div><b class="resource-check-mark">${item.ok?'✓':'—'}</b></article>`;}).join('')}</div>`;
    const roadmap=document.createElement('section'); roadmap.className='resource-roadmap card'; roadmap.setAttribute('aria-labelledby','resource-roadmap-title');
    roadmap.innerHTML=`<div class="resource-roadmap-head"><div><span class="resource-completeness-kicker">STUDY ROADMAP</span><h2 id="resource-roadmap-title">Recommended Study Order</h2><p>Follow the sequence below. A step is marked available only when that resource is actually present in the subject data.</p></div></div><div class="resource-roadmap-grid">${ROADMAP.map(step=>{const ok=states.find(s=>s.key===step.key)?.ok; return `<article class="resource-roadmap-step ${ok?'is-ready':'is-missing'}"><span class="resource-roadmap-number">${step.icon}</span><div><strong>${step.label}</strong><small>${step.text}</small><b>${ok?'Available':'Not added yet'}</b></div></article>`;}).join('')}</div>`;
    const header=app.querySelector('.subject-header'),tabs=app.querySelector('.subject-tabs'),anchor=tabs||header;
    if(anchor&&anchor.parentNode){anchor.parentNode.insertBefore(panel,anchor.nextSibling); panel.parentNode.insertBefore(roadmap,panel.nextSibling);} else {app.prepend(roadmap);app.prepend(panel);}
  }
  async function refresh(){
    const route=routeInfo();
    if(!route){document.getElementById('acadrx-resource-completeness')?.remove();document.querySelector('.resource-roadmap')?.remove();return;}
    const key=`${route.dept}/${route.regulation}/${route.sem}/${route.code}`; if(key===lastRoute&&document.getElementById('acadrx-resource-completeness'))return; lastRoute=key;
    const subject=await loadSubject(route); const now=routeInfo(); if(subject&&now&&`${now.dept}/${now.regulation}/${now.sem}/${now.code}`===key)render(subject,route);
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,80);}
  window.addEventListener('hashchange',()=>{lastRoute='';schedule();});
  const app=document.getElementById('app'); if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  schedule();
})();