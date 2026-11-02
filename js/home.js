// ===================================================================
// Daniel Norouzi · home page
// Motion (motion.dev) links scenes to the scrollbar; ascii.js draws the
// portrait and the car. One function per scene, in page order, plus the
// two builds you can try: Daily's time check and a Reel Cards review.
// ===================================================================

(function () {
  const root = document.documentElement;
  const M = window.Motion;
  const A = window.Ascii;

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const range = (p, a, b) => clamp((p - a) / (b - a));
  const easeOut3 = (t) => 1 - Math.pow(1 - t, 3);
  const EASE_IN_OUT = [0.76, 0, 0.24, 1];

  // Canvas colours come from the CSS tokens; hex only where a browser can't paint oklch().
  const probe = document.createElement('canvas').getContext('2d');
  function token(name, fallback) {
    const value = getComputedStyle(root).getPropertyValue(name).trim();
    probe.fillStyle = '#010203';
    probe.fillStyle = value;
    return probe.fillStyle === '#010203' ? fallback : value;
  }
  const C = {
    accent: token('--accent', '#A21921'),
    ink: token('--ink', '#12171B'),
    bg: token('--bg', '#DEE0E2'),
    surface: token('--surface', '#EBEDEF'),
    deepInk: token('--deep-ink', '#ECEFF2'),
    deepAccent: token('--deep-accent', '#EF6661'),
  };

  // Keep the face and shirt, fade the bokeh behind them with a soft oval.
  const faceMask = (u, v) => {
    const dx = (u - 0.53) / 0.44;
    const dy = (v - 0.47) / 0.62;
    const t = clamp((Math.sqrt(dx * dx + dy * dy) - 0.62) / 0.38);
    return 1 - t * t * (3 - 2 * t);
  };
  const portrait = (extra) => Object.assign({
    contrast: 1.6,
    gamma: 1.1,
    threshold: 0.12,
    mask: faceMask,
    color: C.accent,
    accent: C.ink,
    minAlpha: 0.34,
  }, extra);
  const carOptions = {
    crop: [40, 206, 1414, 318],
    mirror: true,          // the photo faces left; the car drives right
    invert: true,          // a dark car on a light ground becomes dense glyphs
    contrast: 1,
    gamma: 2.4,            // spreads the near-black body into shading
    threshold: 0.16,
    dither: 0.6,
    minAlpha: 0.5,
    color: C.deepInk,
    accent: C.deepAccent,
    cols: (w) => Math.round(clamp(w / 6.2, 70, 190)),
  };

  const layouts = [];
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => layouts.forEach((fn) => fn()), 150);
  });

  // the two live builds work with or without motion
  dailyCheck();
  reelDeck();

  if (!A) return;
  if (!root.classList.contains('motion') || !M) {
    root.classList.remove('motion', 'intro-on');
    staticArt();
    return;
  }
  root.classList.add('live');
  const { animate, scroll } = M;

  // Motion hands over raw scroll progress; each scene eases toward it so
  // movement has weight without falling behind the scrollbar.
  function follower(render, ease = 0.14) {
    let cur = null, target = 0, raf = 0;
    function loop() {
      raf = 0;
      const d = target - cur;
      if (Math.abs(d) > 0.0004) { cur += d * ease; raf = requestAnimationFrame(loop); }
      else cur = target;
      render(cur);
    }
    return (p) => {
      target = p;
      if (cur === null) { cur = p; render(p); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    };
  }
  const isPinned = (el) => getComputedStyle(el).position === 'sticky';

  const hero = setupHero();
  intro().then((delay) => {
    root.classList.add('ready');
    hero.decode(delay);
  });
  about();
  toolkit();
  finish();

  // ---------------------------------------------------------------
  // Opening: five lights, a held beat, lights out, curtains part
  // ---------------------------------------------------------------
  function intro() {
    return new Promise((resolve) => {
      const el = document.querySelector('.intro');
      if (!el || !root.classList.contains('intro-on')) { resolve(0.05); return; }
      try { sessionStorage.setItem('intro-seen', '1'); } catch (e) { /* private mode */ }

      const cols = el.querySelectorAll('.lamp-col');
      const gantry = el.querySelector('.intro-gantry');
      const top = el.querySelector('.intro-top');
      const bottom = el.querySelector('.intro-bottom');
      const timers = [];
      const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
      let opened = false;

      function open(fast) {
        if (opened) return;
        opened = true;
        timers.forEach(clearTimeout);
        skipEvents.forEach((ev) => window.removeEventListener(ev, skip));
        cols.forEach((c) => c.classList.remove('on'));
        const d = fast ? 0.45 : 0.75;
        animate(gantry, { opacity: 0 }, { duration: 0.18 });
        animate(top, { transform: ['translateY(0%)', 'translateY(-100%)'] }, { duration: d, ease: EASE_IN_OUT });
        animate(bottom, { transform: ['translateY(0%)', 'translateY(100%)'] }, { duration: d, ease: EASE_IN_OUT })
          .then(() => root.classList.remove('intro-on'));
        resolve(fast ? 0.05 : 0.25);
      }
      function skip() { open(true); }

      const T0 = 180, STEP = 150, HOLD = 380;
      cols.forEach((c, i) => timers.push(setTimeout(() => c.classList.add('on'), T0 + i * STEP)));
      timers.push(setTimeout(() => cols.forEach((c) => c.classList.remove('on')), T0 + 4 * STEP + HOLD));
      timers.push(setTimeout(() => open(false), T0 + 4 * STEP + HOLD + 110));
      skipEvents.forEach((ev) => window.addEventListener(ev, skip, { passive: true }));
    });
  }

  // ---------------------------------------------------------------
  // Hero: the portrait decodes in, answers the pointer, and dithers away
  // ---------------------------------------------------------------
  function setupHero() {
    const el = document.querySelector('.hero');
    const img = el.querySelector('.hero-photo');
    const hint = el.querySelector('.hint');
    const art = A.create(el.querySelector('.hero-ascii'), img, portrait({
      cols: (w) => (w < 420 ? 54 : 78),
      flicker: 0.008,
      pointer: true,
    }));
    const ready = A.ready(img).then(() => {
      art.layout();
      root.classList.add('ascii-ready');
      art.start();
    }).catch(() => {});
    layouts.push(() => art.layout());

    if (hint) {
      el.querySelector('.hero-ascii').addEventListener('pointermove', () => hint.classList.add('is-done'), { once: true });
    }

    // leaving the hero: the portrait breaks up in dither order, the copy lifts away
    scroll(follower((p) => art.setDissolve(range(p, 0.12, 0.85))), { target: el, offset: ['start start', 'end start'] });
    scroll(animate(el.querySelector('.hero-copy'),
      { transform: ['translateY(0vh)', 'translateY(-10vh)'], opacity: [1, 0.2] }, { ease: 'linear' }),
      { target: el, offset: ['start start', 'end start'] });

    return {
      decode(delay) {
        ready.then(() => setTimeout(() => art.decode(1300), delay * 1000));
      },
    };
  }

  // ---------------------------------------------------------------
  // About: the photo develops through a dither dissolve, words light up
  // ---------------------------------------------------------------
  function about() {
    const el = document.querySelector('.about');
    const pin = el.querySelector('.about-pin');
    const img = el.querySelector('.about-photo img');
    const words = splitWords(el.querySelector('.reveal-text'));
    const art = A.create(el.querySelector('.about-ascii'), img, portrait({
      cols: (w) => (w < 300 ? 44 : 58),
      backing: C.bg,
    }));
    A.ready(img).then(() => art.layout()).catch(() => {});
    layouts.push(() => art.layout());

    let shown = -1;
    const render = (p) => {
      art.setDissolve(range(p, 0.1, 0.62));
      const n = Math.round(range(p, 0.02, 0.74) * words.length);
      if (n !== shown) {
        words.forEach((w, i) => w.classList.toggle('lit', i < n));
        shown = n;
      }
    };
    const offset = isPinned(pin) ? ['start start', 'end end'] : ['start 0.8', 'end 0.55'];
    scroll(follower(render), { target: el, offset });
  }

  // ---------------------------------------------------------------
  // Toolkit: two rows slide against each other
  // ---------------------------------------------------------------
  function toolkit() {
    const el = document.querySelector('.toolkit');
    const opts = { target: el, offset: ['start end', 'end start'] };
    scroll(animate(el.querySelector('.row-a'),
      { transform: ['translateX(0%)', 'translateX(-24%)'] }, { ease: 'linear' }), opts);
    scroll(animate(el.querySelector('.row-b'),
      { transform: ['translateX(-24%)', 'translateX(0%)'] }, { ease: 'linear' }), opts);
  }

  // ---------------------------------------------------------------
  // Finish: the car crosses, painting the headline; then the flag
  // ---------------------------------------------------------------
  function finish() {
    const el = document.querySelector('.finish');
    const pin = el.querySelector('.finish-pin');
    const car = el.querySelector('.car');
    const streaks = el.querySelector('.streaks');
    const sctx = streaks.getContext('2d');
    const speedo = el.querySelector('.speedo');
    const speedNum = el.querySelector('.speed-num');
    const lines = Array.from(el.querySelectorAll('.ft-line'));
    const rest = el.querySelector('.finish-rest');
    const chequer = el.querySelector('.chequer');

    const img = new Image();
    img.src = 'Img/f1-car.jpg';
    const art = A.create(el.querySelector('.car-ascii'), img, carOptions);
    A.ready(img).then(() => art.layout()).catch(() => {});

    let vw = innerWidth, carW = car.offsetWidth, sDpr = 1, sW = 0, sH = 0;
    let carX = -carW, prevX = carX, prevT = 0, speed = 0, shown = '0';
    function sizeStreaks() {
      const r = streaks.getBoundingClientRect();
      sDpr = Math.min(window.devicePixelRatio || 1, 2);
      sW = r.width; sH = r.height;
      streaks.width = Math.round(sW * sDpr);
      streaks.height = Math.round(sH * sDpr);
    }
    sizeStreaks();
    layouts.push(() => { vw = innerWidth; carW = car.offsetWidth; sizeStreaks(); art.layout(); });

    const trails = Array.from({ length: 14 }, (_, i) => ({ y: 0.14 + (i / 13) * 0.72, len: 0.45 + Math.random() * 0.55 }));

    const render = (p) => {
      const t = range(p, 0.02, 0.5);
      carX = -carW + (vw + carW * 1.15) * Math.pow(t, 1.5);
      car.style.transform = 'translate3d(' + carX.toFixed(1) + 'px,0,0)';

      // the nose paints each line of the headline as it passes
      const nose = carX + carW * 0.97;
      lines.forEach((line) => {
        const r = line.getBoundingClientRect();
        line.style.setProperty('--f', clamp((nose - r.left) / r.width).toFixed(4));
      });

      chequer.style.setProperty('--cq', easeOut3(range(p, 0.46, 0.64)).toFixed(4));
      const r = easeOut3(range(p, 0.52, 0.7));
      rest.style.opacity = r.toFixed(3);
      rest.style.transform = 'translateY(' + ((1 - r) * 28).toFixed(1) + 'px)';
      // once the car is gone the readout settles back, dim, at zero
      speedo.style.opacity = (1 - 0.6 * range(p, 0.5, 0.6)).toFixed(3);
      wake();
    };
    scroll(follower(render, 0.12), { target: el, offset: isPinned(pin) ? ['start start', 'end end'] : ['start end', 'end end'] });

    // speed readout and streaks run on their own loop so they can wind down
    let raf = 0, inView = false;
    function loop(now) {
      raf = 0;
      const dt = prevT ? Math.min(0.1, (now - prevT) / 1000) : 0;
      const moved = Math.abs(carX - prevX);
      prevT = now;
      if (dt > 0) {
        const kmh = Math.min(340, (moved / dt) / vw * 190);
        speed += (kmh - speed) * (kmh > speed ? 0.3 : 0.08);
      }
      prevX = carX;
      if (speed <= 0.5 && moved < 0.05 && dt > 0) speed = 0;
      const text = String(Math.round(speed));
      if (text !== shown) { speedNum.textContent = text; shown = text; }
      drawStreaks();
      if (inView && (dt === 0 || moved >= 0.05 || speed > 0)) raf = requestAnimationFrame(loop);
      else prevT = 0;
    }
    function wake() { if (inView && !raf) raf = requestAnimationFrame(loop); }
    function drawStreaks() {
      sctx.setTransform(sDpr, 0, 0, sDpr, 0, 0);
      sctx.clearRect(0, 0, sW, sH);
      if (speed < 6 || carX + carW < 0 || carX > vw) return;
      sctx.font = '500 12px "JetBrains Mono", ui-monospace, monospace';
      sctx.textBaseline = 'middle';
      sctx.fillStyle = C.deepInk;
      const rear = carX + carW * 0.04;
      trails.forEach((tr) => {
        const len = (speed / 340) * vw * 0.4 * tr.len;
        for (let k = 0; k < len; k += 10) {
          sctx.globalAlpha = (1 - k / len) * 0.34;
          sctx.fillText(k % 20 ? '-' : '=', rear - k - 10, tr.y * sH);
        }
      });
      sctx.globalAlpha = 1;
    }
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView) wake();
    }).observe(el);
  }

  // ---------------------------------------------------------------
  // Daily: the app's one question, answered against the visitor's clock
  // ---------------------------------------------------------------
  function dailyCheck() {
    const input = document.getElementById('dw-planned');
    if (!input) return;
    const out = document.getElementById('dw-planned-out');
    const clockEl = document.getElementById('dw-now').parentElement;
    const status = document.getElementById('dw-status');
    const statusText = document.getElementById('dw-status-text');
    const DAY_END = 23; // 11 pm, Daily's day window closes here in this demo

    const fmt = (hours) => {
      const total = Math.round(hours * 60);
      const h = Math.floor(total / 60), m = total % 60;
      if (h && m) return h + 'h ' + m + 'm';
      return h ? h + 'h' : m + 'm';
    };
    const hoursLeft = () => {
      const d = new Date();
      return Math.max(0, DAY_END - (d.getHours() + d.getMinutes() / 60));
    };

    let last = '';
    function update() {
      const planned = Number(input.value);
      const left = hoursLeft();
      out.textContent = fmt(planned);
      input.style.setProperty('--p', (planned / Number(input.max)) * 100 + '%');
      input.setAttribute('aria-valuetext', fmt(planned) + ' planned');

      const bold = (text) => Object.assign(document.createElement('b'), { textContent: text });
      const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
      clockEl.replaceChildren("It's ", bold(time), '. ');
      if (left > 0) clockEl.append('Your day ends at 11 pm, ', bold(fmt(left)), ' from now.');
      else clockEl.append('Your day window closed at 11 pm.');

      let state, msg;
      if (left <= 0) { state = 'over'; msg = 'Daily resets at midnight'; }
      else if (planned <= left - 1) { state = 'ok'; msg = 'You have time to spare'; }
      else if (planned <= left) { state = 'tight'; msg = 'Tight, but it fits'; }
      else { state = 'over'; msg = 'Over by ' + fmt(planned - left); }

      status.dataset.state = state;
      if (msg !== last) {
        statusText.classList.add('swap');
        statusText.textContent = msg;
        void statusText.offsetWidth;
        statusText.classList.remove('swap');
        last = msg;
      }
    }
    input.addEventListener('input', update);
    setInterval(update, 30000);
    update();
  }

  // ---------------------------------------------------------------
  // Reel Cards: flip to the dictionary form, grade it, next card
  // ---------------------------------------------------------------
  function reelDeck() {
    const card = document.getElementById('flash-card');
    if (!card) return;
    const deck = [
      { seen: 'allait', lemma: 'aller', meaning: 'verb, to go' },
      { seen: 'mangeons', lemma: 'manger', meaning: 'verb, to eat' },
      { seen: 'belles', lemma: 'beau', meaning: 'adjective, beautiful' },
      { seen: 'voulais', lemma: 'vouloir', meaning: 'verb, to want' },
      { seen: 'chevaux', lemma: 'cheval', meaning: 'masculine noun, horse' },
    ];
    const front = document.getElementById('flash-front');
    const back = document.getElementById('flash-back');
    const seen = document.getElementById('flash-seen');
    const lemma = document.getElementById('flash-lemma');
    const meaning = document.getElementById('flash-meaning');
    const show = document.getElementById('flash-show');
    const grades = document.getElementById('flash-grades');
    const live = document.getElementById('flash-live');
    let i = 0, busy = false;

    function fill() {
      const c = deck[i % deck.length];
      seen.textContent = c.seen;
      lemma.textContent = c.lemma;
      meaning.textContent = c.meaning;
    }

    show.addEventListener('click', () => {
      card.classList.add('flipped');
      front.setAttribute('aria-hidden', 'true');
      back.removeAttribute('aria-hidden');
      show.hidden = true;
      grades.hidden = false;
      grades.classList.remove('pop');
      void grades.offsetWidth;
      grades.classList.add('pop');
      const c = deck[i % deck.length];
      live.textContent = c.seen + ' comes from ' + c.lemma + ', ' + c.meaning + '.';
      grades.querySelector('.g-good').focus({ preventScroll: true });
    });

    grades.addEventListener('click', (e) => {
      const btn = e.target.closest('.grade');
      if (!btn || busy) return;
      busy = true;
      card.classList.add('leaving');
      setTimeout(() => {
        i += 1;
        card.style.transition = 'none';
        card.classList.remove('flipped', 'leaving');
        fill();
        void card.offsetWidth;
        card.style.transition = '';
        card.classList.add('arriving');
        front.removeAttribute('aria-hidden');
        back.setAttribute('aria-hidden', 'true');
        grades.hidden = true;
        show.hidden = false;
        show.focus({ preventScroll: true });
        live.textContent = 'Graded ' + btn.textContent + '. Next card: ' + deck[i % deck.length].seen + '.';
        setTimeout(() => { card.classList.remove('arriving'); busy = false; }, 560);
      }, 260);
    });
  }

  // ---------------------------------------------------------------
  // Reduced motion or no Motion: draw the art once, still
  // ---------------------------------------------------------------
  function staticArt() {
    const heroImg = document.querySelector('.hero-photo');
    const art = A.create(document.querySelector('.hero-ascii'), heroImg, portrait({ cols: (w) => (w < 420 ? 54 : 78) }));
    A.ready(heroImg).then(() => { art.layout(); root.classList.add('ascii-ready'); }).catch(() => {});

    const img = new Image();
    img.src = 'Img/f1-car.jpg';
    const car = A.create(document.querySelector('.car-ascii'), img, carOptions);
    A.ready(img).then(() => car.layout()).catch(() => {});
    layouts.push(() => { art.layout(); car.layout(); });
  }

  function splitWords(node) {
    const words = node.textContent.trim().split(/\s+/);
    node.textContent = '';
    return words.map((word, n) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      node.appendChild(span);
      if (n < words.length - 1) node.appendChild(document.createTextNode(' '));
      return span;
    });
  }
})();
