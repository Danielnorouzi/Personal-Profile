// ===================================================================
// Daniel Norouzi · shared behaviour for every page
// The bar's ink follows the chapter beneath it, button and link labels
// get a rolling copy, and blocks reveal as they come up the screen.
// ===================================================================

(function () {
  // the previous design stored a theme; this one has a single look
  try { localStorage.removeItem('theme'); } catch (e) { /* private mode */ }

  document.addEventListener('DOMContentLoaded', function () {
    rollLabels();
    followInk();
    reveal('[data-reveal]');
  });

  // Wrap a button's text in two stacked copies so CSS can roll one out and the other in.
  function rollLabels() {
    document.querySelectorAll('.btn, .link').forEach((el) => {
      if (el.querySelector('.roll')) return;
      const text = Array.from(el.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
      if (!text) return;
      const label = text.textContent.trim();
      const roll = document.createElement('span');
      roll.className = 'roll';
      const shown = document.createElement('span');
      shown.textContent = label;
      const copy = document.createElement('span');
      copy.textContent = label;
      copy.setAttribute('aria-hidden', 'true');
      roll.append(shown, copy);
      el.replaceChild(roll, text);
    });
  }

  // The glass bar reads dark over plaster and light over the night chapter.
  function followInk() {
    const bar = document.querySelector('.bar');
    if (!bar || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) bar.dataset.ink = e.target.dataset.ink;
    }, { rootMargin: '-40px 0px -92% 0px' });
    document.querySelectorAll('main [data-ink], footer[data-ink]').forEach((s) => {
      if (!s.classList.contains('glass')) io.observe(s);
    });
  }

  // Adds .is-in once, as each element comes up from the bottom of the screen.
  function reveal(selector) {
    const els = document.querySelectorAll(selector);
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
    els.forEach((e) => io.observe(e));
  }
})();
