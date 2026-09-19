/* AU NOTES - Improved navigation, clickable cards, mobile menu, enhanced search
   - Keeps original design and dark-mode support
   - Uses hash routing: #/dept/:deptId, #/dept/:deptId/sem:sem, #/dept/:deptId/sem:sem/:code
*/

const DEPARTMENTS = [
    { id: "mech", name: "Mechanical Engineering", icon: "⚙️", folder: "mechanical" },
    { id: "cse", name: "Computer Science", icon: "💻", folder: "cse" },
    { id: "ece", name: "Electronics & Communication", icon: "📟", folder: "electronics" },
    { id: "eee", name: "Electrical & Electronics", icon: "⚡", folder: "electrical" },
    { id: "it", name: "Information Technology", icon: "🌐", folder: "it" },
    { id: "civil", name: "Civil Engineering", icon: "🏗️", folder: "civil" }
];

// In-memory cache for loaded semester JSON data
// key: `${deptId}-r2021-sem${sem}` => array of subject objects augmented with dept and sem
const loadedData = {}; // { key: [ {code,name,units,pyqs,...,dept,sem,updated,popular} ] }
let searchIndex = null; // built lazily from all departments

// State Management
let currentState = {
    view: 'home',
    dept: null,
    sem: null,
    subjectCode: null
};

// Async-render guard: prevents a slow previous route from overwriting a newer route.
let renderGeneration = 0;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMenuToggle();
    handleHashRoute();
    render();

    window.addEventListener('hashchange', () => {
        handleHashRoute();
    });
});

// Theme Logic
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    document.body.className = savedTheme;
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.textContent = savedTheme === 'light-theme' ? '🌙' : '☀️';

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.body.classList.contains('light-theme');
            const newTheme = isLight ? 'dark-theme' : 'light-theme';
            document.body.className = newTheme;
            localStorage.setItem('theme', newTheme);
            themeToggle.textContent = isLight ? '☀️' : '🌙';
        });
    }
}

function initMenuToggle() {
    const menuToggle = document.getElementById('menuToggle');
    if (!menuToggle) return;
    menuToggle.addEventListener('click', toggleMenu);
}

function toggleMenu() {
    const nav = document.getElementById('navLinks');
    const toggle = document.getElementById('menuToggle');
    if (!nav) return;
    const isOpen = nav.classList.toggle('open');
    if (toggle) {
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }
}

function closeMenu() {
    const nav = document.getElementById('navLinks');
    const toggle = document.getElementById('menuToggle');
    if (nav) nav.classList.remove('open');
    if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
    }
}

