/* ACADRIX — R-2025 all-programme directory.
   Programme names and verified links are sourced from Anna University.
*/
(function(){
'use strict';
const DATA_URL='data/r2025-programmes.json';
const RESOURCES_URL='data/r2025-resources.json';
const OFFICIAL='https://cac.annauniv.edu/aidetails/ai_ug_cands_2025ft.html';
let directoryData=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getData(){
 if(directoryData)return directoryData;
 const [r,rr]=await Promise.all([fetch(DATA_URL),fetch(RESOURCES_URL)]);
 if(!r.ok||!rr.ok)throw new Error('R-2025 resources unavailable');
 directoryData={catalog:await r.json(),resources:await rr.json()};
 return directoryData;
}
function openDirectory(){location.hash='#/r2025';}
function renderDirectory(){
 const app=document.getElementById('app');if(!app)return;
 app.innerHTML='<div class="breadcrumb"><a href="#" onclick="navigateTo(\'home\');return false">Home</a> › Regulation 2025</div><section class="r25-hero"><span class="r25-eyebrow">ANNA UNIVERSITY · AFFILIATED UG</span><h1>Regulation 2025</h1><p>Explore undergraduate programmes and verified official curriculum PDFs. Where a direct PDF has not yet been verified, use Anna University’s official curriculum directory.</p><div class="r25-meta"><span>2025–2026 admission batch</span><span>Separate from R-2021</span></div></section><section class="r25-directory"><div class="r25-directory-head"><div><h2>Browse all programmes</h2><p id="r25-count">Loading verified resources…</p></div><input id="r25-search" type="search" placeholder="Search department or programme…" aria-label="Search R-2025 programmes"></div><div id="r25-faculties"></div><p class="r25-source">Source: <a href="'+OFFICIAL+'" target="_blank" rel="noopener">Anna University Centre for Academic Courses — official R-2025 curriculum listing ↗</a></p><p class="r25-note">ACADRIX is an independent student resource. Course codes, semester tables, credits and unit topics will be shown only after checking the corresponding official curriculum PDF. A programme without a direct PDF link is sent to the official directory, not to an unverified file.</p></section>';
 getData().then(data=>{
   const root=document.getElementById('r25-faculties');if(!root)return;
   const faculties=data.catalog.faculties;
   const coreDocs=data.resources.resources.filter(x=>x.type==='regulations'||x.type==='supplementary-index');
   const core=document.createElement('section');core.className='r25-core-resources';
   core.innerHTML='<h2>Core R-2025 documents</h2><div class="r25-programme-grid">'+coreDocs.map(d=>'<a class="r25-programme" href="'+d.url+'" target="_blank" rel="noopener"><span>'+esc(d.title)+'</span><b>'+(d.type==='supplementary-index'?'Third-party index ↗':'Official regulation PDF ↗')+'</b></a>').join('')+'</div>';
   const common=document.createElement('section');common.className='r25-core-resources';
   common.innerHTML='<h2>First-year foundation exam study notes</h2><div class="r25-programme-grid"><a class="r25-programme" href="r2025-notes/MA25C01-applied-calculus.html"><span>MA25C01 · Applied Calculus</span><b>Open teacher-style study notes ↗</b></a><a class="r25-programme" href="r2025-notes/ME25C01-engineering-drawing.html"><span>ME25C01 · Engineering Drawing</span><b>Open teacher-style study notes ↗</b></a><a class="r25-programme" href="r2025-notes/CS25C01-computer-programming-c.html"><span>CS25C01 · Computer Programming: C</span><b>Open teacher-style study notes ↗</b></a><a class="r25-programme" href="r2025-notes/CS25C03-essentials-of-computing.html"><span>CS25C03 · Essentials of Computing</span><b>Open teacher-style study notes ↗</b></a><a class="r25-programme" href="r2025-notes/CS25C02-python-programming.html"><span>CS25C02 · Computer Programming: Python</span><b>Open teacher-style study notes ↗</b></a><a class="r25-programme" href="r2025-notes/CY25C01-applied-chemistry.html"><span>CY25C01 · Applied Chemistry – I</span><b>Open teacher-style study notes ↗</b></a><a class="r25-programme" href="r2025-notes/PH25C01-applied-physics-1.html"><span>PH25C01 · Applied Physics – I</span><b>Open teacher-style study notes ↗</b></a><a class="r25-programme" href="r2025-notes/EN25C01-english-essentials-1.html"><span>EN25C01 · English Essentials I</span><b>Open teacher-style study notes ↗</b></a></div><p class="r25-note">These notes cover foundation courses used in selected R-2025 programmes. Check the course code in your own curriculum before studying; more subjects will be added after syllabus verification.</p>';
   const directory=document.querySelector('.r25-directory');const directoryHead=directory?.querySelector('.r25-directory-head');if(directory&&directoryHead){directory.insertBefore(core,directoryHead);directory.insertBefore(common,directoryHead);}
   const total=faculties.reduce((n,f)=>n+f.programmes.length,0);
   const verified=data.resources.resources.filter(x=>x.type==='programme-curriculum'&&x.verification==='official-pdf-verified').length;
   document.getElementById('r25-count').textContent=total+' programmes across '+faculties.length+' faculties · '+verified+' direct official curriculum PDFs verified';
   function draw(q=''){
     const term=q.trim().toLowerCase();
     const groups=faculties.map(f=>({...f,programmes:f.programmes.filter(p=>(f.name+' '+p[1]).toLowerCase().includes(term))})).filter(f=>f.programmes.length);
     root.innerHTML=groups.length?groups.map(f=>'<section class="r25-faculty"><h3><span>'+f.icon+'</span>'+esc(f.name)+' <small>'+f.programmes.length+'</small></h3><div class="r25-programme-grid">'+f.programmes.map(p=>{
       const resource=data.resources.resources.find(x=>x.programme===p[0]&&x.verification==='official-pdf-verified');
       const href=resource?resource.url:OFFICIAL;
       const label=resource?'Verified official PDF ↗':'Find official syllabus ↗';
       return '<a class="r25-programme" href="'+href+'" target="_blank" rel="noopener"><span>'+esc(p[1])+'</span><b>'+label+'</b></a>';
     }).join('')+'</div></section>').join(''):'<div class="r25-empty">No matching programme. Try another keyword.</div>';
   }
   draw();document.getElementById('r25-search').addEventListener('input',e=>draw(e.target.value));
 }).catch(()=>{document.getElementById('r25-count').textContent='Could not load the R-2025 resource catalogue.';});
}
const previousRoute=handleHashRoute;
handleHashRoute=function(){
 const h=(location.hash||'').replace(/^#/,'');
 if(h==='/r2025'||h==='/r2025/') {currentState={view:'r2025Directory'};closeMenu();render();return;}
 previousRoute();
};
const oldRenderHome=renderHome;
renderHome=async function(container){
 await oldRenderHome(container);
 if(!container||currentState.view!=='home'&&currentState.view!=='browse')return;
 const section=document.createElement('section');
 section.className='r25-home-promo';
 section.innerHTML='<div><span class="r25-eyebrow">NEW · REGULATION 2025</span><h2>All Anna University UG Programmes</h2><p>Browse the R-2025 programme directory across engineering, technology and architecture.</p></div><a class="r25-cta" href="#/r2025">Explore R-2025 programmes <span>→</span></a>';
 const anchor=container.querySelector('#deptGrid')?.parentElement;
 if(anchor)anchor.insertAdjacentElement('afterend',section);
};
const baseRender=render;
render=function(){
 if(currentState.view==='r2025Directory'){renderDirectory();window.scrollTo(0,0);return;}
 baseRender();
};
window.openR2025Directory=openDirectory;
})();
