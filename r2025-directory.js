/* ACADRIX — R-2025 all-programme directory.
   The programme names follow Anna University's 2025-2026 UG listing.
   Individual curriculum details are added only after official PDF verification.
*/
(function(){
'use strict';
const DATA_URL='data/r2025-programmes.json';
const OFFICIAL='https://cac.annauniv.edu/aidetails/ai_ug_cands_2025ft.html';
let directoryData=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function getData(){if(directoryData)return directoryData;const r=await fetch(DATA_URL);if(!r.ok)throw new Error('Programme catalogue unavailable');directoryData=await r.json();return directoryData;}
function openDirectory(){location.hash='#/r2025';}
function renderDirectory(){
 const app=document.getElementById('app');if(!app)return;
 app.innerHTML='<div class="breadcrumb"><a href="#" onclick="navigateTo(\'home\');return false">Home</a> › Regulation 2025</div><section class="r25-hero"><span class="r25-eyebrow">ANNA UNIVERSITY · AFFILIATED UG</span><h1>Regulation 2025</h1><p>Explore the undergraduate programmes, then open the official curriculum and syllabus. Programme-specific semester data is being verified before publication.</p><div class="r25-meta"><span>2025–2026 admission batch</span><span>Separate from R-2021</span></div></section><section class="r25-directory"><div class="r25-directory-head"><div><h2>Browse all programmes</h2><p id="r25-count">Loading official programme directory…</p></div><input id="r25-search" type="search" placeholder="Search department or programme…" aria-label="Search R-2025 programmes"></div><div id="r25-faculties"></div><p class="r25-source">Source: <a href="'+OFFICIAL+'" target="_blank" rel="noopener">Anna University Centre for Academic Courses — official R-2025 curriculum listing ↗</a></p><p class="r25-note">ACADRIX is an independent student resource. Course codes, semester tables, credits and unit topics will be shown only after checking the corresponding official curriculum PDF. This directory is not a claim that every subject page is complete.</p></section>';
 getData().then(data=>{
   const root=document.getElementById('r25-faculties');if(!root)return;
   const total=data.faculties.reduce((n,f)=>n+f.programmes.length,0);
   document.getElementById('r25-count').textContent=total+' programmes across '+data.faculties.length+' faculties';
   function draw(q=''){
     const term=q.trim().toLowerCase();
     const groups=data.faculties.map(f=>({...f,programmes:f.programmes.filter(p=>(f.name+' '+p[1]).toLowerCase().includes(term))})).filter(f=>f.programmes.length);
     root.innerHTML=groups.length?groups.map(f=>'<section class="r25-faculty"><h3><span>'+f.icon+'</span>'+esc(f.name)+' <small>'+f.programmes.length+'</small></h3><div class="r25-programme-grid">'+f.programmes.map(p=>'<a class="r25-programme" href="'+OFFICIAL+'" target="_blank" rel="noopener"><span>'+esc(p[1])+'</span><b>Official syllabus ↗</b></a>').join('')+'</div></section>').join(''):'<div class="r25-empty">No matching programme. Try another keyword.</div>';
   }
   draw();document.getElementById('r25-search').addEventListener('input',e=>draw(e.target.value));
 }).catch(()=>{document.getElementById('r25-count').textContent='Could not load the programme catalogue.';});
}
const previousRoute=handleHashRoute;
handleHashRoute=function(){
 const h=(location.hash||'').replace(/^#/,'');
 if(h==='/r2025'||h==='/r2025/') {currentState={view:'r2025Directory'};closeMenu();renderDirectory();return;}
 previousRoute();
};
const oldRenderHome=renderHome;
renderHome=async function(container){await oldRenderHome(container);if(!container||currentState.view!=='home'&&currentState.view!=='browse')return;const section=document.createElement('section');section.className='r25-home-promo';section.innerHTML='<div><span class="r25-eyebrow">NEW · REGULATION 2025</span><h2>All Anna University UG Programmes</h2><p>Browse the R-2025 programme directory across engineering, technology and architecture.</p></div><a class="r25-cta" href="#/r2025">Explore R-2025 programmes <span>→</span></a>';const anchor=container.querySelector('#deptGrid')?.parentElement;if(anchor)anchor.insertAdjacentElement('afterend',section);};
window.openR2025Directory=openDirectory;
})();
