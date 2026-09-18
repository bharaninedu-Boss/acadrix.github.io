/* ACADRIX regulation-aware navigation
   R-2021 and R-2025 use separate data namespaces.
   data/catalog.json defines the shared content schema and regulation roots.
*/

const originalRenderSemesters = renderSemesters;
const originalRenderSubjects = renderSubjects;
const originalLoadSemesterData = loadSemesterData;
const originalRenderSubjectDetails = renderSubjectDetails;
const originalRenderHome = renderHome;

let acadrxCatalog = null;
let acadrxCatalogPromise = null;

async function getAcadrxCatalog() {
    if (acadrxCatalog) return acadrxCatalog;
    if (!acadrxCatalogPromise) acadrxCatalogPromise = fetch('data/catalog.json').then(r => r.ok ? r.json() : null).then(data => { acadrxCatalog = data; return data; }).catch(err => { console.error('ACADRIX catalog load failed', err); return null; });
    return acadrxCatalogPromise;
}
function isMechanical(deptId) { return deptId === 'mech'; }
function regulationLabel(regulation) { return regulation === 'r2025' ? 'Regulation 2025' : 'Regulation 2021'; }
function navigateRegulation(regulation) { location.hash = `#/dept/mech/${regulation}`; }
function safeDecodeRoutePart(value) {
    try { return decodeURIComponent(value); } catch (_) { return null; }
}
function validSemester(sem) { return Number.isInteger(sem) && sem >= 1 && sem <= 8; }
function normalizeResourcePath(path, regulation='r2021') {
    if (!path) return path;
    if (/^(https?:|#|\/)/i.test(path) || path.startsWith('data/')) return path;
    return regulation === 'r2025' ? `data/mechanical/r2025/${path.replace(/^\.\//,'')}` : path;
}
function normalizeSubject(subject, deptId, sem, regulation) {
    const copy={...subject,dept:deptId,sem,regulation};
    if(copy.resource) copy.resource=normalizeResourcePath(copy.resource,regulation);
    if(Array.isArray(copy.units)) copy.units=copy.units.map(unit=>({...unit,notes:unit.notes?normalizeResourcePath(unit.notes,regulation):unit.notes}));
    ['importantQuestions','formulaSheet','solvedProblems','lastDayRevision','questionBank'].forEach(k=>{if(typeof copy[k]==='string') copy[k]=normalizeResourcePath(copy[k],regulation);});
    return copy;
}

handleHashRoute=function(){
    const hash=(location.hash||'').replace(/^#/,'');
    if(!hash||hash==='/') return navigateTo('home',{},true);
    const p=hash.split('/').filter(Boolean);
    if(p[0]!=='dept') return navigateTo('home',{},true);
    const dept=p[1]; if(!dept) return navigateTo('home',{},true);
    if(isMechanical(dept)&&/^r202[15]$/i.test(p[2]||'')){
        const regulation=p[2].toLowerCase();
        if(!p[3]) return navigateTo('semesters',{dept,regulation},true);
        const sm=p[3].match(/^sem(\d+)$/i); if(!sm) return navigateTo('semesters',{dept,regulation},true);
        const sem=parseInt(sm[1],10);
        if(!validSemester(sem)) return navigateTo('semesters',{dept,regulation},true);
        if(!p[4]) return navigateTo('subjects',{dept,sem,regulation},true);
        const decoded=safeDecodeRoutePart(p[4]);
        if(decoded===null) return navigateTo('subjects',{dept,sem,regulation},true);
        return navigateTo('details',{dept,sem,regulation,subjectCode:decoded},true);
    }
    const sm=(p[2]||'').match(/^sem(\d+)$/i);
    if(sm){const sem=parseInt(sm[1],10);if(!validSemester(sem))return navigateTo('semesters',{dept,regulation:isMechanical(dept)?null:'r2021'},true);if(!p[3])return navigateTo('subjects',{dept,sem,regulation:'r2021'},true);const decoded=safeDecodeRoutePart(p[3]);if(decoded===null)return navigateTo('subjects',{dept,sem,regulation:'r2021'},true);return navigateTo('details',{dept,sem,regulation:'r2021',subjectCode:decoded},true);}
    if(!p[2]) return navigateTo('semesters',{dept,regulation:isMechanical(dept)?null:'r2021'},true);
    navigateTo('home',{},true);
};

navigateTo=function(view,params={},fromHash=false){
    if(typeof view==='object'){params=view;view=params.view;}
    currentState={view,...params}; closeMenu();
    if(!fromHash){
        if(view==='home')location.hash='';
        else if(view==='semesters'&&params.dept)location.hash=isMechanical(params.dept)&&params.regulation?`#/dept/${params.dept}/${params.regulation}`:`#/dept/${params.dept}`;
        else if(view==='subjects'&&params.dept&&params.sem)location.hash=isMechanical(params.dept)&&params.regulation?`#/dept/${params.dept}/${params.regulation}/sem${params.sem}`:`#/dept/${params.dept}/sem${params.sem}`;
        else if(view==='details'&&params.dept&&params.sem&&params.subjectCode)location.hash=isMechanical(params.dept)&&params.regulation?`#/dept/${params.dept}/${params.regulation}/sem${params.sem}/${encodeURIComponent(params.subjectCode)}`:`#/dept/${params.dept}/sem${params.sem}/${encodeURIComponent(params.subjectCode)}`;
    }
    render();
};

renderHome=async function(container){await originalRenderHome(container);const cards=document.querySelectorAll('#deptGrid .card');if(cards.length){const p=cards[0].querySelector('p');if(p)p.textContent='R2025 + R2021 • Semester 1–8';}};

renderSemesters=function(container,deptId,regulation=null){
    if(!isMechanical(deptId))return originalRenderSemesters(container,deptId);
    const chosen=regulation||currentState.regulation||null;
    if(!chosen){container.innerHTML=`<div class="breadcrumb"><span onclick="navigateTo('home')">Home</span> › <span>Mechanical Engineering</span></div><section class="hero"><h1>Mechanical Engineering</h1><p>Select your Anna University regulation. R-2025 and R-2021 resources are kept completely separate.</p></section><section><h2>Select Regulation</h2><div class="grid"><div class="card" role="button" tabindex="0" onclick="navigateRegulation('r2025')"><div style="font-size:2.2rem">📘</div><h3>Regulation 2025</h3><p style="margin:0;color:var(--text-secondary)">New curriculum and dedicated R-2025 study-material namespace.</p><div class="arrow">→</div></div><div class="card" role="button" tabindex="0" onclick="navigateRegulation('r2021')"><div style="font-size:2.2rem">📗</div><h3>Regulation 2021</h3><p style="margin:0;color:var(--text-secondary)">Existing R-2021 notes, PYQs and Professional Electives.</p><div class="arrow">→</div></div></div></section>`;return;}
    const label=regulationLabel(chosen);container.innerHTML=`<div class="breadcrumb"><span onclick="navigateTo('home')">Home</span> › <span onclick="navigateTo('semesters',{dept:'mech',regulation:'${chosen}'})">Mechanical Engineering</span> › <span>${label}</span></div><section class="hero"><h1>Mechanical Engineering — ${label}</h1><p>${chosen==='r2025'?'R-2025 resources are stored separately from R-2021 and will be expanded semester-by-semester.':'R-2021 resources and existing study material.'}</p></section><section><h2>Select Semester</h2><div class="grid">${[1,2,3,4,5,6,7,8].map(n=>`<div class="card" role="button" tabindex="0" onclick="navigateTo('subjects',{dept:'mech',sem:${n},regulation:'${chosen}'})"><div><h3>Semester ${n}</h3><p style="margin:0;color:var(--text-secondary)">Mechanical Engineering · ${label}</p></div><div class="arrow">→</div></div>`).join('')}</div></section>`;
};

loadSemesterData=async function(deptId,sem,regulation=null){
    if(isMechanical(deptId)&&(regulation==='r2025'||regulation==='r2021')){const catalog=await getAcadrxCatalog();const cfg=catalog?.departments?.[deptId]?.regulations?.[regulation];const root=cfg?.dataRoot||(regulation==='r2025'?'data/mechanical/r2025':'data/mechanical');const pattern=cfg?.semesterPattern||'sem{semester}.json';const path=`${root}/${pattern.replace('{semester}',sem)}`,key=`${deptId}-${regulation}-sem${sem}`;if(loadedData[key])return loadedData[key];try{const r=await fetch(path);if(!r.ok)return loadedData[key]=[];const j=await r.json(),ss=Array.isArray(j)?j:(j&&Array.isArray(j.subjects)?j.subjects:[]);return loadedData[key]=ss.filter(s=>!s.resourceOnly).map(s=>normalizeSubject(s,deptId,sem,regulation));}catch(e){console.error('Failed to load',path,e);return loadedData[key]=[];}}
    if(deptId==='cse'){const key=`${deptId}-r2021-sem${sem}`;if(loadedData[key])return loadedData[key];try{const r=await fetch(`data/cse/sem${sem}.json`);if(!r.ok)return loadedData[key]=[];const j=await r.json(),ss=Array.isArray(j)?j:(j&&Array.isArray(j.subjects)?j.subjects:[]);return loadedData[key]=ss.map(s=>normalizeSubject(s,deptId,sem,'r2021'));}catch(e){return loadedData[key]=[];}}
    return originalLoadSemesterData(deptId,sem);
};

renderSubjects=async function(container,deptId,sem,regulation=null){
    const chosen=regulation||currentState.regulation||null;if(!isMechanical(deptId)||chosen!=='r2025')return originalRenderSubjects(container,deptId,sem);
    container.innerHTML=`<div class="breadcrumb"><span onclick="navigateTo('home')">Home</span> › <span onclick="navigateTo('semesters',{dept:'mech',regulation:'r2025'})">Mechanical Engineering</span> › <span onclick="navigateTo('semesters',{dept:'mech',regulation:'r2025'})">Regulation 2025</span> › <span>Semester ${sem}</span></div><h2>R-2025 · Semester ${sem}</h2><div id="subjectsGrid" class="grid"><div class="card">Loading R-2025 subjects…</div></div>`;
    const subjects=await loadSemesterData(deptId,sem,'r2025'),grid=document.getElementById('subjectsGrid');
    if(!subjects.length){
        const status = regulation==='r2025' ? 'structure-ready' : 'unverified';
        grid.innerHTML=`<div class="card"><h3>Semester ${sem}</h3><p>R-2025 curriculum structure is reserved for this semester, but the subject list has not yet been independently verified.</p><p><strong>No R-2021 subjects are mixed into this page.</strong></p><small style="color:var(--text-secondary)">Status: ${status}</small></div>`;
        return;
    }
    grid.innerHTML=subjects.map(s=>{const code=String(s.code||'');const href=`#/dept/mech/r2025/sem${sem}/${encodeURIComponent(code)}`;return `<a class="card" href="${href}" aria-label="Open ${code} ${s.name||''}"><div><p style="color:var(--accent-color);font-weight:bold;margin:0">${code}</p><h3 style="margin:6px 0">${s.name||''}</h3><p style="margin:0;color:var(--text-secondary)">${s.resource?'Open Study Dashboard →':'Curriculum entry · resources coming soon'}</p></div><div class="arrow">→</div></a>`;}).join('');
};

renderSubjectDetails=async function(container,code){
    const regulation=currentState.regulation||'r2021';if(!(currentState.dept==='mech'&&(regulation==='r2025'||regulation==='r2021')))return originalRenderSubjectDetails(container,code);
    const subjects=await loadSemesterData('mech',currentState.sem||1,regulation),subject=subjects.find(s=>s.code&&s.code.toLowerCase()===String(code).toLowerCase());
    if(!subject){container.innerHTML=`<div class="breadcrumb"><span onclick="navigateTo('home')">Home</span> › <span>${regulationLabel(regulation)} Subject</span></div><div class="card"><h2>Subject not found</h2><p>The requested subject is not present in this semester's verified data.</p></div>`;return;}
    if(regulation==='r2021'){
        // Keep the established R-2021 resource renderer, but normalize its state
        // before rendering so shared/direct links retain the correct regulation.
        const previous={...currentState};
        currentState={...previous,regulation:'r2021'};
        try { return await originalRenderSubjectDetails(container,code); }
        finally { currentState=previous; }
    }
    const units=Array.isArray(subject.units)?subject.units:[],cards=[];
    const resources=[['📚','Course Hub',subject.resource,'Open the dedicated subject resource page.'],['🎯','Important Questions',subject.importantQuestions,'Exam-focused questions.'],['📐','Formula Sheet',subject.formulaSheet,'Quick formula revision.'],['✅','Solved Problems',subject.solvedProblems,'Worked numerical problems.'],['🔁','Last-Day Revision',subject.lastDayRevision,'Fast final revision.'],['📄','Question Bank',subject.questionBank,'Practice questions.'],['⚡','1-Mark Question Bank','data/mechanical/r2025/one-mark/index.html','Dedicated R-2025 one-mark preparation and future quiz training.'],['🎯','12-Mark Preparation','data/mechanical/r2025/12-mark/index.html','Dedicated R-2025 long-answer preparation hub.']];
    resources.forEach(r=>{if(r[2]&&r[2]!=='#')cards.push(`<a class="card" href="${r[2]}"><strong>${r[0]} ${r[1]}</strong><p>${r[3]}</p><span class="arrow">→</span></a>`);});
    const unitHtml=units.map(u=>`<div class="card"><strong>Unit ${u.unit||''} — ${u.title||u.name||'Unit'}</strong>${u.notes?`<br><a href="${u.notes}">📘 Open Unit Notes →</a>`:'<p style="color:var(--text-secondary)">Notes coming soon.</p>'}</div>`).join('');
    container.innerHTML=`<div class="breadcrumb"><span onclick="navigateTo('home')">Home</span> › <span onclick="navigateTo('semesters',{dept:'mech',regulation:'r2025'})">Mechanical Engineering</span> › <span onclick="navigateTo('semesters',{dept:'mech',regulation:'r2025'})">R-2025</span> › <span>Semester ${currentState.sem}</span></div><section class="hero"><p style="margin:0;color:var(--accent-color);font-weight:700">${subject.code}</p><h1>${subject.name}</h1><p><strong>Mechanical Engineering · Regulation 2025 · Semester ${currentState.sem}</strong></p><p>R-2025 resources are maintained independently from R-2021.</p></section><h2>Study Dashboard</h2>${cards.length?`<div class="grid">${cards.join('')}</div>`:'<div class="card"><p>Subject hub is available; detailed study resources will be added progressively.</p></div>'}${units.length?`<h2>Unit-wise Notes</h2><div class="grid">${unitHtml}</div>`:''}`;
};