// Hash routing parser
function handleHashRoute() {
    const hash = (location.hash || '').replace(/^#/, ''); // remove leading #
    // patterns: /, /dept/mech, /dept/mech/sem4, /dept/mech/sem4/ME4301
    if (!hash || hash === '/' ) {
        navigateTo('home', {}, true);
        return;
    }
    const parts = hash.split('/').filter(Boolean);
    if (parts[0] === 'dept') {
        const deptId = parts[1] || null;
        if (!deptId) return navigateTo('home', {}, true);
        if (!parts[2]) return navigateTo('semesters', { dept: deptId }, true);
        const semPart = parts[2];
        const semMatch = semPart.match(/^sem(\d+)$/i);
        if (semMatch) {
            const sem = parseInt(semMatch[1], 10);
            if (!parts[3]) return navigateTo('subjects', { dept: deptId, sem }, true);
            const code = parts[3];
            return navigateTo('details', { dept: deptId, sem, subjectCode: code }, true);
        }
    }
    // fallback
    navigateTo('home', {}, true);
}

// Navigation Router
function navigateTo(view, params = {}, fromHash = false) {
    currentState = { view, ...params };
    // Close mobile menu on navigation
    closeMenu();
    // set hash for shareable URLs
    if (view === 'home') {
        if (!fromHash) location.hash = '';
    } else if (view === 'semesters' && params.dept) {
        if (!fromHash) location.hash = `#/dept/${params.dept}`;
    } else if (view === 'subjects' && params.dept && params.sem) {
        if (!fromHash) location.hash = `#/dept/${params.dept}/sem${params.sem}`;
    } else if (view === 'details' && params.dept && params.sem && params.subjectCode) {
        if (!fromHash) location.hash = `#/dept/${params.dept}/sem${params.sem}/${params.subjectCode}`;
    }
    render();
}

function render() {
    const app = document.getElementById('app');
    const generation = ++renderGeneration;
    window._ACADRIX_RENDER_GENERATION = generation;
    app.innerHTML = ''; // Clear current content

    switch (currentState.view) {
        case 'home':
            renderHome(app);
            break;
        case 'semesters':
            renderSemesters(app, currentState.dept);
            break;
        case 'subjects':
            renderSubjects(app, currentState.dept, currentState.sem);
            break;
        case 'details':
            renderSubjectDetails(app, currentState.subjectCode);
            break;
        case 'browse':
            renderHome(app); // same as home but focus on departments
            break;
        default:
            renderHome(app);
    }
    window.scrollTo(0, 0);
}

// VIEW: Home (with Browse by Department, Popular Subjects, Recently Added)
async function renderHome(container) {
    const generation = window._ACADRIX_RENDER_GENERATION;
    container.innerHTML = `
        <section class="hero">
            <h1>Anna University Engineering Notes</h1>
            <p>Notes • PYQs • Question Banks • Important Questions • Video Lectures</p>
        </section>

        <section>
            <h2>Browse by Department</h2>
            <div class="grid" id="deptGrid"></div>
        </section>

        <section>
            <h2>Popular Subjects</h2>
            <div id="popularGrid" class="grid"></div>
        </section>

        <section>
            <h2>Recently Added</h2>
            <div id="recentGrid" class="grid"></div>
        </section>
    `;

    const grid = document.getElementById('deptGrid');
    DEPARTMENTS.forEach(dept => {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('role','button');
        card.setAttribute('tabindex','0');
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px">
                <div style="font-size:2rem">${dept.icon}</div>
                <div>
                    <h3 style="margin:0">${dept.name}</h3>
                    <p style="margin:0;color:var(--text-secondary)">R2021 • Semester 1–8</p>
                </div>
            </div>
            <div class="arrow">→</div>
        `;
        // Entire card clickable
        card.addEventListener('click', () => navigateTo('semesters', { dept: dept.id }));
        // support keyboard
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigateTo('semesters', { dept: dept.id }); });
        grid.appendChild(card);
    });

    // Build popular and recent lists by scanning JSONs (async)
    const popularGrid = document.getElementById('popularGrid');
    const recentGrid = document.getElementById('recentGrid');

    popularGrid.innerHTML = `<div class="card"><p>Loading popular subjects…</p></div>`;
    recentGrid.innerHTML = `<div class="card"><p>Loading recently added…</p></div>`;

    // load all department sem files (non-blocking) and collect subjects
    const allSubjects = [];
    for (const dept of DEPARTMENTS) {
        for (let s = 1; s <= 8; s++) {
            const regulations = dept.id === 'mech' ? ['r2021', 'r2025'] : [null];
            for (const regulation of regulations) {
                const arr = regulation ? await loadSemesterData(dept.id, s, regulation) : await loadSemesterData(dept.id, s);
                if (arr && arr.length) {
                    arr.forEach(sub => {
                        allSubjects.push({ ...sub, dept: dept.id, deptName: dept.name, sem: s, regulation: regulation || 'r2021' });
                    });
                }
                if (window._ACADRIX_RENDER_GENERATION !== generation) return;
            }
        }
    }

    // Abort stale async work before it can update the current route.
    if (generation !== window._ACADRIX_RENDER_GENERATION || currentState.view !== 'home' && currentState.view !== 'browse') return;

    // Popular
    const popular = allSubjects.filter(s => s.popular).slice(0, 8);
    if (popular.length === 0) {
        popularGrid.innerHTML = `<div class="card"><p>No popular subjects yet.</p></div>`;
    } else {
        popularGrid.innerHTML = popular.map(p => `
            <div class="card" role="button" onclick="navigateTo('details',{dept:'${p.dept}',sem:${p.sem},subjectCode:'${p.code}',regulation:'${p.regulation || 'r2021'}'})" tabindex="0">
                <div>
                    <p style="color:var(--accent-color);font-weight:bold;margin:0">${p.code}</p>
                    <h3 style="margin:6px 0">${p.name}</h3>
                    <p style="margin:0;color:var(--text-secondary)">${p.deptName} • ${p.regulation === 'r2025' ? 'R-2025' : 'R-2021'} • Semester ${p.sem}</p>
                </div>
                <div class="arrow">→</div>
            </div>
        `).join('');
    }

    // Recently Added (by updated field)
    const recent = allSubjects.filter(s => s.updated).sort((a,b)=> (b.updated||'').localeCompare(a.updated||'')).slice(0,8);
    if (recent.length === 0) {
        recentGrid.innerHTML = `<div class="card"><p>No recent updates.</p></div>`;
    } else {
        recentGrid.innerHTML = recent.map(r => `
            <div class="card" role="button" onclick="navigateTo('details',{dept:'${r.dept}',sem:${r.sem},subjectCode:'${r.code}',regulation:'${r.regulation || 'r2021'}'})" tabindex="0">
                <div>
                    <p style="color:var(--accent-color);font-weight:bold;margin:0">🆕 ${r.name}</p>
                    <h3 style="margin:6px 0">${r.code}</h3>
                    <p style="margin:0;color:var(--text-secondary)">Updated: ${r.updated}</p>
                </div>
                <div class="arrow">→</div>
            </div>
        `).join('');
    }
}

// VIEW: Semesters
function renderSemesters(container, deptId) {
    const dept = DEPARTMENTS.find(d => d.id === deptId) || { name: deptId };
    container.innerHTML = `
        <div class="breadcrumb"><span onclick="navigateTo('home')">Home</span> &nbsp;›&nbsp; <span>${dept.name}</span></div>
        <h2>Select Semester</h2>
        <div class="grid">
            ${[1,2,3,4,5,6,7,8].map(num => `
                <div class="card" role="button" tabindex="0" onclick="navigateTo('subjects',{dept:'${deptId}',sem:${num}})">
                    <div>
                        <h3>Semester ${num}</h3>
                        <p style="margin:0;color:var(--text-secondary)">${dept.name} - R2021</p>
                    </div>
                    <div class="arrow">→</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load semester JSON (on demand) and normalize
async function loadSemesterData(deptId, sem) {
    const key = `${deptId}-r2021-sem${sem}`;
    if (loadedData[key]) return loadedData[key];

    const dept = DEPARTMENTS.find(d => d.id === deptId);
    if (!dept) {
        loadedData[key] = [];
        return loadedData[key];
    }

    const path = `data/${dept.folder}/sem${sem}.json`;
    try {
        const res = await fetch(path);
        if (!res.ok) {
            loadedData[key] = [];
            return loadedData[key];
        }
        const json = await res.json();
        let subjects = [];
        // support two shapes: array directly, or {semester: n, subjects: []}
        if (Array.isArray(json)) {
            subjects = json;
        } else if (json && Array.isArray(json.subjects)) {
            subjects = json.subjects;
        }
        // normalize: ensure code and name exist; add dept & sem
        subjects = subjects.map(s => ({ ...s, dept: deptId, sem }));
        loadedData[key] = subjects;
        return loadedData[key];
    } catch (e) {
        console.error('Failed to load', path, e);
        loadedData[key] = [];
        return loadedData[key];
    }
}

// VIEW: Subjects List
async function renderSubjects(container, deptId, sem) {
    const generation = window._ACADRIX_RENDER_GENERATION;
    const dept = DEPARTMENTS.find(d => d.id === deptId) || { name: deptId };
    container.innerHTML = `
        <div class="breadcrumb">
            <span onclick="navigateTo('home')">Home</span> &nbsp;›&nbsp; 
            <span onclick="navigateTo('semesters',{dept:'${deptId}'})">${dept.name}</span> &nbsp;›&nbsp; 
            <span>Semester ${sem}</span>
        </div>
        <h2>Subjects</h2>
        <div id="subjectsGrid" class="grid">
            <div class="card">Loading subjects…</div>
        </div>
    `;

    const subjects = await loadSemesterData(deptId, sem);
    if (generation !== window._ACADRIX_RENDER_GENERATION || currentState.view !== 'subjects' || currentState.dept !== deptId || Number(currentState.sem) !== Number(sem)) return;
    const grid = document.getElementById('subjectsGrid');
    if (!subjects || subjects.length === 0) {
        grid.innerHTML = `<p>Content coming soon for this semester.</p>`;
        return;
    }

    grid.innerHTML = subjects.map(s => `
        <div class="card" role="button" tabindex="0" onclick="navigateTo('details',{dept:'${deptId}',sem:${sem},subjectCode:'${s.code || s.name.replace(/\s+/g,'_')}'} )">
            <div>
                <p style="color: var(--accent-color); font-weight: bold; margin:0">${s.code || ''}</p>
                <h3 style="margin:6px 0">${s.name || ''}</h3>
                <p style="margin:0;color:var(--text-secondary)">View Study Materials →</p>
            </div>
            <div class="arrow">→</div>
        </div>
    `).join('');
}

// VIEW: Subject Details
async function renderSubjectDetails(container, code) {
    const generation = window._ACADRIX_RENDER_GENERATION;
    // Find subject across loadedData
    let subject = null;
    let foundDept = null;
    let foundSem = null;
    for (const key in loadedData) {
        const arr = loadedData[key] || [];
        const found = arr.find(s => (s.code === code) || (s.code && s.code.toLowerCase() === code.toLowerCase()));
        if (found) { subject = found; foundDept = found.dept; foundSem = found.sem; break; }
    }
    // If not found, try load all depts sems lazily (useful on direct link)
    if (!subject) {
        for (const dept of DEPARTMENTS) {
            for (let i = 1; i <= 8; i++) {
                const arr = await loadSemesterData(dept.id, i);
                if (generation !== window._ACADRIX_RENDER_GENERATION || currentState.view !== 'details' || currentState.subjectCode !== code) return;
                const found = arr.find(s => (s.code === code) || (s.code && s.code.toLowerCase() === code.toLowerCase()));
                if (found) { subject = found; foundDept = dept.id; foundSem = i; break; }
            }
            if (subject) break;
        }
    }

    if (generation !== window._ACADRIX_RENDER_GENERATION || currentState.view !== 'details' || currentState.subjectCode !== code) return;

    if (!subject) {
        container.innerHTML = `<div class="breadcrumb"><span onclick="navigateTo('home')">Home</span> › <span>Subject</span></div><div class="card"><p>Subject not found.</p></div>`;
        return;
    }

    const deptObj = DEPARTMENTS.find(d => d.id === (foundDept || subject.dept)) || { name: 'Department' };
    const sem = foundSem || subject.sem || '';

    container.innerHTML = `
        <div class="breadcrumb"><span onclick="navigateTo('home')">Home</span> &nbsp;›&nbsp; <span onclick="navigateTo('semesters',{dept:'${deptObj.id || 'mech'}}')">${deptObj.name}</span> &nbsp;›&nbsp; <span onclick="navigateTo('subjects',{dept:'${deptObj.id || 'mech'}',sem:${sem}})">${sem && 'Semester ' + sem}</span> &nbsp;›&nbsp; <span>${subject.code}</span></div>
        <button class="back-btn" onclick="navigateTo('subjects',{dept:'${deptObj.id || 'mech'}',sem:${sem}${(deptObj.id || 'mech') === 'mech' ? ",regulation:'r2021'" : ''}})">← Back</button>
        <div class="subject-header">
            <p>${subject.code || ''}</p>
            <h1>${subject.name || ''}</h1>
            <p>Regulation 2021 • Anna University</p>
        </div>

        <div class="resource-section">
            <h3>📚 UNIT-WISE NOTES</h3>
            <div class="unit-grid" id="unitGrid">
                ${((subject.units || [])).map((u, i) => {
                    const link = (subject.units && subject.units[i] && (subject.units[i].notes || subject.units[i].link)) || (subject.notes && subject.notes[`u${i+1}`]) || null;
                    if (link && link !== '#') {
                        // If link is relative path, keep as-is
                        return `
                            <a class="resource-btn" href="${link}" target="_blank" rel="noopener noreferrer">
                                <div>
                                    <strong>Unit ${i+1}</strong>
                                    <div style="font-size:0.9rem">${typeof u === 'string' ? u : u.name || ''}</div>
                                </div>
                                <div style="margin-left:12px">📄 Open</div>
                            </a>
                        `;
                    } else {
                        return `
                            <div class="resource-btn disabled">
                                <div>
                                    <strong>Unit ${i+1}</strong>
                                    <div style="font-size:0.9rem">${typeof u === 'string' ? u : u.name || ''}</div>
                                </div>
                                <div style="margin-left:12px">⏳ Coming Soon</div>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        </div>

        <div class="grid">
            <div class="resource-section">
                <h3>📝 PREVIOUS YEAR QUESTIONS</h3>
                ${renderPyqs(subject.pyqs, subject.pyqStatus)}
            </div>

            <div class="resource-section">
                <h3>🎯 EXAM PREPARATION</h3>
                ${renderExamPrep(subject)}
            </div>
        </div>

        <div class="resource-section">
            <h3>🎥 RECOMMENDED VIDEOS</h3>
            ${((subject.videos || [])).length > 0 ? subject.videos.map(v => `
                <div class="video-card">
                    <div>
                        <p><strong>${v.title}</strong></p>
                        <p style="font-size:0.8rem; color:var(--text-secondary)">Channel: ${v.channel || ''}</p>
                    </div>
                    <a href="${v.url}" target="_blank" class="resource-btn">Watch →</a>
                </div>
            `).join('') : '<p>No videos recommended yet.</p>'}
        </div>
    `;
}

function renderPyqs(pyqs, status='') {
    if (!pyqs) return `<div class="resource-btn disabled">📄 Previous Year Questions — ⏳ Not added yet${status ? `<small style="display:block;margin-top:4px">${status}</small>` : ''}</div>`;
    // pyqs can be object or array
    if (Array.isArray(pyqs)) {
        if (pyqs.length === 0) return `<div class="resource-btn disabled">📄 Previous Year Questions — ⏳ Not added yet${status ? `<small style="display:block;margin-top:4px">${status}</small>` : ''}</div>`;
        return pyqs.map(p => {
            const link = p.link && p.link !== '#' ? p.link : null;
            if (link) return `<a href="${link}" class="resource-btn" target="_blank" rel="noopener noreferrer">${p.year || 'PYQ'} ${p.session ? p.session : ''} <span style="margin-left:auto">Open</span></a>`;
            return `<div class="resource-btn disabled">${p.year || 'PYQ'} ${p.session ? p.session : ''} — ⏳ Coming Soon</div>`;
        }).join('');
    }
    // object map
    const entries = Object.entries(pyqs);
    if (entries.length === 0) return `<div class="resource-btn disabled">📄 Previous Year Questions — ⏳ Not added yet${status ? `<small style="display:block;margin-top:4px">${status}</small>` : ''}</div>`;
    return entries.map(([year, url]) => (
        url && url !== '#' ? `<a href="${url}" class="resource-btn" target="_blank" rel="noopener noreferrer">${year} Paper</a>` : `<div class="resource-btn disabled">${year} — ⏳ Coming Soon</div>`
    )).join('');
}

function renderExamPrep(subject) {
    const parts = [];
    const qbank = subject.questionBank || subject.qbank || null;
    const imp = subject.importantQuestions || subject.imp || null;
    const formula = subject.formulaSheet || subject.formula || null;
    const solved = subject.solvedProblems || null;

    if (qbank && qbank !== '#') parts.push(`<a href="${qbank}" class="resource-btn" target="_blank">📖 Question Bank</a>`);
    else parts.push(`<div class="resource-btn disabled">📖 Question Bank — ⏳ Coming Soon</div>`);

    if (imp && imp !== '#') parts.push(`<a href="${imp}" class="resource-btn" target="_blank">🎯 Important Questions</a>`);
    else parts.push(`<div class="resource-btn disabled">🎯 Important Questions — ⏳ Coming Soon</div>`);

    if (formula && formula !== '#') parts.push(`<a href="${formula}" class="resource-btn" target="_blank">📐 Formula Sheet</a>`);
    else parts.push(`<div class="resource-btn disabled">📐 Formula Sheet — ⏳ Coming Soon</div>`);

    if (solved && solved !== '#') parts.push(`<a href="${solved}" class="resource-btn" target="_blank">✅ Solved Problems</a>`);
    else parts.push(`<div class="resource-btn disabled">✅ Solved Problems — ⏳ Coming Soon</div>`);

    return parts.join('\n');
}

// Search Logic with lazy indexing across all departments
async function handleSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    const query = (input.value || '').trim().toLowerCase();
    const resultsDiv = document.getElementById('searchResults');

    if (query.length < 2) {
        if (resultsDiv) resultsDiv.style.display = 'none';
        return;
    }

    if (!searchIndex) {
        searchIndex = [];
        for (const dept of DEPARTMENTS) {
            for (let i = 1; i <= 8; i++) {
                if (dept.id === 'mech' && typeof loadSemesterData === 'function') {
                    for (const regulation of ['r2021', 'r2025']) {
                        const arr = await loadSemesterData(dept.id, i, regulation);
                        arr.forEach(s => searchIndex.push({
                            ...s, dept: dept.id, deptName: dept.name, sem: i, regulation
                        }));
                    }
                } else {
                    const arr = await loadSemesterData(dept.id, i);
                    arr.forEach(s => searchIndex.push({
                        ...s, dept: dept.id, deptName: dept.name, sem: i, regulation: 'r2021'
                    }));
                }
            }
        }
    }

    const matches = [];
    searchIndex.forEach(s => {
        const code = String(s.code || '').toLowerCase();
        const name = String(s.name || '').toLowerCase();
        if (code.includes(query) || name.includes(query)) {
            matches.push({ type: 'subject', item: s });
        }
        (s.units || []).forEach((u, idx) => {
            const uname = typeof u === 'string' ? u : (u.name || u.title || '');
            if (String(uname).toLowerCase().includes(query)) {
                matches.push({ type: 'unit', item: s, unitIndex: idx });
            }
        });
    });

    if (matches.length > 0 && resultsDiv) {
        resultsDiv.innerHTML = matches.map(m => {
            const reg = m.item.regulation === 'r2025' ? 'R-2025' : 'R-2021';
            const safeCode = String(m.item.code || '').replace(/'/g, "\\'");
            if (m.type === 'subject') {
                return `<div class="search-item" onclick="selectSearch('${safeCode}', ${m.item.sem}, '${m.item.dept}', null, '${m.item.regulation}')"><strong>${m.item.code}</strong><br><small>${m.item.name} • ${reg}</small></div>`;
            }
            const u = m.item.units[m.unitIndex];
            const uName = typeof u === 'string' ? u : (u.name || u.title || '');
            return `<div class="search-item" onclick="selectSearch('${safeCode}', ${m.item.sem}, '${m.item.dept}', ${m.unitIndex}, '${m.item.regulation}')"><strong>${m.item.code} — Unit ${m.unitIndex + 1}</strong><br><small>${uName} • ${reg}</small></div>`;
        }).join('');
        resultsDiv.style.display = 'block';
    } else if (resultsDiv) {
        resultsDiv.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-secondary);min-height:120px;display:flex;flex-direction:column;justify-content:center;align-items:center;"><p style="font-size:1.1rem;font-weight:600;margin:0 0 8px">❌ No results found</p><p style="font-size:0.85rem;margin:0">Try a subject code, name, or unit topic.</p></div>`;
        resultsDiv.style.display = 'block';
    }
}

function selectSearch(code, sem = 1, dept = 'mech', unitIndex = null, regulation = 'r2021') {
    const resultsDiv = document.getElementById('searchResults');
    if (resultsDiv) resultsDiv.style.display = 'none';
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    navigateTo('details', { dept, sem, subjectCode: code, regulation });
}

// Exported for debugging
window._AUNOTES = { DEPARTMENTS, loadedData };
