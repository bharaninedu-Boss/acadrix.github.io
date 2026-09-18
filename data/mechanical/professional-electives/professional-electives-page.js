const CATALOGUE_URL = '../professional-electives.json';

const AVAILABLE_RESOURCES = {
    CME338: 'CME338.html', CME341: 'CME341.html', CME344: 'CME344.html',
    CME356: 'CME356.html', CME358: 'CME358.html', CME362: 'CME362.html',
    CME365: 'CME365.html', CME372: 'CME372.html', CME380: 'CME380.html', CME387: 'CME387.html'
};

// Semester VII core resources live in the main Mechanical data namespace.
// Semester VII curriculum entries are shown for reference.
// Existing Semester VII subject hubs are linked when a verified repository page exists; unavailable subjects remain non-clickable instead of exposing broken links.
const SEM7_RESOURCES = {
    ME3791: '../ME3791.html', ME3792: '../ME3792.html',
    GE3791: '../GE3791.html', GE3792: '../GE3792.html',
    ME3711: 'ME3711.html'
};

const SEM7_SUBJECTS = [
    ['ME3791', 'Mechatronics and IoT', 'Theory'], ['ME3792', 'Computer Integrated Manufacturing', 'Theory'],
    ['GE3791', 'Human Values and Ethics', 'Theory'], ['GE3792', 'Industrial Management', 'Theory'],
    ['OE-II', 'Open Elective - II', 'Open Elective'], ['OE-III', 'Open Elective - III', 'Open Elective'],
    ['OE-IV', 'Open Elective - IV', 'Open Elective'], ['ME3781', 'Mechatronics and IoT Laboratory', 'Laboratory'],
    ['ME3711', 'Summer Internship', 'Internship']
];

const OE_PROGRAMMES = [
    ['CSE', 'Computer Science & Engineering', 'Programming, AI, data and computing-related electives'],
    ['IT', 'Information Technology', 'Software, information systems and emerging digital technologies'],
    ['ECE', 'Electronics & Communication Engineering', 'Electronics, communication and embedded-system areas'],
    ['EEE', 'Electrical & Electronics Engineering', 'Electrical systems, drives, control and energy areas'],
    ['Civil', 'Civil Engineering', 'Infrastructure, construction and environmental engineering areas'],
    ['Chemical', 'Chemical Engineering', 'Chemical process and related engineering areas'],
    ['Mechatronics', 'Mechatronics / interdisciplinary', 'Automation, robotics, sensors and intelligent systems'],
    ['Other', 'Other Anna University programmes', 'Additional programme electives when offered and eligible']
];

let catalogueData = [];

