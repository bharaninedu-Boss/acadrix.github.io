/* ACADRIX PYQ Analysis
   Evidence-based exam intelligence for subjects with verified PYQ coverage.
   Never treats practice questions or predictions as university PYQs.
*/
(function () {
  'use strict';

  const ANALYSIS = {
    ME3591: {
      title: 'ME3591 Exam Intelligence',
      published: false,
      note: 'Exam intelligence is temporarily hidden because the three ME3591 paper PDFs referenced during development are not currently published in the ACADRIX repository.',
      papers: 0
    },
    ME3592: {
      title: 'ME3592 Exam Intelligence',
      published: false,
      note: 'Exam intelligence is temporarily hidden because the three ME3592 paper PDFs supplied during development are not currently published in the ACADRIX repository.',
      note: 'Based on the supplied Apr/May 2024, Nov/Dec 2024 and Nov/Dec 2023 university papers. Recurrence is used for revision priority only; it is not a prediction of the next paper.',
      papers: 3,
      patterns: [
        ['Linear/angular measuring instruments', '3/3 papers', 'Very High', 2],
        ['Fits, tolerances and tolerance specification', '3/3 papers', 'Very High', 3],
        ['Surface roughness / surface metrology', '3/3 papers', 'Very High', 4],
        ['CMM and coordinate measurement', '3/3 papers', 'Very High', 5],
        ['Machine vision', '3/3 papers', 'Very High', 5],
        ['Laser interferometer / alignment', '3/3 papers', 'Very High', 5],
        ['Calibration', '2/3 papers', 'High', 1],
        ['Errors and uncertainty', '2/3 papers', 'High', 1],
        ['GD&T / form tolerances', '2/3 papers', 'High', 4],
        ['Autocollimator', '2/3 papers', 'High', 2],
        ['Sine bar / angular measurement', '2/3 papers', 'High', 2],
        ['Pneumatic comparator / back-pressure gauge', '2/3 papers', 'High', 2]
      ],
      units: [
        ['Unit I', 'Measurement process, SWIPE, errors, uncertainty, statistics, MSA, calibration and air gauging', 'High', 1],
        ['Unit II', 'Linear/angular instruments, comparators, optical measurement, threads and gears', 'Very High', 2],
        ['Unit III', 'Interchangeability, fits, gauges, tolerance analysis, process capability and stack-up', 'Very High', 3],
        ['Unit IV', 'GD&T, datums, form deviations, surface finish and 3D surface metrology', 'Very High', 4],
        ['Unit V', 'Lasers, interferometers, CMM, machine vision, in-process monitoring, CT and white-light scanners', 'Very High', 5]
      ],
      unitLinks: {
        1: 'data/mechanical/ME3592_Unit1_Notes.html',
        2: 'data/mechanical/ME3592_Unit2_Notes.html',
        3: 'data/mechanical/ME3592_Unit3_Notes.html',
        4: 'data/mechanical/ME3592_Unit4_Notes.html',
        5: 'data/mechanical/ME3592_Unit5_Notes.html'
      }
    }
  };

  // Expose the verified dataset so future subjects can register their own
  // evidence without rewriting the rendering engine.
  window.ACADRIX_PYQ_ANALYSIS = ANALYSIS;

  function priorityClass(value) {
    return String(value).toLowerCase().replace(/\s+/g, '-');
  }

  function unitLink(data, unit) {
    const href = data.unitLinks && data.unitLinks[unit];
    return href ? `<a class="analysis-unit-link" href="${escapeAttr(href)}">Unit ${unit} Notes ↗</a>` : '';
  }

  function init() {
    const header = document.querySelector('.subject-header');
    if (!header) return;
    const codeText = header.textContent || '';
    const match = codeText.match(/[A-Z]{2}\d{4}/i);
    if (!match) return;
    const code = match[0].toUpperCase();
    const data = window.ACADRIX_PYQ_ANALYSIS[code];
    if (!data || document.getElementById('acadrx-pyq-analysis')) return;

    const anchor = document.getElementById('acadrx-pyqs');
    if (!anchor) return;

    if (data.published === false) {
      const section = document.createElement('section');
      section.id = 'acadrx-pyq-analysis';
      section.className = 'resource-section pyq-analysis';
      section.innerHTML = `
        <div class="pyq-analysis-head">
          <div>
            <span class="analysis-kicker">EXAM INTELLIGENCE</span>
            <h2>${escapeHtml(data.title)}</h2>
            <p>${escapeHtml(data.note)}</p>
          </div>
          <div class="analysis-stat"><strong>0</strong><span>published papers</span></div>
        </div>
        <div class="exam-intelligence-callout">
          <strong>📄 Source PDFs not published</strong>
          <span>ACADRIX will show recurring-paper analysis again when the underlying question-paper PDFs are actually published in the repository.</span>
        </div>`;
      anchor.parentNode.insertBefore(section, anchor);
      return;
    }
    if (!anchor) return;

    const section = document.createElement('section');
    section.id = 'acadrx-pyq-analysis';
    section.className = 'resource-section pyq-analysis';
    section.innerHTML = `
      <div class="pyq-analysis-head">
        <div>
          <span class="analysis-kicker">EXAM INTELLIGENCE</span>
          <h2>${escapeHtml(data.title)}</h2>
          <p>${escapeHtml(data.note)}</p>
        </div>
        <div class="analysis-stat"><strong>${data.papers}</strong><span>verified papers analysed</span></div>
      </div>
      <div class="exam-intelligence-callout">
        <strong>📌 Study First</strong>
        <span>Start with the Very High units, then High units. Use the direct note links below; Moderate topics are revision items.</span>
      </div>
      <div class="study-first-grid">
        ${data.units.map(u => `<a class="study-first-card" href="${escapeAttr(data.unitLinks[u[3]])}"><div class="study-first-top"><span class="study-step">${escapeHtml(u[3])}</span><strong>${escapeHtml(u[0])}</strong><span class="priority priority-${priorityClass(u[2])}">${escapeHtml(u[2])}</span></div><p>${escapeHtml(u[1])}</p><span class="study-first-action">Open Unit Notes →</span></a>`).join('')}
      </div>
      <h3>Most recurring topics</h3>
      <div class="analysis-table-wrap">
        <table class="analysis-table">
          <thead><tr><th>Topic</th><th>Coverage</th><th>Priority</th><th>Notes</th></tr></thead>
          <tbody>${data.patterns.map(r => `<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td><td><span class="priority priority-${priorityClass(r[2])}">${escapeHtml(r[2])}</span></td><td>${unitLink(data, r[3])}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <h3>Unit-wise revision priority</h3>
      <div class="unit-priority-grid">
        ${data.units.map(u => `<article><div class="unit-priority-title"><strong>${escapeHtml(u[0])}</strong><span class="priority priority-${priorityClass(u[2])}">${escapeHtml(u[2])}</span></div><p>${escapeHtml(u[1])}</p>${unitLink(data, u[3])}</article>`).join('')}
      </div>
      <p class="analysis-disclaimer"><strong>Evidence rule:</strong> frequency is calculated only from the explicitly listed verified papers. Topic-to-unit links identify the corresponding syllabus unit; they do not claim that every individual paper question has been manually mapped.</p>
    `;

    anchor.parentNode.insertBefore(section, anchor);
  }

  function escapeHtml(v) {
    return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function escapeAttr(v) {
    return escapeHtml(v).replace(/`/g, '&#96;');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
