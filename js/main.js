// ===================================================================
// Daniel Norouzi · shared behaviour for every page
// Theme toggle, mobile menu and the projects page reveal.
// ===================================================================

(function () {
  const root = document.documentElement;

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* private mode */ }
  }

  // ---- Theme: saved choice, else the system setting ----
  const stored = storageGet('theme');
  if (stored === 'dark') root.setAttribute('data-theme', 'dark');
  else if (stored === 'light') root.removeAttribute('data-theme');
  else if (!root.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }

  document.addEventListener('DOMContentLoaded', function () {
    const toggles = document.querySelectorAll('.theme-toggle');
    function syncToggle() {
      const dark = root.getAttribute('data-theme') === 'dark';
      toggles.forEach((btn) => {
        btn.textContent = dark ? '☀' : '☾';
        btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      });
    }
    syncToggle();
    toggles.forEach((btn) => btn.addEventListener('click', function () {
      const dark = root.getAttribute('data-theme') === 'dark';
      if (dark) root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', 'dark');
      storageSet('theme', dark ? 'light' : 'dark');
      syncToggle();
    }));

    // ---- Mobile menu ----
    const menuBtn = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.main-nav');
    if (menuBtn && nav) {
      const setOpen = (open) => {
        nav.classList.toggle('open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
      };
      menuBtn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
      nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); menuBtn.focus(); }
      });
    }

    // ---- Projects page reveal ----
    const reveal = document.querySelectorAll('.fade-up');
    if ('IntersectionObserver' in window && reveal.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('in-view'); io.unobserve(entry.target); }
        });
      }, { threshold: 0.12 });
      reveal.forEach((el) => io.observe(el));
    } else {
      reveal.forEach((el) => el.classList.add('in-view'));
    }
  });
})();
