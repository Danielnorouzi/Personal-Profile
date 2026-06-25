// ===================================================================
// Daniel Norouzi — Portfolio shared behavior
// ===================================================================

(function () {
  // ---- Theme toggle ----
  const root = document.documentElement;
  const stored = localStorage_safe_get('theme');
  if (stored) root.setAttribute('data-theme', stored);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }

  function localStorage_safe_get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function localStorage_safe_set(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const toggleBtns = document.querySelectorAll('.theme-toggle');
    function updateIcon() {
      const isDark = root.getAttribute('data-theme') === 'dark';
      toggleBtns.forEach(btn => { btn.textContent = isDark ? '☀' : '☾'; });
    }
    updateIcon();
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const isDark = root.getAttribute('data-theme') === 'dark';
        if (isDark) {
          root.removeAttribute('data-theme');
          localStorage_safe_set('theme', 'light');
        } else {
          root.setAttribute('data-theme', 'dark');
          localStorage_safe_set('theme', 'dark');
        }
        updateIcon();
      });
    });

    // ---- Mobile nav toggle ----
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (mobileToggle && mainNav) {
      mobileToggle.addEventListener('click', function () {
        mainNav.classList.toggle('open');
      });
    }

    // ---- Scroll reveal ----
    const revealEls = document.querySelectorAll('.fade-up');
    if ('IntersectionObserver' in window && revealEls.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealEls.forEach(el => observer.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('in-view'));
    }
  });
})();
