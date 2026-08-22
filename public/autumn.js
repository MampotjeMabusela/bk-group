/**
 * Autumn falling leaves — soft, layered canvas effect. Respects reduced motion.
 */
(function initAutumnLeaves() {
  const container = document.getElementById('autumnLeaves');
  if (!container) return;

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionQuery.matches) {
    container.classList.add('autumn-leaves--static');
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'autumn-leaves-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let leaves = [];
  let rafId = 0;
  let running = true;

  const COLORS = [
    { r: 212, g: 120, b: 48 },
    { r: 184, g: 72, b: 36 },
    { r: 232, g: 168, b: 64 },
    { r: 156, g: 52, b: 32 },
    { r: 196, g: 98, b: 42 },
    { r: 140, g: 64, b: 28 },
  ];

  const LAYERS = [
    { ratio: 0.4, minR: 3, maxR: 6, minSpeed: 0.35, maxSpeed: 0.7, minOpacity: 0.35, maxOpacity: 0.55 },
    { ratio: 0.38, minR: 5, maxR: 9, minSpeed: 0.55, maxSpeed: 1.05, minOpacity: 0.45, maxOpacity: 0.7 },
    { ratio: 0.22, minR: 8, maxR: 13, minSpeed: 0.8, maxSpeed: 1.45, minOpacity: 0.55, maxOpacity: 0.85 },
  ];

  function leafCount() {
    const area = width * height;
    const density = window.innerWidth < 640 ? 0.000035 : 0.000048;
    return Math.min(90, Math.max(28, Math.floor(area * density)));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function createLeaf(layer, spawnTop) {
    const y = spawnTop ? rand(-height * 0.12, 0) : rand(0, height);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: rand(0, width),
      y,
      r: rand(layer.minR, layer.maxR),
      opacity: rand(layer.minOpacity, layer.maxOpacity),
      speed: rand(layer.minSpeed, layer.maxSpeed),
      drift: rand(-0.55, 0.55),
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.01, 0.028),
      wobbleAmp: rand(0.4, 1.2),
      spin: rand(0, Math.PI * 2),
      spinSpeed: rand(-0.03, 0.03),
      color,
      layer,
    };
  }

  function buildLeaves() {
    const total = leafCount();
    leaves = [];
    LAYERS.forEach((layer) => {
      const count = Math.max(1, Math.round(total * layer.ratio));
      for (let i = 0; i < count; i += 1) {
        leaves.push(createLeaf(layer, false));
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
    buildLeaves();
  }

  function drawLeaf(leaf) {
    const { r, opacity, color, spin } = leaf;
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(spin);
    ctx.globalAlpha = opacity;

    // Soft leaf glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.8);
    glow.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.35)`);
    glow.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.6, r * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leaf body
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.95, -r * 0.2, r * 0.35, r * 0.85);
    ctx.quadraticCurveTo(0, r * 0.55, -r * 0.35, r * 0.85);
    ctx.quadraticCurveTo(-r * 0.95, -r * 0.2, 0, -r);
    ctx.closePath();
    ctx.fill();

    // Midrib
    ctx.strokeStyle = `rgba(80, 30, 10, ${0.35 * opacity})`;
    ctx.lineWidth = Math.max(0.6, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.75);
    ctx.quadraticCurveTo(r * 0.08, 0, 0, r * 0.7);
    ctx.stroke();

    ctx.restore();
  }

  function resetLeaf(leaf) {
    const next = createLeaf(leaf.layer, true);
    leaf.x = next.x;
    leaf.y = next.y;
    leaf.r = next.r;
    leaf.opacity = next.opacity;
    leaf.speed = next.speed;
    leaf.drift = next.drift;
    leaf.wobble = next.wobble;
    leaf.wobbleSpeed = next.wobbleSpeed;
    leaf.wobbleAmp = next.wobbleAmp;
    leaf.spin = next.spin;
    leaf.spinSpeed = next.spinSpeed;
    leaf.color = next.color;
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < leaves.length; i += 1) {
      const leaf = leaves[i];
      leaf.wobble += leaf.wobbleSpeed;
      leaf.spin += leaf.spinSpeed;
      leaf.x += leaf.drift + Math.sin(leaf.wobble) * leaf.wobbleAmp;
      leaf.y += leaf.speed;
      if (leaf.y > height + leaf.r * 3) resetLeaf(leaf);
      if (leaf.x > width + 16) leaf.x = -16;
      if (leaf.x < -16) leaf.x = width + 16;
      drawLeaf(leaf);
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
      container.classList.add('autumn-leaves--static');
    }
  });
})();
