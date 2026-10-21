// ===================================================================
// Daniel Norouzi — Home page scroll story
// Each scene turns its scroll position into a 0–1 progress value and
// renders from it. Values ease toward their target every frame, so the
// motion follows the scrollbar without hijacking it.
// ===================================================================

(function () {
  const root = document.documentElement;
  if (!root.classList.contains('motion')) return; // reduced motion: static page
  root.classList.add('js-ready');

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const range = (p, start, end) => clamp((p - start) / (end - start));
  const vh = () => window.innerHeight;
  const pad2 = (n) => String(n).padStart(2, '0');

  // 0 when the element's top is 90% down the viewport, 1 when its bottom reaches 60%.
  function enterProgress(el) {
    const r = el.getBoundingClientRect();
    const h = vh();
    return clamp((h * 0.9 - r.top) / (h * 0.3 + r.height));
  }

  // 0 when the pin sticks, 1 when it lets go. If CSS has un-pinned the
  // scene (small screens), fall back to how far it has scrolled into view.
  function pinProgress(el, pin) {
    const travel = el.offsetHeight - pin.offsetHeight;
    if (travel > 1) return clamp(-el.getBoundingClientRect().top / travel);
    return enterProgress(el);
  }

  function splitWords(node) {
    const words = node.textContent.trim().split(/\s+/);
    node.textContent = '';
    return words.map((word, i) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      node.appendChild(span);
      if (i < words.length - 1) node.appendChild(document.createTextNode(' '));
      return span;
    });
  }

  function splitChars(node) {
    const label = node.textContent.trim();
    const words = label.split(/\s+/);
    const chars = [];
    node.textContent = '';
    node.setAttribute('aria-label', label);
    words.forEach((word, i) => {
      const w = document.createElement('span');
      w.className = 'fw';
      w.setAttribute('aria-hidden', 'true');
      Array.from(word).forEach((ch) => {
        const c = document.createElement('span');
        c.className = ch === '.' ? 'fc dot' : 'fc';
        c.textContent = ch;
        w.appendChild(c);
        chars.push(c);
      });
      node.appendChild(w);
      if (i < words.length - 1) node.appendChild(document.createTextNode(' '));
    });
    return chars;
  }

  const scenes = [];
  const layouts = [];
  function scene(el, measure, render, ease) {
    if (!el) return;
    scenes.push({ measure, render, ease: ease || 0.14, cur: null, last: null });
  }

  // ---- S1 · Start lights ----
  (function () {
    const el = document.querySelector('.scene-start');
    if (!el) return;
    const pin = el.querySelector('.scene-pin');
    const cols = el.querySelectorAll('.gantry-col');
    const top = el.querySelector('.start-top');
    const status = el.querySelector('.start-status');
    const lineA = el.querySelector('.line-a');
    const lineB = el.querySelector('.line-b');
    const rest = el.querySelector('.start-rest');
    const cue = el.querySelector('.scroll-cue');
    const LIGHTS_OUT = 0.6;
    let lastStatus = '';

    scene(el, () => pinProgress(el, pin), (p) => {
      const out = p >= LIGHTS_OUT;
      let lit = 0;
      cols.forEach((col, i) => {
        const on = !out && p >= 0.06 + i * 0.11;
        col.classList.toggle('on', on);
        if (on) lit++;
      });
      el.classList.toggle('is-out', out);
      const text = out ? 'Lights out. Away we go.' : lit ? 'Lights ' + lit + ' / 5' : 'Scroll to start the lights';
      if (text !== lastStatus) { status.textContent = text; lastStatus = text; }

      // the name fills in line by line while the lights come on
      lineA.style.setProperty('--f', range(p, 0.02, 0.3).toFixed(4));
      lineB.style.setProperty('--f', range(p, 0.3, 0.58).toFixed(4));

      // after lights out the two lines split apart
      const t = range(p, 0.66, 1);
      const e = t * t;
      lineA.style.transform = 'translate3d(' + (-e * 14).toFixed(2) + 'vw,0,0)';
      lineB.style.transform = 'translate3d(' + (e * 14).toFixed(2) + 'vw,0,0)';

      const g = range(p, 0.64, 0.8);
      top.style.opacity = (1 - g).toFixed(3);
      top.style.transform = 'translate3d(0,' + (-g * 24).toFixed(1) + 'px,0)';

      const r = range(p, 0.72, 1);
      rest.style.opacity = (1 - r * 0.9).toFixed(3);
      rest.style.transform = 'translate3d(0,' + (-r * 40).toFixed(1) + 'px,0)';
      if (cue) cue.style.opacity = (1 - range(p, 0, 0.08)).toFixed(3);
    });
  })();

  // ---- S2 · Driver profile: words light up, portrait opens ----
  (function () {
    const el = document.querySelector('.scene-driver');
    if (!el) return;
    const pin = el.querySelector('.scene-pin');
    const portrait = el.querySelector('.portrait');
    const img = portrait.querySelector('img');
    const words = splitWords(el.querySelector('.reveal-text'));
    let shown = -1;

    scene(el, () => pinProgress(el, pin), (p) => {
      const n = Math.round(range(p, 0.04, 0.72) * words.length);
      if (n !== shown) {
        words.forEach((w, i) => w.classList.toggle('lit', i < n));
        shown = n;
      }
      portrait.style.setProperty('--clip', ((1 - range(p, 0, 0.45)) * 45).toFixed(2) + '%');
      img.style.setProperty('--zoom', (1.2 - 0.2 * range(p, 0, 0.7)).toFixed(4));
    });
  })();

  // ---- Toolkit: rows slide in opposite directions ----
  (function () {
    const el = document.querySelector('.toolkit');
    if (!el) return;
    const a = el.querySelector('.row-a');
    const b = el.querySelector('.row-b');
    scene(el, () => {
      const r = el.getBoundingClientRect();
      return clamp((vh() - r.top) / (vh() + r.height));
    }, (p) => {
      a.style.transform = 'translate3d(' + (-p * 22).toFixed(3) + '%,0,0)';
      b.style.transform = 'translate3d(' + (-22 + p * 22).toFixed(3) + '%,0,0)';
    }, 0.1);
  })();

  // ---- S3 · Build cards: each one sinks back as the next stacks on top ----
  (function () {
    const cards = Array.from(document.querySelectorAll('.build-card'));
    const stickTops = [];
    layouts.push(() => {
      cards.forEach((card, i) => { stickTops[i] = parseFloat(getComputedStyle(card).top) || 0; });
    });

    cards.forEach((card, i) => {
      const next = cards[i + 1];
      const img = card.querySelector('.build-media img');

      if (next) {
        scene(card, () => {
          const stick = stickTops[i + 1] || 0;
          return clamp((vh() - next.getBoundingClientRect().top) / (vh() - stick));
        }, (q) => {
          card.style.setProperty('--s', (1 - q * 0.06).toFixed(4));
          card.style.setProperty('--dim', q.toFixed(3));
        });
      }

      scene(img, () => {
        const r = card.getBoundingClientRect();
        return clamp((vh() - r.top) / (vh() + r.height));
      }, (q) => {
        img.style.setProperty('--py', ((0.5 - q) * 48).toFixed(1) + 'px');
      });
    });
  })();

  // ---- S4 · Hackathons: vertical scroll drives a sideways track ----
  (function () {
    const el = document.querySelector('.hscroll');
    if (!el) return;
    const pin = el.querySelector('.hscroll-pin');
    const track = el.querySelector('.hscroll-track');
    const panels = Array.from(track.children);
    const now = el.querySelector('.count-now');
    el.querySelector('.count-total').textContent = pad2(panels.length);
    let dist = 0;
    let lastIdx = -1;

    layouts.push(() => {
      // short landscape screens un-pin the track in CSS and scroll it natively
      if (getComputedStyle(pin).position !== 'sticky') {
        dist = 0;
        el.style.height = '';
        panels.forEach((panel) => panel.classList.add('in'));
        return;
      }
      dist = Math.max(0, track.scrollWidth - pin.clientWidth);
      el.style.height = (dist + pin.offsetHeight) + 'px';
    });

    scene(el, () => pinProgress(el, pin), (p) => {
      const x = -p * dist;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      const w = pin.clientWidth;
      panels.forEach((panel) => {
        if (panel.offsetLeft + x < w * 0.82) panel.classList.add('in');
      });
      const idx = Math.round(p * (panels.length - 1));
      if (idx !== lastIdx) { now.textContent = pad2(idx + 1); lastIdx = idx; }
    });
  })();

  // ---- S5 · Garage cards tilt into place ----
  (function () {
    const grid = document.querySelector('.garage-grid');
    if (!grid) return;
    Array.from(grid.children).forEach((card, i) => {
      const dir = i % 2 ? 1 : -1;
      // measured from layout offsets so the card's own transform doesn't feed back
      scene(card, () => {
        const top = grid.getBoundingClientRect().top + card.offsetTop - grid.offsetTop;
        return clamp((vh() - top) / (vh() * 0.45));
      }, (q) => {
        const e = 1 - Math.pow(1 - q, 3);
        card.style.setProperty('--ty', ((1 - e) * 90).toFixed(1) + 'px');
        card.style.setProperty('--rot', ((1 - e) * 4 * dir).toFixed(2) + 'deg');
        card.style.opacity = (0.15 + 0.85 * e).toFixed(3);
      }, 0.12);
    });
  })();

  // ---- S6 · Finish: chequered flag waves in, headline rises ----
  (function () {
    const el = document.querySelector('.scene-finish');
    if (!el) return;
    const pin = el.querySelector('.scene-pin');
    const chequer = el.querySelector('.chequer');
    const rest = el.querySelector('.finish-rest');
    const chars = splitChars(el.querySelector('.finish-title'));

    // starts as the section enters from below, not when it pins
    scene(el, () => {
      const travel = Math.max(1, el.offsetHeight - pin.offsetHeight);
      return clamp((vh() - el.getBoundingClientRect().top) / (vh() + travel));
    }, (p) => {
      chequer.style.setProperty('--cq', range(p, 0.1, 0.55).toFixed(4));
      chars.forEach((c, i) => {
        const q = range(p, 0.18 + i * 0.012, 0.42 + i * 0.012);
        c.style.transform = 'translate3d(0,' + ((1 - q) * 105).toFixed(1) + '%,0)';
      });
      const r = range(p, 0.42, 0.62);
      rest.style.opacity = r.toFixed(3);
      rest.style.transform = 'translate3d(0,' + ((1 - r) * 24).toFixed(1) + 'px,0)';
    });
  })();

  // ---- Lap progress bar + sector rail ----
  const bar = document.querySelector('.lap-progress span');
  const rail = document.querySelector('.sector-rail');
  const railLinks = Array.from(document.querySelectorAll('.sector-rail a'));
  const railTargets = railLinks.map((a) => document.querySelector(a.getAttribute('href')));
  let lastActive = -1;

  function chrome() {
    const max = root.scrollHeight - vh();
    const p = max > 0 ? clamp(window.scrollY / max) : 0;
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';

    let active = 0;
    railTargets.forEach((t, i) => {
      if (t && t.getBoundingClientRect().top <= vh() * 0.45) active = i;
    });
    if (active !== lastActive) {
      railLinks.forEach((a, i) => {
        a.classList.toggle('active', i === active);
        a.classList.toggle('passed', i < active);
      });
      lastActive = active;
      // the sideways track runs edge to edge, so step the rail out of its way
      if (rail) rail.classList.toggle('over-track', !!(railTargets[active] && railTargets[active].classList.contains('hscroll')));
    }
  }

  // ---- Frame loop: runs only while something is still easing ----
  let ticking = false;
  function frame() {
    let moving = false;
    for (const s of scenes) {
      const target = s.measure();
      if (s.cur === null) {
        s.cur = target;
      } else {
        const d = target - s.cur;
        if (Math.abs(d) > 0.0005) { s.cur += d * s.ease; moving = true; }
        else s.cur = target;
      }
      if (s.cur !== s.last) { s.render(s.cur); s.last = s.cur; }
    }
    chrome();
    if (moving) requestAnimationFrame(frame);
    else ticking = false;
  }
  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  function relayout() {
    layouts.forEach((fn) => fn());
    request();
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', relayout);
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  relayout();
})();
