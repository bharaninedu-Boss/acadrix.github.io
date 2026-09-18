/* ACADRIX Subject Quality Checker
   Checks whether unit-note links are present and whether linked HTML notes contain
   enough exam-oriented structure. It reports signals only; it never invents content.
*/
(function () {
  'use strict';

  const ROOTS = { cse:'data/cse', ece:'data/electronics', eee:'data/electrical', it:'data/it', civil:'data/civil' };
  const REQUIRED = [
    ['concept','Concept'], ['key','Key points'], ['exam','Exam preparation'], ['formula','Formula/working'], ['revision','Quick revision']
  ];
  let timer = null, lastKey = '';

  function routeInfo() {
    const p = (location.hash || '').replace(/^#\/?/,'').split('/').filter(Boolean);
    if (p[0] !== 'dept' || !p[1] || !p[2] || !p[3]) return null;
    let regulation='r2021', sem, code;
    if (/^r20\d+$/i.test(p[2])) { regulation=p[2].toLowerCase(); sem=Number(String(p[3]).replace(/^sem/i,'')); code=p[4]; }
    else { sem=Number(String(p[2]).replace(/^sem/i,'')); code=p[3]; }
    if (!Number.isInteger(sem) || sem<1 || sem>8 || !code) return null;
    let decoded;try{decoded=decodeURIComponent(code)}catch(_){return null} return {dept:p[1].toLowerCase(),regulation,sem,code:decoded.toUpperCase()};
  }
  function path(r) {
    if (r.dept==='mech') return `${r.regulation==='r2025'?'data/mechanical/r2025':'data/mechanical'}/sem${r.sem}.json`;
    return r.regulation==='r2021' && ROOTS[r.dept] ? `${ROOTS[r.dept]}/sem${r.sem}.json` : null;
  }
  async function load(r) {
    const p=path(r); if(!p) return null;
    try { const x=await fetch(p,{cache:'no-store'}); if(!x.ok)return null; const d=await x.json(); const a=Array.isArray(d)?d:(Array.isArray(d.subjects)?d.subjects:[]); return a.find(s=>String(s.code||'').toUpperCase()===r.code)||null; } catch(e){return null;}
  }
  function textScore(html) {
    const doc=new DOMParser().parseFromString(html,'text/html');
    const text=(doc.body?.innerText||'').replace(/\s+/g,' ').trim();
    const headings=[...doc.querySelectorAll('h2,h3')].map(x=>x.textContent.toLowerCase());
    const links=[...doc.querySelectorAll('a')].length;
    const formulas=[...doc.querySelectorAll('.formula,math,.frac')].length;
    const diagrams=[...doc.querySelectorAll('img,svg,.diagram')].length;
    const has=(terms)=>terms.some(t=>text.toLowerCase().includes(t));
    const checks={
      concept: has(['concept','definition','principle','introduction']),
      key: has(['key points','key point','important points','advantages','characteristics']),
      exam: has(['2 mark','2-mark','12 mark','12-mark','exam','important question']),
      formula: formulas>0 || has(['formula','equation','calculation','worked example','step-by-step']),
      revision: has(['quick revision','revision','summary','at a glance'])
    };
    const present=REQUIRED.filter(([k])=>checks[k]).length;
    const score=Math.round((present/REQUIRED.length)*100);
    return {score,present,textLength:text.length,headings:headings.length,links,formulas,diagrams,checks};
  }
  async function check(subject) {
    const units=Array.isArray(subject.units)?subject.units:[];
    const results=[];
    for(let i=0;i<units.length;i++){
      const u=units[i]||{}; const href=typeof u.notes==='string'?u.notes.trim():'';
      if(!href){results.push({unit:i+1,title:u.title||`Unit ${i+1}`,status:'missing',score:0});continue;}
      try { const x=await fetch(href,{cache:'no-store'}); if(!x.ok){results.push({unit:i+1,title:u.title||`Unit ${i+1}`,status:'broken',score:0});continue;} const html=await x.text(); const s=textScore(html); results.push({unit:i+1,title:u.title||`Unit ${i+1}`,status:s.score>=80?'strong':s.score>=60?'developing':'thin',...s}); } catch(e){results.push({unit:i+1,title:u.title||`Unit ${i+1}`,status:'broken',score:0});}
    }
    return results;
  }
  function render(subject,route,results){
    const app=document.getElementById('app'); if(!app)return; document.getElementById('acadrx-quality-check')?.remove();
    const avg=results.length?Math.round(results.reduce((a,b)=>a+b.score,0)/results.length):0;
    const missing=results.filter(x=>x.status==='missing'||x.status==='broken').length;
    const thin=results.filter(x=>x.status==='thin').length;
    const panel=document.createElement('section'); panel.id='acadrx-quality-check'; panel.className='resource-completeness card subject-quality-check';
    panel.innerHTML=`<div class="resource-completeness-head"><div><span class="resource-completeness-kicker">CONTENT QUALITY SIGNAL</span><h2>Unit Note Quality</h2><p>Checks the actual linked notes for study structure. This is a content signal, not a syllabus-coverage verdict.</p></div><div class="resource-completeness-score"><strong>${avg}%</strong><span>average signal</span></div></div><div class="quality-summary"><span>${results.length} units checked</span><span>${missing} missing/broken</span><span>${thin} need expansion</span></div><div class="quality-grid">${results.map(x=>`<article class="quality-item ${x.status}"><div><strong>Unit ${x.unit} — ${esc(x.title)}</strong><span>${label(x.status)}${x.score!==undefined?` · ${x.score}%`:''}</span></div><b>${x.status==='strong'?'✓':x.status==='developing'?'!':'—'}</b></article>`).join('')}</div><p class="quality-note">Signals look for concepts, key points, exam preparation, formula/working and revision structure. They do not judge correctness or replace manual syllabus verification.</p>`;
    const coverage=document.getElementById('acadrx-resource-completeness'); const anchor=coverage||app.querySelector('.subject-tabs')||app.querySelector('.subject-header'); if(anchor?.parentNode)anchor.parentNode.insertBefore(panel,anchor.nextSibling);else app.prepend(panel);
  }
  function label(s){return {strong:'Strong structure',developing:'Could be expanded',thin:'Needs more content',missing:'No note link',broken:'Note could not be loaded'}[s]||s;}
  function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function refresh(){const r=routeInfo(); if(!r){document.getElementById('acadrx-quality-check')?.remove();return;} const key=`${r.dept}/${r.regulation}/${r.sem}/${r.code}`; if(key===lastKey&&document.getElementById('acadrx-quality-check'))return; lastKey=key; const s=await load(r); if(s&&routeInfo()&&JSON.stringify(routeInfo())===JSON.stringify(r))render(s,r,await check(s));}
  function schedule(){clearTimeout(timer);timer=setTimeout(refresh,120);} window.addEventListener('hashchange',()=>{lastKey='';schedule();}); const app=document.getElementById('app'); if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true}); schedule();
})();
