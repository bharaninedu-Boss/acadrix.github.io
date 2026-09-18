/* ACADRIX Professional Electives integration
   Adds the dedicated Mechanical Engineering Professional Electives hub
   ONLY to the R-2021 Mechanical Engineering semester selector.
   R-2025 has a different elective syllabus and must remain separate.
*/
(function () {
    const PE_URL = 'data/mechanical/professional-electives/';

    function isR2021MechanicalRoute() {
        const hash = (location.hash || '').toLowerCase();
        return hash === '#/dept/mech/r2021' || hash.startsWith('#/dept/mech/r2021/');
    }

    function isR2021MechanicalPage() {
        if (!isR2021MechanicalRoute()) return false;
        const app = document.getElementById('app');
        const breadcrumb = app && app.querySelector('.breadcrumb');
        // Use the rendered regulation label as a second hard guard. This prevents
        // an R-2021 PE card from surviving an SPA route/render transition into R-2025.
        return !!breadcrumb && breadcrumb.textContent.includes('Regulation 2021');
    }

    function removeProfessionalElectivesCard() {
        const app = document.getElementById('app');
        if (!app) return;
        const card = app.querySelector('[data-acadrix-pe-card]');
        if (card) card.remove();
    }

    function addProfessionalElectivesCard() {
        const app = document.getElementById('app');
        if (!app) return;

        // Professional Electives currently belong to the R-2021 work only.
        // Never show this card while browsing the R-2025 curriculum.
        if (!isR2021MechanicalPage()) {
            removeProfessionalElectivesCard();
            return;
        }

        const semesterHeading = Array.from(app.querySelectorAll('h2')).find(
            h => h.textContent.trim() === 'Select Semester'
        );
        if (!semesterHeading) return;

        const grid = semesterHeading.nextElementSibling;
        if (!grid || !grid.classList.contains('grid')) return;

        if (app.querySelector('[data-acadrix-pe-card]')) return;

        const card = document.createElement('a');
        card.href = PE_URL;
        card.className = 'card pe-entry-card';
        card.setAttribute('data-acadrix-pe-card', 'true');
        card.setAttribute('aria-label', 'Open R-2021 Mechanical Engineering Professional Electives');
        card.innerHTML = `
            <div>
                <p class="pe-entry-label">PROFESSIONAL ELECTIVES · R-2021</p>
                <h3>Professional Electives</h3>
                <p>Browse Semester 5, Semester 6 and Semester 7 elective sections, with available ACADRIX study resources.</p>
                <div class="pe-entry-tags">
                    <span>Semester 5</span>
                    <span>Semester 6</span>
                    <span>Semester 7</span>
                </div>
            </div>
            <div class="arrow" aria-hidden="true">→</div>
        `;
        grid.appendChild(card);
    }

    function getR2021Semester() {
        const hash = (location.hash || '').toLowerCase();
        const match = hash.match(/^#\/dept\/mech\/r2021\/sem(5|6|7)(?:\/|$)/);
        return match ? Number(match[1]) : null;
    }

    function removeSemesterElectivesCard() {
        const app = document.getElementById('app');
        if (!app) return;
        const card = app.querySelector('[data-acadrix-sem-pe-card]');
        if (card) card.remove();
    }

    function addSemesterElectivesCard() {
        const app = document.getElementById('app');
        if (!app) return;

        const semester = getR2021Semester();
        if (!semester) {
            removeSemesterElectivesCard();
            return;
        }

        const grid = app.querySelector('#subjectsGrid');
        if (!grid || !grid.classList.contains('grid')) return;
        if (grid.querySelector('[data-acadrix-sem-pe-card]')) return;

        const card = document.createElement('a');
        card.href = PE_URL + '#sem' + semester;
        card.className = 'card pe-entry-card';
        card.setAttribute('data-acadrix-sem-pe-card', 'true');
        card.setAttribute('aria-label', 'Open Professional Electives for Semester ' + semester);
        card.innerHTML = `
            <div>
                <p class="pe-entry-label">PROFESSIONAL ELECTIVES · R-2021</p>
                <h3>Semester ${semester} Professional Electives</h3>
                <p>Open the dedicated elective hub for Semester ${semester}, including elective sections and available study resources.</p>
                <div class="pe-entry-tags">
                    <span>Semester ${semester}</span>
                    <span>Elective Hub</span>
                </div>
            </div>
            <div class="arrow" aria-hidden="true">→</div>
        `;
        grid.insertBefore(card, grid.firstChild);
    }

    function init() {
        addProfessionalElectivesCard();
        addSemesterElectivesCard();
        const app = document.getElementById('app');
        if (!app) return;
        new MutationObserver(() => {
            addProfessionalElectivesCard();
            addSemesterElectivesCard();
        }).observe(app, { childList: true, subtree: true });
        window.addEventListener('hashchange', () => {
            addProfessionalElectivesCard();
            addSemesterElectivesCard();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
