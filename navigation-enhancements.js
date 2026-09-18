/* ACADRIX navigation enhancements */
(function () {
  'use strict';

  // Fix the CSE data-folder mapping before the app loads semester data.
  if (window._AUNOTES && Array.isArray(window._AUNOTES.DEPARTMENTS)) {
    const cse = window._AUNOTES.DEPARTMENTS.find(d => d.id === 'cse');
    if (cse) cse.folder = 'cse';
  }

  function addQuickAccess() {
    const app = document.getElementById('app');
    if (!app || currentViewIsNotHome()) return;
    if (document.getElementById('quickAccess')) return;

    const sections = app.querySelectorAll('section');
    const first = sections[0];
    if (!first) return;

    const section = document.createElement('section');
    section.id = 'quickAccess';
    section.className = 'quick-access-section';
    section.innerHTML = `
      <div class="section-heading-row">
        <div>
          <h2>Quick Access</h2>
          <p class="section-subtitle">Jump straight to the resources you use most.</p>
        </div>
      </div>
      <div class="quick-access-grid">
        <button class="quick-card" type="button" data-nav="mech-sem5">
          <span class="quick-icon">⚙️</span>
          <span><strong>Mechanical • Semester 5</strong><small>Core Mechanical resources</small></span>
          <span class="quick-arrow">→</span>
        </button>
        <button class="quick-card" type="button" data-nav="mech-me3591">
          <span class="quick-icon">📐</span>
          <span><strong>ME3591 • Design of Machine Elements</strong><small>Notes, PYQs and exam preparation</small></span>
          <span class="quick-arrow">→</span>
        </button>
      </div>
    `;

    first.insertAdjacentElement('afterend', section);
    section.querySelector('[data-nav="mech-sem5"]').addEventListener('click', () => {
      navigateTo('subjects', { dept: 'mech', sem: 5, regulation: 'r2021' });
    });
    section.querySelector('[data-nav="mech-me3591"]').addEventListener('click', () => {
      navigateTo('details', { dept: 'mech', sem: 5, subjectCode: 'ME3591', regulation: 'r2021' });
    });
  }

  function addSemesterHelper() {
    const app = document.getElementById('app');
    if (!app || !location.hash.match(/^#\/dept\/[^/]+$/i)) return;
    if (document.getElementById('semesterHelper')) return;

    const heading = app.querySelector('h2');
    if (!heading || heading.textContent.trim() !== 'Select Semester') return;

    const helper = document.createElement('div');
    helper.id = 'semesterHelper';
    helper.className = 'semester-helper';
    helper.innerHTML = `
      <span>Choose your semester</span>
      <span class="semester-helper-hint">You can change semester anytime from the breadcrumb.</span>
    `;
    heading.insertAdjacentElement('afterend', helper);
  }

  function currentViewIsNotHome() {
    return location.hash && location.hash !== '#/' && location.hash !== '#';
  }

  function refresh() {
    // Give script.js time to render its current view.
    setTimeout(() => {
      addQuickAccess();
      addSemesterHelper();
    }, 0);
  }

  // Navigation changes are hash changes, so refresh after every route.
  window.addEventListener('hashchange', refresh);
  document.addEventListener('DOMContentLoaded', refresh, { once: true });
})();
