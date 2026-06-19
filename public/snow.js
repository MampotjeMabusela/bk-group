/**
 * Winter snowfall — soft, layered canvas effect. Respects reduced motion.
 */
(function initWinterSnow() {
  const container = document.getElementById('winterSnow');
  if (!container) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionQuery.matches) {
    container.classList.add('winter-snow--static');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'winter-snow-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let flakes = [];
  let rafId = 0;
  let running = true;

  const LAYERS = [
    { ratio: 0.4, minR: 0.9, maxR: 1.8, minSpeed: 0.25, maxSpeed: 0.55, minOpacity: 0.32, maxOpacity: 0.52 },
    { ratio: 0.38, minR: 1.6, maxR: 3.1, minSpeed: 0.45, maxSpeed: 0.95, minOpacity: 0.45, maxOpacity: 0.68 },
    { ratio: 0.22, minR: 2.8, maxR: 4.8, minSpeed: 0.7, maxSpeed: 1.35, minOpacity: 0.55, maxOpacity: 0.82 },
  ];

  function flakeCount() {
    const area = width * height;
    const density = window.innerWidth < 640 ? 0.00007 : 0.000095;
    return Math.min(165, Math.max(52, Math.floor(area * density)));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function createFlake(layer, spawnTop) {
    const y = spawnTop ? rand(-height * 0.1, 0) : rand(0, height);
    return {
      x: rand(0, width),
      y,
      r: rand(layer.minR, layer.maxR),
      opacity: rand(layer.minOpacity, layer.maxOpacity),
      speed: rand(layer.minSpeed, layer.maxSpeed),
      drift: rand(-0.35, 0.35),
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.004, 0.014),
      wobbleAmp: rand(0.15, 0.55),
      layer,
    };
  }

  function buildFlakes() {
    const total = flakeCount();
    flakes = [];
    LAYERS.forEach((layer) => {
      const count = Math.max(1, Math.round(total * layer.ratio));
      for (let i = 0; i < count; i += 1) {
        flakes.push(createFlake(layer, false));
      }
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildFlakes();
  }

  function drawFlake(f) {
    const glow = f.r * (f.layer.maxR > 2 ? 2.8 : 2.1);
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glow);
    grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, f.opacity + 0.08)})`);
    grad.addColorStop(0.3, `rgba(240, 248, 255, ${f.opacity * 0.82})`);
    grad.addColorStop(0.65, `rgba(220, 236, 255, ${f.opacity * 0.35})`);
    grad.addColorStop(1, 'rgba(200, 225, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, glow, 0, Math.PI * 2);
    ctx.fill();
  }

  function resetFlake(f) {
    const next = createFlake(f.layer, true);
    f.x = next.x;
    f.y = next.y;
    f.r = next.r;
    f.opacity = next.opacity;
    f.speed = next.speed;
    f.drift = next.drift;
    f.wobble = next.wobble;
    f.wobbleSpeed = next.wobbleSpeed;
    f.wobbleAmp = next.wobbleAmp;
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < flakes.length; i += 1) {
      const f = flakes[i];
      f.wobble += f.wobbleSpeed;
      f.x += f.drift + Math.sin(f.wobble) * f.wobbleAmp;
      f.y += f.speed;
      if (f.y > height + f.r * 3) resetFlake(f);
      if (f.x > width + 8) f.x = -8;
      if (f.x < -8) f.x = width + 8;
      drawFlake(f);
    }
  }

  function loop() {
    if (!running) return;
    tick();
    rafId = window.requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(rafId);
  }

  resize();
  loop();

  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  motionQuery.addEventListener('change', (e) => {
    if (e.matches) {
      stop();
      canvas.remove();
      container.classList.add('winter-snow--static');
    }
  });
})();
