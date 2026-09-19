/* ACADRIX subject-page navigation — reusable study dashboard for every subject. */
(function () {
  'use strict';

  function enhanceSubjectPage() {
    const header = document.querySelector('.subject-header');
    if (!header) return;

    const app = document.getElementById('app') || document.body;
    const oldTabs = app.querySelector('.subject-tabs');
    const oldPath = app.querySelector('.study-path');
    if (oldTabs) oldTabs.remove();
    if (oldPath) oldPath.remove();

    const sections = Array.from(document.querySelectorAll('main .resource-section'));
    if (!sections.length) return;

    // Assign stable section IDs from their headings. Only create tabs for
    // sections that actually exist on the current subject page.
    const unitSection = sections[0];
    unitSection.id = 'acadrx-units';
    sections.forEach(section => {
      const heading = section.querySelector('h3');
      const text = heading ? (heading.textContent || '').toUpperCase() : '';
      if (text.includes('PREVIOUS YEAR') || text.includes('PYQ')) section.id = 'acadrx-pyqs';
      else if (text.includes('EXAM PREPARATION') || text.includes('EXAM PREP')) section.id = 'acadrx-exam';
      else if (text.includes('RECOMMENDED VIDEOS') || text.includes('VIDEOS')) section.id = 'acadrx-videos';
    });

    const nav = document.createElement('div');
    nav.className = 'subject-tabs';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Subject resources');

    const targets = [
      ['📚 Units', 'acadrx-units'],
      ['📝 PYQs', 'acadrx-pyqs'],
      ['🎯 Exam Prep', 'acadrx-exam'],
      ['🎥 Videos', 'acadrx-videos']
    ].filter(([, id]) => document.getElementById(id));

    targets.forEach(([label, target], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'subject-tab' + (i === 0 ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', () => {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        nav.querySelectorAll('.subject-tab').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      });
      nav.appendChild(b);
    });
    header.after(nav);

    const path = document.createElement('div');
    path.className = 'study-path';
    path.innerHTML = '<span>1. Learn</span><b>→</b><span>2. Practice</span><b>→</b><span>3. Verify</span><b>→</b><span>4. Revise</span>';
    nav.after(path);

    sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const labels = { 'acadrx-units': '📚 Units', 'acadrx-pyqs': '📝 PYQs', 'acadrx-exam': '🎯 Exam Prep', 'acadrx-videos': '🎥 Videos' };
      nav.querySelectorAll('.subject-tab').forEach(b => b.classList.toggle('active', b.textContent === labels[visible.target.id]));
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0.05, 0.2, 0.5] });

    targets.forEach(([, id]) => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  const app = document.getElementById('app') || document.body;
  let lastHeaderText = '';
  let sectionObserver = null;
  const originalEnhanceSubjectPage = enhanceSubjectPage;
  enhanceSubjectPage = function () {
    if (sectionObserver) {
      sectionObserver.disconnect();
      sectionObserver = null;
    }
    originalEnhanceSubjectPage();
  };
  const observer = new MutationObserver(() => {
    const header = document.querySelector('.subject-header');
    const text = header ? header.textContent || '' : '';
    if (text !== lastHeaderText) {
      lastHeaderText = text;
      enhanceSubjectPage();
    }
  });
  observer.observe(app, { childList: true, subtree: true });
  enhanceSubjectPage();
})();
