/* ACADRIX PDF-first resource layer
   PDFs live in GitHub. Category folders keep study resources separate.
   Upload to: data/pdfs/<department>/<regulation>/sem<semester>/<subject-code>/<category>/
*/
(function(){
  const API='https://api.github.com/repos/bharaninedu-Boss/acadrix.github.io/contents/';
  const SITE='https://bharaninedu-boss.github.io/Acadrix/';
  const REPO='https://github.com/bharaninedu-Boss/acadrix.github.io/tree/main/';
  const previous=window.renderSubjectDetails;
  if(typeof previous!=='function') return;
  const CATEGORIES=[
    {id:'notes',icon:'📖',title:'Notes / Study Materials',help:'Unit notes, full notes, reference materials and study PDFs.'},
    {id:'pyq',icon:'📝',title:'Previous Year Question Papers',help:'University examination papers, kept completely separate from notes.'},
    {id:'important-questions',icon:'⭐',title:'Important Questions',help:'Important-question and exam-focused PDF collections.'},
    {id:'syllabus',icon:'📋',title:'Syllabus',help:'Official syllabus and curriculum PDFs.'},
    {id:'lab-manual',icon:'🔬',title:'Lab Manual',help:'Laboratory manuals, experiments and practical PDFs.'}
  ];
  function esc(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
  function pretty(name){return name.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());}
  function pdfUrl(path){return SITE+path.split('/').map(encodeURIComponent).join('/');}
  function githubFolderUrl(path){return REPO+path.split('/').map(encodeURIComponent).join('/');}
  async function getFiles(path){try{const r=await fetch(API+path+'?ref=main',{cache:'no-store'});if(!r.ok)return[];const d=await r.json();return Array.isArray(d)?d.filter(x=>x.type==='file'&&/\.pdf$/i.test(x.name)):[];}catch(e){return[];}}
  function routeState(code){const p=location.hash.match(/^#\/dept\/([^/]+)\/([^/]+)\/sem(\d+)\/([^/?#]+)/i);return{dept:p?p[1]:'',regulation:p?p[2]:'',sem:p?Number(p[3]):1,subjectCode:code||(p?decodeURIComponent(p[4]):'')};}
  function card(f){const href=pdfUrl(f.path);return `<article class="pdf-library-card" data-pdf-name="${esc((f.name+' '+pretty(f.name)).toLowerCase())}"><div class="pdf-icon">📄</div><strong>${esc(pretty(f.name))}</strong><p class="pdf-muted">PDF • ${(f.size/1024/1024).toFixed(2)} MB</p><div class="pdf-actions"><a class="pdf-open" href="${href}" target="_blank" rel="noopener">Open PDF →</a><a href="${href}" download>Download</a></div></article>`;}
  async function renderCategory(cat,folder){
    const files=await getFiles(`${folder}/${cat.id}`);
    const cards=files.sort((a,b)=>a.name.localeCompare(b.name)).map(card).join('');
    return {html:`<section class="pdf-category" data-category="${cat.id}" hidden><div class="pdf-category-head"><div><h3>${cat.icon} ${cat.title} <span class="pdf-count">(${files.length})</span></h3><p class="pdf-muted">${cat.help}</p></div><code>${esc(folder+'/'+cat.id)}/</code></div><div class="pdf-library-grid">${cards||`<div class="pdf-library-card empty"><strong>No PDFs uploaded yet.</strong><p class="pdf-muted">Upload PDFs to the folder shown above. They will appear automatically after GitHub Pages updates.</p><a class="pdf-upload" href="${githubFolderUrl(folder+'/'+cat.id)}" target="_blank" rel="noopener">Open GitHub folder →</a></div>`}</div></section>`,count:files.length};
  }
  async function mount(container,code){
    const s=routeState(code);if(s.dept!=='mech'||!/^r202[15]$/i.test(String(s.regulation))||!s.subjectCode)return;
    const folder=`data/pdfs/mechanical/${s.regulation.toLowerCase()}/sem${s.sem}/${s.subjectCode}`;
    let host=document.getElementById('acadrxPdfLibrary');if(!host){host=document.createElement('section');host.id='acadrxPdfLibrary';container.appendChild(host);}
    host.innerHTML=`<h2>📚 PDF Study Library</h2><div class="pdf-library-note"><strong>PDF-first:</strong> Choose a category below. Each category reads its own GitHub folder automatically. No JSON editing is needed for PDFs. <a class="pdf-upload" href="${githubFolderUrl(folder)}" target="_blank" rel="noopener">Open subject PDF folders →</a></div><div class="pdf-search-wrap"><label for="pdfLibrarySearch"><strong>🔎 Search this subject's PDFs</strong></label><input id="pdfLibrarySearch" class="pdf-library-search" type="search" placeholder="Search by PDF name, unit, topic or keyword…" autocomplete="off"><p id="pdfSearchStatus" class="pdf-muted">Showing all PDFs</p></div><nav class="pdf-category-tabs" aria-label="PDF resource categories">${CATEGORIES.map(c=>`<button type="button" class="pdf-tab" data-category="${c.id}">${c.icon} ${c.title} <span class="pdf-tab-count">…</span></button>`).join('')}</nav><div id="pdfCategories">Loading resources…</div>`;
    const results=await Promise.all(CATEGORIES.map(c=>renderCategory(c,folder)));const target=host.querySelector('#pdfCategories');target.innerHTML=results.map(r=>r.html).join('');
    const sections=[...host.querySelectorAll('.pdf-category')],tabs=[...host.querySelectorAll('.pdf-tab')],search=host.querySelector('#pdfLibrarySearch'),status=host.querySelector('#pdfSearchStatus');
    tabs.forEach((t,i)=>{t.querySelector('.pdf-tab-count').textContent=`${results[i].count}`;});
    function applySearch(){const q=search.value.trim().toLowerCase();let shown=0;sections.forEach(section=>{let visible=0;section.querySelectorAll('.pdf-library-card:not(.empty)').forEach(c=>{const match=!q||c.dataset.pdfName.includes(q);c.hidden=!match;if(match)visible++;});if(q){section.dataset.searchMatches=visible;}shown+=visible;});status.textContent=q?(shown?`Found ${shown} PDF${shown===1?'':'s'} matching “${search.value.trim()}”.`:`No PDFs match “${search.value.trim()}”.`):'Showing all PDFs';}
    function show(id){sections.forEach(x=>x.hidden=x.dataset.category!==id);tabs.forEach(x=>x.classList.toggle('active',x.dataset.category===id));applySearch();}
    tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.category)));search.addEventListener('input',applySearch);show(CATEGORIES[0].id);
  }
  window.renderSubjectDetails=async function(container,code){await previous.apply(this,arguments);await mount(container,code);};
})();
