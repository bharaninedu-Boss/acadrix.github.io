/* ACADRIX PYQ Explorer
   Regulation/semester-aware previous-year paper explorer.
   Reads only PYQs explicitly present in the subject's semester JSON.
*/
(function () {
  'use strict';

  function getRouteContext() {
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);
    const dept = parts[1] || '';
    const regulationPart = parts.find(p => /^r202[15]$/i.test(p));
    const regulation = regulationPart ? regulationPart.toLowerCase() : 'r2021';
    const semMatch = (parts.find(p => /^sem\d+$/i.test(p)) || '').match(/sem(\d+)/i);
    const sem = semMatch ? Number(semMatch[1]) : null;
    return { dept, regulation, sem };
  }

  function dataPath(ctx) {
    if (!ctx.sem || !ctx.dept) return '';
    if (ctx.dept === 'mech' && ctx.regulation === 'r2025') return `data/mechanical/r2025/sem${ctx.sem}.json`;
    const folder = { mech:'mechanical', cse:'cse', ece:'electronics', eee:'electrical', it:'it', civil:'civil' }[ctx.dept];
    return folder ? `data/${folder}/sem${ctx.sem}.json` : '';
  }

  async function init() {
    const details = document.querySelector('.subject-header');
    if (!details) return;
    const codeMatch = (details.textContent || '').match(/[A-Z]{2}\d{4}/i);
    if (!codeMatch) return;
    const code = codeMatch[0].toUpperCase();
    const section = document.getElementById('acadrx-pyqs');
    if (!section || section.dataset.explorerReady === '1') return;

    const ctx = getRouteContext();
    const path = dataPath(ctx);
    if (!path) return;

    let pyqs = [];
    try {
      const res = await fetch(path);
      if (!res.ok) return;
      const json = await res.json();
      const subjects = Array.isArray(json) ? json : (json && Array.isArray(json.subjects) ? json.subjects : []);
      const subject = subjects.find(s => String(s.code || '').toUpperCase() === code);
      if (subject && Array.isArray(subject.pyqs)) pyqs = subject.pyqs;
    } catch (e) {
      console.warn('ACADRIX PYQ Explorer could not load PYQ data.', e);
      return;
    }

    if (!pyqs.length) return;
    section.dataset.explorerReady = '1';

    const wrapper = document.createElement('div');
    wrapper.className = 'pyq-explorer';
    wrapper.innerHTML = `
      <div class="pyq-toolbar">
        <input id="pyqSearch" type="search" placeholder="Search year, session or topic..." aria-label="Search previous year questions">
        <select id="pyqYear" aria-label="Filter by year"><option value="">All years</option></select>
        <select id="pyqSession" aria-label="Filter by session"><option value="">All sessions</option></select>
      </div>
      <div id="pyqCount" class="pyq-count"></div>
      <div id="pyqList" class="pyq-list"></div>
    `;
    section.appendChild(wrapper);

    const year = wrapper.querySelector('#pyqYear');
    const session = wrapper.querySelector('#pyqSession');
    const search = wrapper.querySelector('#pyqSearch');
    const years = [...new Set(pyqs.map(p => p.year).filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a)));
    const sessions = [...new Set(pyqs.map(p => p.session).filter(Boolean))].sort();
    years.forEach(v => year.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`));
    sessions.forEach(v => session.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`));

    function render() {
      const q = search.value.trim().toLowerCase();
      const filtered = pyqs.filter(p => {
        const hay = `${p.year || ''} ${p.session || ''} ${p.topic || ''} ${p.title || ''}`.toLowerCase();
        return (!q || hay.includes(q)) && (!year.value || String(p.year) === year.value) && (!session.value || p.session === session.value);
      });
      wrapper.querySelector('#pyqCount').textContent = `${filtered.length} verified paper${filtered.length === 1 ? '' : 's'} found`;
      const list = wrapper.querySelector('#pyqList');
      if (!filtered.length) {
        list.innerHTML = '<div class="pyq-empty">No matching verified question papers.</div>';
        return;
      }
      list.innerHTML = filtered.map(p => `
        <article class="pyq-card">
          <div><strong>${escapeHtml(p.year || 'Year')}</strong><span>${escapeHtml(p.session || '')}</span>${p.topic ? `<small>${escapeHtml(p.topic)}</small>` : ''}</div>
          ${p.link && p.link !== '#' ? `<a class="download-btn" href="${escapeAttr(p.link)}" target="_blank" rel="noopener">Open PDF ↗</a>` : ''}
        </article>`).join('');
    }

    search.addEventListener('input', render);
    year.addEventListener('change', render);
    session.addEventListener('change', render);
    render();
  }

  function escapeHtml(v) {
    return String(v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }
  function escapeAttr(v) { return escapeHtml(v).replace(/`/g, '&#96;'); }

  function boot() {
    init();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
