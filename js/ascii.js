// ===================================================================
// Daniel Norouzi · ASCII renderer
// Turns an image into a grid of characters on a <canvas>, with ordered
// (Bayer) dithering between density levels. Effects: a left-to-right
// decode, a pointer ripple, idle flicker, and a dither dissolve that
// uncovers whatever sits underneath the canvas.
// ===================================================================

(function () {
  // 8×8 Bayer matrix as thresholds in (0, 1)
  const BAYER = (function () {
    let m = [[0]];
    for (let n = 1; n < 8; n *= 2) {
      const next = [];
      for (let y = 0; y < n * 2; y++) {
        next[y] = [];
        for (let x = 0; x < n * 2; x++) {
          const q = (y < n ? 0 : 2) + (x < n ? 0 : 1);
          next[y][x] = 4 * m[y % n][x % n] + [0, 2, 3, 1][q];
        }
      }
      m = next;
    }
    return m.map((row) => row.map((v) => (v + 0.5) / 64));
  })();

  const NOISE = '01#%&*+=-:<>/\\|';
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const randChar = () => NOISE[(Math.random() * NOISE.length) | 0];

  function create(canvas, source, opts) {
    const o = Object.assign({
      cols: 64,             // number, or function(cssWidth) -> number
      aspect: 0.6,          // character width / height
      ramp: ' .:-=+*#%@',   // light to dense
      invert: false,
      contrast: 1,
      gamma: 1,
      threshold: 0,         // values below this are left blank
      dither: 0.9,          // Bayer strength between levels
      mask: null,           // function(u, v) -> 0..1
      crop: null,           // [sx, sy, sw, sh] in source pixels
      mirror: false,        // flip horizontally
      color: '#D9B566',
      accent: '#EDEAE2',
      backing: null,        // fill behind each cell (used by dissolve)
      minAlpha: 0.32,
      flicker: 0,           // share of cells per second that briefly scramble
      pointer: false,
    }, opts);

    const ctx = canvas.getContext('2d');
    let cssW = 0, cssH = 0, dpr = 1, cols = 0, rows = 0, cellW = 0, cellH = 0;
    let levels = new Uint8Array(0);     // ramp index per cell
    let thresholds = new Float32Array(0);
    let settleAt = new Float64Array(0); // decode end time per cell
    let scramble = new Float64Array(0); // scramble end time per cell
    let groups = [];                    // cell indices per ramp level
    let dissolve = 0;
    let running = false, visible = true, raf = 0, lastT = 0, decodeUntil = 0, rippleUntil = 0, lastDraw = 0;

    function sample() {
      const iw = source.naturalWidth || source.width;
      const ih = source.naturalHeight || source.height;
      let [sx, sy, sw, sh] = o.crop || [0, 0, iw, ih];
      // cover-fit the crop to the canvas shape
      const want = cssW / cssH;
      if (sw / sh > want) { const nw = sh * want; sx += (sw - nw) / 2; sw = nw; }
      else { const nh = sw / want; sy += (sh - nh) / 2; sh = nh; }

      // downscale in two steps so each cell averages its pixels
      const mid = document.createElement('canvas');
      mid.width = cols * 4; mid.height = rows * 4;
      const mctx = mid.getContext('2d');
      mctx.imageSmoothingQuality = 'high';
      if (o.mirror) { mctx.translate(mid.width, 0); mctx.scale(-1, 1); }
      mctx.drawImage(source, sx, sy, sw, sh, 0, 0, mid.width, mid.height);
      const small = document.createElement('canvas');
      small.width = cols; small.height = rows;
      const sctx = small.getContext('2d', { willReadFrequently: true });
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(mid, 0, 0, cols, rows);
      const data = sctx.getImageData(0, 0, cols, rows).data;

      const n = o.ramp.length;
      levels = new Uint8Array(cols * rows);
      thresholds = new Float32Array(cols * rows);
      groups = Array.from({ length: n }, () => []);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const p = i * 4;
          let v = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
          if (o.invert) v = 1 - v;
          v = clamp((v - 0.5) * o.contrast + 0.5, 0, 1);
          v = Math.pow(v, o.gamma);
          if (o.mask) v *= o.mask((x + 0.5) / cols, (y + 0.5) / rows);
          const b = BAYER[y % 8][x % 8];
          thresholds[i] = b;
          let level = 0;
          if (v >= o.threshold) {
            level = clamp(Math.round(v * (n - 1) + (b - 0.5) * o.dither), 0, n - 1);
          }
          levels[i] = level;
          if (level > 0) groups[level].push(i);
        }
      }
    }

    function layout() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      cssW = rect.width; cssH = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      cols = Math.max(8, Math.round(typeof o.cols === 'function' ? o.cols(cssW) : o.cols));
      cellW = cssW / cols;
      cellH = cellW / o.aspect;
      rows = Math.max(4, Math.floor(cssH / cellH));
      cellH = cssH / rows;
      settleAt = new Float64Array(cols * rows);
      scramble = new Float64Array(cols * rows);
      sample();
      render(performance.now());
      return true;
    }

    function render(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      if (dissolve >= 1) return;
      ctx.font = `500 ${cellH * 0.92}px ${o.font || '"JetBrains Mono", ui-monospace, monospace'}`;
      ctx.textBaseline = 'top';
      const n = o.ramp.length;

      if (o.backing) {
        ctx.fillStyle = o.backing;
        if (dissolve <= 0) ctx.fillRect(0, 0, cssW, cssH);
        else {
          for (let i = 0; i < levels.length; i++) {
            if (thresholds[i] > dissolve) ctx.fillRect((i % cols) * cellW, ((i / cols) | 0) * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
      }

      ctx.fillStyle = o.color;
      for (let l = 1; l < n; l++) {
        const cells = groups[l];
        if (!cells.length) continue;
        ctx.globalAlpha = o.minAlpha + (1 - o.minAlpha) * (l / (n - 1));
        const ch = o.ramp[l];
        for (let k = 0; k < cells.length; k++) {
          const i = cells[k];
          if (now < settleAt[i] || now < scramble[i]) continue;
          if (dissolve > 0 && thresholds[i] <= dissolve) continue;
          ctx.fillText(ch, (i % cols) * cellW, ((i / cols) | 0) * cellH);
        }
      }

      // scrambled cells draw on top in the accent colour
      ctx.fillStyle = o.accent;
      ctx.globalAlpha = 0.95;
      const decoding = now < decodeUntil;
      for (let i = 0; i < levels.length; i++) {
        if (now < settleAt[i] || now < scramble[i]) {
          if (levels[i] === 0 && !decoding) continue;
          if (levels[i] === 0 && Math.random() > 0.18) continue;
          if (dissolve > 0 && thresholds[i] <= dissolve) continue;
          ctx.fillText(randChar(), (i % cols) * cellW, ((i / cols) | 0) * cellH);
        }
      }
      ctx.globalAlpha = 1;
    }

    function busy(now) {
      if (o.flicker > 0) return true;
      if (now < decodeUntil) return true;
      for (let i = 0; i < scramble.length; i += 1) if (scramble[i] > now) return true;
      return false;
    }

    function tick(now) {
      raf = 0;
      if (!running || !visible) return;
      const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0;
      lastT = now;
      if (o.flicker > 0 && levels.length) {
        const count = levels.length * o.flicker * dt;
        let k = Math.floor(count) + (Math.random() < count % 1 ? 1 : 0);
        while (k-- > 0) {
          const i = (Math.random() * levels.length) | 0;
          if (levels[i] > 0) scramble[i] = now + 60 + Math.random() * 120;
        }
      }
      // idle shimmer only needs ~15 fps; decode and ripple get every frame
      const idle = now >= decodeUntil && now >= rippleUntil;
      if (!idle || now - lastDraw >= 66) { render(now); lastDraw = now; }
      if (busy(now)) raf = requestAnimationFrame(tick);
    }

    function wake() {
      if (running && visible && !raf) { lastT = 0; raf = requestAnimationFrame(tick); }
    }

    function decode(duration) {
      const now = performance.now();
      decodeUntil = now + duration;
      for (let i = 0; i < settleAt.length; i++) {
        const x = (i % cols) / cols;
        settleAt[i] = now + duration * (0.55 * x + 0.45 * Math.random());
      }
      wake();
    }

    if (o.pointer) {
      canvas.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const r = canvas.getBoundingClientRect();
        const cx = (e.clientX - r.left) / cellW;
        const cy = (e.clientY - r.top) / cellH;
        const R = 3.2;
        const now = performance.now();
        for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(rows - 1, Math.ceil(cy + R)); y++) {
          for (let x = Math.max(0, Math.floor(cx - R * 1.6)); x <= Math.min(cols - 1, Math.ceil(cx + R * 1.6)); x++) {
            const dx = (x - cx) / 1.6, dy = y - cy;
            if (dx * dx + dy * dy <= R * R) scramble[y * cols + x] = now + 80 + Math.random() * 160;
          }
        }
        rippleUntil = now + 260;
        wake();
      });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) wake();
      }).observe(canvas);
    }

    return {
      layout,
      decode,
      start() { running = true; wake(); },
      stop() { running = false; },
      setDissolve(p) {
        const next = clamp(p, 0, 1);
        if (next === dissolve) return;
        dissolve = next;
        render(performance.now());
      },
      get size() { return { cols, rows }; },
    };
  }

  // Resolve once the image has decoded and the mono face is ready to draw.
  function ready(img) {
    const imgReady = img.complete && img.naturalWidth
      ? Promise.resolve()
      : new Promise((res, rej) => { img.addEventListener('load', res, { once: true }); img.addEventListener('error', rej, { once: true }); });
    const fontReady = document.fonts && document.fonts.load
      ? document.fonts.load('500 16px "JetBrains Mono"').catch(() => {})
      : Promise.resolve();
    return Promise.all([imgReady, fontReady]);
  }

  window.Ascii = { create, ready };
})();
