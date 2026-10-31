// ===================================================================
// Daniel Norouzi · home page choreography
// Motion drives the timeline and scroll links; ascii.js draws the
// portrait and the car. One function per scene, run in page order.
// ===================================================================

(function () {
  const root = document.documentElement;
  const M = window.Motion;
  const A = window.Ascii;
  if (!A) return;

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const range = (p, a, b) => clamp((p - a) / (b - a));
  const easeOut3 = (t) => 1 - Math.pow(1 - t, 3);
  const EASE_OUT = [0.16, 1, 0.3, 1];
  const EASE_IN_OUT = [0.76, 0, 0.24, 1];
  const NIGHT = '#07111F';

  // Keep the face and shirt, fade the bokeh behind them with a soft oval.
  const faceMask = (u, v) => {
    const dx = (u - 0.53) / 0.44;
    const dy = (v - 0.47) / 0.62;
    const t = clamp((Math.sqrt(dx * dx + dy * dy) - 0.62) / 0.38);
    return 1 - t * t * (3 - 2 * t);
  };
  const portraitOptions = (extra) => Object.assign({
    contrast: 1.6,
    gamma: 1.1,
    threshold: 0.12,
    mask: faceMask,
    color: '#D9B566',
    accent: '#EDEAE2',
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
    color: '#EDEAE2',
    accent: '#D9B566',
    cols: (w) => Math.round(clamp(w / 6.2, 70, 190)),
  };

  const layouts = [];
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => layouts.forEach((fn) => fn()), 150);
  });

  header();

  if (!root.classList.contains('motion') || !M) {
    root.classList.remove('motion', 'intro-on');
    staticArt();
    return;
  }
  root.classList.add('live');
  const { animate, scroll, stagger } = M;

  // Motion hands over raw scroll progress; each scene eases toward it so
  // the motion has some weight without lagging behind the scrollbar.
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
  intro().then((delay) => hero.reveal(delay));
  about();
  toolkit();
  builds();
  finish();

  // ---------------------------------------------------------------
  // Header: transparent over the night bands, lap line shows progress
  // ---------------------------------------------------------------
  function header() {
    const bar = document.querySelector('.site-header');
    if (!bar) return;
    const lap = bar.querySelector('.lap span');
    const bands = Array.from(document.querySelectorAll('[data-night]'));
    let ticking = false;
    function update() {
      ticking = false;
      const max = root.scrollHeight - innerHeight;
      if (lap) lap.style.transform = 'scaleX(' + (max > 0 ? clamp(scrollY / max) : 0).toFixed(4) + ')';
      const y = bar.offsetHeight * 0.5;
      bar.classList.toggle('over-night', bands.some((b) => {
        const r = b.getBoundingClientRect();
        return r.top <= y && r.bottom > y;
      }));
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    layouts.push(update);
    update();
  }

  // ---------------------------------------------------------------
  // Opening: five lights, a held beat, lights out, curtains part
  // ---------------------------------------------------------------
  function intro() {
    return new Promise((resolve) => {
      const el = document.querySelector('.intro');
      if (!el || !root.classList.contains('intro-on')) { resolve(0.15); return; }
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
        const d = fast ? 0.5 : 0.95;
        animate(gantry, { opacity: 0 }, { duration: 0.2 });
        animate(top, { transform: ['translateY(0%)', 'translateY(-100%)'] }, { duration: d, ease: EASE_IN_OUT });
        animate(bottom, { transform: ['translateY(0%)', 'translateY(100%)'] }, { duration: d, ease: EASE_IN_OUT })
          .then(() => root.classList.remove('intro-on'));
        resolve(fast ? 0.05 : 0.3);
      }
      function skip() { open(true); }

      animate(gantry, { opacity: [0, 1] }, { duration: 0.35 });
      const T0 = 320, STEP = 170, HOLD = 520;
      cols.forEach((c, i) => timers.push(setTimeout(() => c.classList.add('on'), T0 + i * STEP)));
      timers.push(setTimeout(() => cols.forEach((c) => c.classList.remove('on')), T0 + 4 * STEP + HOLD));
      timers.push(setTimeout(() => open(false), T0 + 4 * STEP + HOLD + 140));
      skipEvents.forEach((ev) => window.addEventListener(ev, skip, { passive: true }));
    });
  }

  // ---------------------------------------------------------------
  // Hero: ASCII portrait decodes, the name rises, the camera pushes in
  // ---------------------------------------------------------------
  function setupHero() {
    const el = document.querySelector('.hero');
    const img = el.querySelector('.hero-photo');
    const art = A.create(el.querySelector('.hero-ascii'), img, portraitOptions({
      cols: (w) => (w < 420 ? 54 : 76),
      flicker: 0.01,
      pointer: true,
    }));
    const ready = A.ready(img).then(() => {
      art.layout();
      root.classList.add('ascii-ready');
      art.start();
    }).catch(() => {});
    layouts.push(() => art.layout());

    // scrolling away: the name lifts and fades, the portrait sinks and grows
    const away = { target: el, offset: ['start start', 'end start'] };
    scroll(animate(el.querySelector('.hero-inner'),
      { transform: ['translateY(0vh)', 'translateY(-14vh)'], opacity: [1, 0] }, { ease: 'linear' }), away);
    scroll(animate(el.querySelector('.hero-art'),
      { transform: ['translateY(0vh) scale(1)', 'translateY(10vh) scale(1.08)'], opacity: [1, 0.15] }, { ease: 'linear' }), away);

    return {
      reveal(delay) {
        animate(el.querySelectorAll('.hero-name .line > span'),
          { transform: ['translateY(105%)', 'translateY(0%)'] },
          { duration: 1.15, ease: EASE_OUT, delay: stagger(0.09, { startDelay: delay }) });
        animate(el.querySelector('.hero-foot'),
          { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] },
          { duration: 0.9, ease: EASE_OUT, delay: delay + 0.4 });
        ready.then(() => setTimeout(() => art.decode(1500), delay * 1000));
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
    const art = A.create(el.querySelector('.about-ascii'), img, portraitOptions({
      cols: (w) => (w < 300 ? 44 : 58),
      backing: NIGHT,
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
  // Toolkit: rows slide against each other
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
  // Builds: media opens as each card arrives; it sinks as the next stacks
  // ---------------------------------------------------------------
  function builds() {
    const cards = Array.from(document.querySelectorAll('.build-card'));
    let stickTops = [];
    const measure = () => { stickTops = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0); };
    measure();
    layouts.push(measure);

    scroll(() => {
      const vh = innerHeight;
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const open = easeOut3(clamp((vh - r.top) / (vh * 0.7)));
        card.style.setProperty('--clip', ((1 - open) * 10).toFixed(2) + '%');
        const next = cards[i + 1];
        if (next) {
          const q = clamp((vh - next.getBoundingClientRect().top) / Math.max(1, vh - stickTops[i + 1]));
          card.style.setProperty('--s', (1 - q * 0.05).toFixed(4));
          card.style.setProperty('--dim', q.toFixed(3));
        }
      });
    });
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
      speedo.style.opacity = (1 - range(p, 0.5, 0.6)).toFixed(3);
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
      // keep going while the car moves or the needle is still falling
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
      sctx.fillStyle = '#EDEAE2';
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
  // Reduced motion or no Motion: draw the art once, no movement
  // ---------------------------------------------------------------
  function staticArt() {
    const heroImg = document.querySelector('.hero-photo');
    const portrait = A.create(document.querySelector('.hero-ascii'), heroImg, portraitOptions({ cols: (w) => (w < 420 ? 54 : 76) }));
    A.ready(heroImg).then(() => { portrait.layout(); root.classList.add('ascii-ready'); }).catch(() => {});

    const img = new Image();
    img.src = 'Img/f1-car.jpg';
    const car = A.create(document.querySelector('.car-ascii'), img, carOptions);
    A.ready(img).then(() => car.layout()).catch(() => {});
    layouts.push(() => { portrait.layout(); car.layout(); });
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
})();