async function initProfessionalElectivesPage() {
    const catalogue = document.getElementById('verticalCatalogue');
    renderSemester7();
    if (!catalogue) return;
    try {
        const response = await fetch(CATALOGUE_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        catalogueData = Array.isArray(data.verticals) ? data.verticals : [];
        renderCatalogue(catalogueData);
        injectCatalogueFilters(catalogue);
    } catch (error) {
        console.error('Failed to load Professional Elective catalogue:', error);
        catalogue.innerHTML = '<div class="error-box">The elective catalogue could not be loaded. Please refresh the page.</div>';
    }
}

function renderCatalogue(verticals, query = '', status = 'all', verticalId = 'all') {
    const catalogue = document.getElementById('verticalCatalogue');
    if (!catalogue) return;
    const search = query.trim().toLowerCase();
    let visibleCourses = 0;
    catalogue.innerHTML = verticals.map(vertical => {
        if (verticalId !== 'all' && String(vertical.id) !== String(verticalId)) return '';
        const courses = (vertical.courses || []).filter(course => {
            const code = String(course[0] || '').toLowerCase();
            const title = String(course[1] || '').toLowerCase();
            const available = Boolean(AVAILABLE_RESOURCES[String(course[0])]);
            return (!search || code.includes(search) || title.includes(search)) &&
                (status === 'all' || (status === 'available' && available) || (status === 'coming' && !available));
        });
        if (!courses.length) return '';
        visibleCourses += courses.length;
        return `<details ${search ? 'open' : ''}><summary><span>Vertical ${escapeHtml(vertical.id)} — ${escapeHtml(vertical.name)}</span><small>${courses.length} matching ${courses.length === 1 ? 'course' : 'courses'}</small></summary><div class="vertical-body"><div class="course-grid">${courses.map(course => renderCourse(course, (vertical.courses || []).indexOf(course))).join('')}</div></div></details>`;
    }).join('');
    if (!visibleCourses) catalogue.innerHTML = '<div class="error-box">No professional electives match your search or filter.</div>';
    updateCatalogueCount(visibleCourses);
}

function injectCatalogueFilters(catalogue) {
    if (document.getElementById('peCatalogueFilters')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'peCatalogueFilters'; wrapper.className = 'pe-filter-panel';
    wrapper.innerHTML = `<div class="pe-filter-row"><label class="pe-search-label" for="peSearch">Search electives</label><input id="peSearch" class="pe-search" type="search" placeholder="Search by subject code or title…" autocomplete="off"></div><div class="pe-filter-row pe-filter-controls"><label for="peStatus">Availability</label><select id="peStatus" class="pe-select"><option value="all">All resources</option><option value="available">Available on ACADRIX</option><option value="coming">Resources coming soon</option></select><label for="peVertical">Vertical</label><select id="peVertical" class="pe-select"><option value="all">All verticals</option>${catalogueData.map(v => `<option value="${escapeHtml(v.id)}">Vertical ${escapeHtml(v.id)} — ${escapeHtml(v.name)}</option>`).join('')}</select><button type="button" class="pe-clear" id="peClear">Clear</button></div><div class="pe-filter-meta" id="peFilterCount" aria-live="polite"></div>`;
    catalogue.parentNode.insertBefore(wrapper, catalogue);
    const search = document.getElementById('peSearch'), status = document.getElementById('peStatus'), vertical = document.getElementById('peVertical'), clear = document.getElementById('peClear');
    const apply = () => renderCatalogue(catalogueData, search.value, status.value, vertical.value);
    search.addEventListener('input', apply); status.addEventListener('change', apply); vertical.addEventListener('change', apply);
    clear.addEventListener('click', () => { search.value = ''; status.value = 'all'; vertical.value = 'all'; apply(); search.focus(); });
    injectFilterStyles();
}

function updateCatalogueCount(count) {
    const counter = document.getElementById('peFilterCount');
    if (counter) counter.textContent = `${count} ${count === 1 ? 'elective' : 'electives'} shown`;
}

function injectFilterStyles() {
    if (document.getElementById('peFilterStyles')) return;
    const style = document.createElement('style'); style.id = 'peFilterStyles';
    style.textContent = `.pe-filter-panel{margin:1rem 0 1.25rem;padding:1rem;border:1px solid rgba(127,127,127,.22);border-radius:14px;background:rgba(127,127,127,.06)}.pe-filter-row{display:flex;gap:.65rem;align-items:center;flex-wrap:wrap}.pe-search-label{font-weight:700;display:block;width:100%}.pe-search{width:100%;padding:.75rem .9rem;border:1px solid rgba(127,127,127,.3);border-radius:10px;background:inherit;color:inherit;font:inherit;box-sizing:border-box}.pe-filter-controls label{font-size:.9rem;font-weight:650}.pe-select,.pe-clear{padding:.65rem .75rem;border:1px solid rgba(127,127,127,.3);border-radius:9px;background:inherit;color:inherit;font:inherit}.pe-clear{cursor:pointer;font-weight:650}.pe-filter-meta{margin-top:.7rem;font-size:.85rem;opacity:.72}@media(max-width:640px){.pe-filter-controls>*{width:100%}.pe-filter-controls label{margin-top:.2rem}.pe-clear{width:auto}}`;
    document.head.appendChild(style);
}

function renderSemester7() {
    const section = document.getElementById('sem7');
    if (!section) return;
    section.innerHTML = `<h2>Semester 7 — R-2021 Curriculum</h2><p class="semester-intro">The standard Anna University R-2021 Mechanical Engineering Semester VII curriculum contains core theory subjects, open electives, a laboratory and summer internship. Professional Electives are registered in Semesters V and VI, not as standard Semester VII subjects.</p><div class="sem7-grid">${SEM7_SUBJECTS.map(([code,title,type]) => renderSem7Subject(code,title,type)).join('')}</div><div class="oe-panel"><h3>Open Elective Explorer — R-2021</h3><p class="oe-intro">OE-II is selected from emerging technologies. OE-III and OE-IV are selected from open electives offered by other programmes. The exact eligible course list depends on the programme offerings of the institution for that semester.</p><div class="oe-grid">${OE_PROGRAMMES.map(([code,name,desc]) => `<div class="oe-card"><strong>${escapeHtml(code)}</strong><h4>${escapeHtml(name)}</h4><p>${escapeHtml(desc)}</p><span>Check current institutional offering</span></div>`).join('')}</div><div class="oe-note"><strong>Do not assume every listed programme is available.</strong> ACADRIX will add a specific course as an eligible OE only after the corresponding official programme-wise offering/eligibility list is verified.</div></div><div class="rule"><strong>R-2021 note:</strong> OE-II is from emerging technologies; OE-III and OE-IV are from open electives offered by other programmes.</div>`;
    injectSemester7Styles();
}

function renderSem7Subject(code,title,type) {
    const url = SEM7_RESOURCES[code];
    const inner = `<div class="sem7-code">${escapeHtml(code)}</div><h3>${escapeHtml(title)}</h3><span class="sem7-tag">${escapeHtml(type)}</span>${url ? '<small class="sem7-action">Open subject hub →</small>' : '<small class="sem7-action muted">Resource hub coming soon</small>'}`;
    return url ? `<a class="sem7-subject sem7-link" href="${url}" aria-label="Open ${escapeHtml(code)} — ${escapeHtml(title)}">${inner}</a>` : `<div class="sem7-subject">${inner}</div>`;
}

function injectSemester7Styles() {
    if (document.getElementById('sem7Styles')) return;
    const style = document.createElement('style'); style.id = 'sem7Styles';
    style.textContent = `.sem7-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin:15px 0}.sem7-subject{display:block;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;color:var(--text);text-decoration:none}.sem7-subject:hover{border-color:#93c5fd;background:var(--soft);text-decoration:none}.sem7-code{font-weight:800;color:var(--accent);font-size:.85rem}.sem7-subject h3{margin:4px 0 8px}.sem7-tag{display:inline-block;border-radius:999px;background:#e2e8f0;padding:3px 8px;font-size:.72rem;color:#475569}.sem7-action{display:block;margin-top:9px;color:var(--accent);font-weight:700;font-size:.78rem}.oe-panel{margin:18px 0;padding:16px;border:1px solid var(--border);border-radius:14px;background:var(--card)}.oe-panel h3{margin-top:0;color:var(--accent)}.oe-intro{color:var(--muted)}.oe-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.oe-card{border:1px solid var(--border);border-radius:10px;padding:13px}.oe-card strong{color:var(--accent)}.oe-card h4{margin:4px 0}.oe-card p{color:var(--muted);margin:6px 0}.oe-card span{font-size:.78rem;color:var(--muted);font-weight:700}.oe-note{margin-top:12px;padding:11px 13px;border-left:4px solid #f59e0b;background:#fff7ed;border-radius:8px;font-size:.86rem}`;
    document.head.appendChild(style);
}

function renderCourse(course,index) {
    const code = String(course[0]), title = String(course[1]), resourceUrl = AVAILABLE_RESOURCES[code];
    if (resourceUrl) return `<a class="course course-available" href="${resourceUrl}" aria-label="Open ACADRIX resources for ${escapeHtml(code)} — ${escapeHtml(title)}"><div class="course-topline"><b>Row ${index+1} · ${escapeHtml(code)}</b><span class="status status-available">Available on ACADRIX</span></div><span>${escapeHtml(title)}</span><small class="course-action">Open subject hub →</small></a>`;
    return `<div class="course course-coming-soon"><div class="course-topline"><b>Row ${index+1} · ${escapeHtml(code)}</b><span class="status status-coming">Resources coming soon</span></div><span>${escapeHtml(title)}</span></div>`;
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character])); }

document.addEventListener('DOMContentLoaded', initProfessionalElectivesPage);
