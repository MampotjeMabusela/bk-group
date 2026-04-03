(function () {
  document.body.classList.add('easter-active');

  function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  /* Main festival banner — after header */
  const header = document.querySelector('.site-header');
  if (header) {
    const wrap = document.createElement('div');
    wrap.className = 'easter-festival-banner';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'Easter promotion');
    wrap.innerHTML =
      '<div class="easter-festival-banner__inner">' +
      '<p class="easter-festival-banner__title">Happy Easter — Spring celebration at B &amp; K Group</p>' +
      '<p class="easter-festival-banner__sub">Fresh styles, genuine leather — tiered Easter savings on selected ranges in the shop</p>' +
      '<div class="easter-festival-banner__ribbon">' +
      '<span>20% entry range</span><span>15% mid range</span><span>10% premium</span>' +
      '</div></div>';
    insertAfter(wrap, header);
  }

  const trustBar = document.querySelector('.trust-bar');
  if (trustBar) {
    const strip = document.createElement('div');
    strip.className = 'easter-strip';
    strip.setAttribute('aria-hidden', 'true');
    insertAfter(strip, trustBar);
  }

  const footerContact = document.querySelector('.footer-contact');
  if (footerContact) {
    const comp = document.createElement('p');
    comp.className = 'easter-footer-competition';
    comp.textContent =
      'This is a competition — play along, explore the site, and enjoy the Easter hunt.';
    const mini = document.createElement('p');
    mini.className = 'easter-footer-banner';
    mini.textContent = 'Easter wishes from PHUSHA S\'MOKOLO — hunt the golden eggs for a confetti surprise';
    footerContact.parentNode.insertBefore(comp, footerContact);
    footerContact.parentNode.insertBefore(mini, footerContact);
  }

  const colors = ['#f472b6', '#fde047', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#f9a8d4', '#fef08a'];

  const JP_STORAGE_KEY = 'easterJp';

  function readOrInitJackpotState() {
    try {
      const raw = sessionStorage.getItem(JP_STORAGE_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (
          o &&
          typeof o.target === 'number' &&
          typeof o.count === 'number' &&
          typeof o.serial === 'string'
        ) {
          return {
            target: o.target,
            count: Math.max(0, o.count),
            serial: o.serial,
            won: !!o.won,
          };
        }
      }
    } catch (e) {
      /* ignore */
    }
    /* Nominal 1M; actual target varies by up to ±100% (uniform 0…2×), minimum 250k */
    const target = Math.max(250000, Math.round(1000000 * (Math.random() * 2)));
    const serial = String(Math.floor(Math.random() * 7));
    const state = { target, count: 0, serial, won: false };
    try {
      sessionStorage.setItem(JP_STORAGE_KEY, JSON.stringify(state));
    } catch (e2) {
      /* private mode */
    }
    return state;
  }

  const jackpotState = readOrInitJackpotState();

  function showJackpotWinModal() {
    if (document.querySelector('.easter-prize-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'easter-prize-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'easter-prize-title');
    overlay.innerHTML =
      '<div class="easter-prize-panel">' +
      '<h2 id="easter-prize-title" class="easter-prize-title">You found it</h2>' +
      '<p class="easter-prize-body">Jackpot: <strong>2 free products</strong> on your next qualifying order. ' +
      'Email <a href="mailto:bandkgroupptyltd@outlook.com?subject=Easter%20competition%20%E2%80%94%20jackpot%20claim">bandkgroupptyltd@outlook.com</a> ' +
      'or WhatsApp <a href="https://wa.me/27782376257" target="_blank" rel="noopener noreferrer">+27 78 237 6257</a> with the subject line above so we can verify your win.</p>' +
      '<p class="easter-prize-note">Screenshot this message if helpful. One jackpot per person per promotion period.</p>' +
      '<button type="button" class="easter-prize-dismiss btn btn-primary">Close</button>' +
      '</div>';
    document.body.appendChild(overlay);
    const dismiss = overlay.querySelector('.easter-prize-dismiss');
    function close() {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(ev) {
      if (ev.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    dismiss.addEventListener('click', close);
    overlay.addEventListener('click', function (ev) {
      if (ev.target === overlay) close();
    });
    dismiss.focus();
  }

  function burstConfetti(clientX, clientY) {
    const n = 72;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'easter-confetti-piece';
      el.style.background = colors[i % colors.length];
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const speed = 80 + Math.random() * 160;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed - 40 - Math.random() * 80;
      const rot = (Math.random() - 0.5) * 1080;
      el.style.left = clientX + 'px';
      el.style.top = clientY + 'px';
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      el.style.setProperty('--rot', rot + 'deg');
      el.style.animation = 'easter-confetti-fall 1.4s ease-out forwards';
      document.body.appendChild(el);
      setTimeout(function () {
        el.remove();
      }, 1500);
    }
  }

  function burstConfettiMini(clientX, clientY, n) {
    const count = n || 16;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'easter-confetti-piece';
      el.style.background = colors[i % colors.length];
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 40 + Math.random() * 90;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed - 20 - Math.random() * 40;
      const rot = (Math.random() - 0.5) * 540;
      el.style.left = clientX + 'px';
      el.style.top = clientY + 'px';
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      el.style.setProperty('--rot', rot + 'deg');
      el.style.animation = 'easter-confetti-fall 1s ease-out forwards';
      document.body.appendChild(el);
      setTimeout(function () {
        el.remove();
      }, 1100);
    }
  }

  const positions = ['easter-egg--pos-1', 'easter-egg--pos-2', 'easter-egg--pos-3'];
  const wanderCount = 4;
  /** Max active eggs at once — same as initial layout (fixed + wander). */
  const MAX_EGGS = positions.length + wanderCount;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eggApproxW = 48;
  const eggApproxH = 60;
  const edgeMargin = 16;

  let eggsPopped = 0;
  let wanderEggNextIndex = positions.length + wanderCount;

  /** Unique shell colours per egg (hue separation from other active eggs). */
  function assignEggColors(btn, serialIdx) {
    var used = [];
    document.querySelectorAll('.easter-egg:not(.easter-egg--spent)').forEach(function (el) {
      if (el !== btn && el.dataset.eggHue) used.push(Number(el.dataset.eggHue));
    });
    var hue = null;
    var t;
    for (t = 0; t < 90; t++) {
      var c = (serialIdx * 47 + t * 31) % 360;
      var ok = true;
      for (var i = 0; i < used.length; i++) {
        var d = Math.abs(c - used[i]);
        if (d > 180) d = 360 - d;
        if (d < 26) {
          ok = false;
          break;
        }
      }
      if (ok) {
        hue = c;
        break;
      }
    }
    if (hue === null) hue = (serialIdx * 73 + t * 11) % 360;
    btn.dataset.eggHue = String(Math.round(hue));
    var h2 = (hue + 142) % 360;
    var h3 = (hue + 268) % 360;
    btn.style.setProperty('--egg-s1', 'hsl(' + hue + ',78%,82%)');
    btn.style.setProperty('--egg-s2', 'hsl(' + hue + ',88%,56%)');
    btn.style.setProperty('--egg-s3', 'hsl(' + h2 + ',72%,46%)');
    btn.style.setProperty('--egg-s4', 'hsl(' + hue + ',85%,34%)');
    btn.style.setProperty('--egg-st1', 'hsla(' + h2 + ',70%,42%,0.5)');
    btn.style.setProperty('--egg-st2', 'hsla(' + h3 + ',58%,38%,0.45)');
  }

  function randomEggPositionPx() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxL = Math.max(edgeMargin, vw - eggApproxW - edgeMargin);
    const maxT = Math.max(edgeMargin, vh - eggApproxH - edgeMargin);
    return {
      left: edgeMargin + Math.random() * (maxL - edgeMargin),
      top: edgeMargin + Math.random() * (maxT - edgeMargin),
    };
  }

  function setupWanderBehavior(btn) {
    let wanderTimer = null;
    function stopWander() {
      if (wanderTimer !== null) {
        clearTimeout(wanderTimer);
        wanderTimer = null;
      }
    }
    btn._easterStopWander = stopWander;

    function scheduleNextWander() {
      stopWander();
      if (btn.classList.contains('easter-egg--spent') || prefersReducedMotion) return;
      const delay = 2800 + Math.random() * 4200;
      wanderTimer = setTimeout(function tick() {
        wanderTimer = null;
        if (btn.classList.contains('easter-egg--spent')) return;
        const p = randomEggPositionPx();
        btn.style.left = p.left + 'px';
        btn.style.top = p.top + 'px';
        scheduleNextWander();
      }, delay);
    }

    return scheduleNextWander;
  }

  function createWanderEgg(datasetIndex) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'easter-egg easter-egg--wander';
    btn.setAttribute('aria-label', 'Easter egg — click for a surprise');
    btn.setAttribute('title', 'Easter egg');
    btn.dataset.easterEgg = String(datasetIndex);
    assignEggColors(btn, datasetIndex);
    btn.dataset.easterWanderTransition =
      'left 3.2s cubic-bezier(0.45, 0.05, 0.25, 1), top 3.2s cubic-bezier(0.45, 0.05, 0.25, 1)';
    if (!prefersReducedMotion) {
      btn.style.transition = btn.dataset.easterWanderTransition;
    }
    const p0 = randomEggPositionPx();
    btn.style.left = p0.left + 'px';
    btn.style.top = p0.top + 'px';

    const scheduleNextWander = setupWanderBehavior(btn);
    attachEggBurst(btn);
    document.body.appendChild(btn);

    if (!prefersReducedMotion) {
      scheduleNextWander();
    }
  }

  function countActiveEggs() {
    return document.querySelectorAll('.easter-egg:not(.easter-egg--spent)').length;
  }

  /**
   * After the 4th pop, keep spawning wander eggs whenever below MAX_EGGS
   * so the hunt never ends, without ever exceeding the main egg count.
   */
  function replenishEggsAfterPop() {
    if (eggsPopped < 4) return;
    var guard = 0;
    while (countActiveEggs() < MAX_EGGS && guard < MAX_EGGS + 2) {
      createWanderEgg(wanderEggNextIndex++);
      guard += 1;
    }
  }

  function attachJackpotEgg(btn) {
    let firstClick = true;
    btn.addEventListener('click', function onJackpotClick() {
      if (jackpotState.won || btn.classList.contains('easter-egg--spent')) return;
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (firstClick) {
        burstConfetti(cx, cy);
        firstClick = false;
      } else if (Math.random() < 0.003) {
        burstConfettiMini(cx, cy, 12);
      }
      jackpotState.count += 1;
      try {
        sessionStorage.setItem(JP_STORAGE_KEY, JSON.stringify(jackpotState));
      } catch (e) {
        /* ignore */
      }
      if (jackpotState.count >= jackpotState.target) {
        jackpotState.won = true;
        try {
          sessionStorage.setItem(JP_STORAGE_KEY, JSON.stringify(jackpotState));
        } catch (e2) {
          /* ignore */
        }
        if (typeof btn._easterStopWander === 'function') btn._easterStopWander();
        burstConfetti(cx, cy);
        showJackpotWinModal();
        btn.classList.add('easter-egg--spent');
        eggsPopped += 1;
        replenishEggsAfterPop();
      }
    });
  }

  function attachEggBurst(btn) {
    const serial = btn.dataset.easterEgg;
    if (!jackpotState.won && serial === jackpotState.serial) {
      attachJackpotEgg(btn);
      return;
    }
    btn.addEventListener(
      'click',
      function () {
        if (btn.classList.contains('easter-egg--spent')) return;
        if (typeof btn._easterStopWander === 'function') btn._easterStopWander();
        const r = btn.getBoundingClientRect();
        burstConfetti(r.left + r.width / 2, r.top + r.height / 2);
        btn.classList.add('easter-egg--spent');
        eggsPopped += 1;
        replenishEggsAfterPop();
      },
      { once: true }
    );
  }

  positions.forEach(function (posClass, idx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'easter-egg ' + posClass;
    btn.setAttribute('aria-label', 'Easter egg — click for a surprise');
    btn.setAttribute('title', 'Easter egg');
    btn.dataset.easterEgg = String(idx);
    assignEggColors(btn, idx);
    attachEggBurst(btn);
    document.body.appendChild(btn);
  });

  for (let w = 0; w < wanderCount; w++) {
    createWanderEgg(positions.length + w);
  }

  /* Mr Rabbit — mid-screen hoop + alive motion; JS physics vs eggs when motion OK */
  const rabbitTrack = document.createElement('div');
  rabbitTrack.className = 'easter-rabbit-track';
  rabbitTrack.setAttribute('aria-hidden', 'true');
  rabbitTrack.innerHTML =
    '<div class="easter-rabbit-hoop">' +
    '<div class="easter-rabbit-hoop__face">' +
    '<div class="easter-rabbit-hoop__hop">' +
    '<svg class="easter-rabbit-svg" viewBox="0 0 72 88" xmlns="http://www.w3.org/2000/svg" focusable="false">' +
    '<g class="easter-rabbit-ear-l">' +
    '<ellipse cx="26" cy="24" rx="11" ry="24" fill="#f0f0f0" stroke="#78716c" stroke-width="1.2"/>' +
    '<ellipse cx="26" cy="26" rx="5.5" ry="15" fill="#fda4af"/>' +
    '</g>' +
    '<g class="easter-rabbit-ear-r">' +
    '<ellipse cx="46" cy="24" rx="11" ry="24" fill="#f0f0f0" stroke="#78716c" stroke-width="1.2"/>' +
    '<ellipse cx="46" cy="26" rx="5.5" ry="15" fill="#fda4af"/>' +
    '</g>' +
    '<ellipse cx="36" cy="46" rx="24" ry="23" fill="#fafafa" stroke="#78716c" stroke-width="1.2"/>' +
    '<g class="easter-rabbit-eye"><ellipse cx="28.5" cy="44" rx="5" ry="6" fill="#1c1917"/><circle cx="30" cy="42" r="1.6" fill="#fff"/></g>' +
    '<g class="easter-rabbit-eye easter-rabbit-eye--r"><ellipse cx="43.5" cy="44" rx="5" ry="6" fill="#1c1917"/><circle cx="45" cy="42" r="1.6" fill="#fff"/></g>' +
    '<ellipse class="easter-rabbit-nose" cx="36" cy="52" rx="5.5" ry="4.2" fill="#fb7185"/>' +
    '<line class="easter-rabbit-whisker" x1="8" y1="50" x2="22" y2="49" stroke="#a8a29e" stroke-width="1.2" stroke-linecap="round"/>' +
    '<line class="easter-rabbit-whisker" x1="8" y1="54" x2="22" y2="54" stroke="#a8a29e" stroke-width="1.2" stroke-linecap="round"/>' +
    '<line class="easter-rabbit-whisker easter-rabbit-whisker--r" x1="64" y1="50" x2="50" y2="49" stroke="#a8a29e" stroke-width="1.2" stroke-linecap="round"/>' +
    '<line class="easter-rabbit-whisker easter-rabbit-whisker--r" x1="64" y1="54" x2="50" y2="54" stroke="#a8a29e" stroke-width="1.2" stroke-linecap="round"/>' +
    '<ellipse cx="22" cy="49" rx="4" ry="3" fill="#fafafa" stroke="#d6d3d1" stroke-width="0.7"/>' +
    '<path class="easter-rabbit-smile" fill="none" stroke="#78716c" stroke-width="1.8" stroke-linecap="round" d="M 24 56 Q 36 64 48 56"/>' +
    '<ellipse cx="36" cy="74" rx="22" ry="14" fill="#fafafa" stroke="#78716c" stroke-width="1.2"/>' +
    '<ellipse cx="28" cy="80" rx="8" ry="5" fill="#e7e5e4" stroke="#a8a29e" stroke-width="0.8"/>' +
    '<ellipse cx="44" cy="80" rx="8" ry="5" fill="#e7e5e4" stroke="#a8a29e" stroke-width="0.8"/>' +
    '</svg></div></div></div>';
  document.body.appendChild(rabbitTrack);

  const rabbitHoop = rabbitTrack.querySelector('.easter-rabbit-hoop');
  const rabbitFace = rabbitTrack.querySelector('.easter-rabbit-hoop__face');
  const HOOP_MS = 22000;
  const rabbitRadius = 34;
  const eggHitRadius = 28;
  const minDistRabbitEgg = rabbitRadius + eggHitRadius + 10;
  const repelGain = 22;
  const wallKick = 5;
  const wallMargin = 10;

  if (!prefersReducedMotion && rabbitHoop && rabbitFace) {
    rabbitHoop.classList.add('easter-rabbit-hoop--js');

    const rabbitPhys = { rx: 0, ry: 0, vx: 0, vy: 0 };

    function ensureEggPhys(el) {
      if (!el._easterPhys) el._easterPhys = { nx: 0, ny: 0, vx: 0, vy: 0 };
      return el._easterPhys;
    }

    function physicsFrame(now) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = vw / 2;
      const cy = vh / 2;
      const rxEll = Math.min(vw * 0.44, 520);
      const ryEll = 40;
      const ang = ((now % HOOP_MS) / HOOP_MS) * Math.PI * 2;
      const baseX = rxEll * Math.cos(ang + Math.PI);
      const baseY = -ryEll * Math.sin(ang);

      let rcx = cx + baseX + rabbitPhys.rx;
      let rcy = cy + baseY + rabbitPhys.ry;

      const eggs = document.querySelectorAll('.easter-egg:not(.easter-egg--spent)');
      let i;
      for (i = 0; i < eggs.length; i++) {
        const el = eggs[i];
        const ph = ensureEggPhys(el);
        const r = el.getBoundingClientRect();
        const ecx = r.left + r.width / 2;
        const ecy = r.top + r.height / 2;
        const dx = ecx - rcx;
        const dy = ecy - rcy;
        const d = Math.hypot(dx, dy);
        if (d < minDistRabbitEgg && d > 0.001) {
          const push = ((minDistRabbitEgg - d) / minDistRabbitEgg) * repelGain;
          const nx = dx / d;
          const ny = dy / d;
          rabbitPhys.vx -= nx * push;
          rabbitPhys.vy -= ny * push;
          ph.vx += nx * push;
          ph.vy += ny * push;
        }
      }

      rabbitPhys.rx += rabbitPhys.vx;
      rabbitPhys.ry += rabbitPhys.vy;
      rabbitPhys.vx *= 0.86;
      rabbitPhys.vy *= 0.86;

      rcx = cx + baseX + rabbitPhys.rx;
      rcy = cy + baseY + rabbitPhys.ry;
      const minX = rabbitRadius + wallMargin;
      const maxX = vw - rabbitRadius - wallMargin;
      const minY = rabbitRadius + wallMargin;
      const maxY = vh - rabbitRadius - wallMargin;
      if (rcx < minX) {
        rabbitPhys.rx += minX - rcx;
        rabbitPhys.vx = Math.abs(rabbitPhys.vx) * 0.75 + wallKick;
      } else if (rcx > maxX) {
        rabbitPhys.rx -= rcx - maxX;
        rabbitPhys.vx = -Math.abs(rabbitPhys.vx) * 0.75 - wallKick;
      }
      if (rcy < minY) {
        rabbitPhys.ry += minY - rcy;
        rabbitPhys.vy = Math.abs(rabbitPhys.vy) * 0.75 + wallKick;
      } else if (rcy > maxY) {
        rabbitPhys.ry -= rcy - maxY;
        rabbitPhys.vy = -Math.abs(rabbitPhys.vy) * 0.75 - wallKick;
      }

      rabbitHoop.style.transform =
        'translate3d(' + (baseX + rabbitPhys.rx) + 'px,' + (baseY + rabbitPhys.ry) + 'px,0)';
      rabbitFace.style.transform = 'scaleX(' + (Math.sin(ang) >= 0 ? 1 : -1) + ')';

      for (i = 0; i < eggs.length; i++) {
        const eggEl = eggs[i];
        const eph = ensureEggPhys(eggEl);
        eph.nx += eph.vx;
        eph.ny += eph.vy;
        eph.vx *= 0.84;
        eph.vy *= 0.84;

        if (eggEl.classList.contains('easter-egg--wander')) {
          const spd = Math.hypot(eph.vx, eph.vy);
          eggEl.style.transition = spd > 2 ? 'none' : eggEl.dataset.easterWanderTransition || '';
        }

        eggEl.style.setProperty('--egg-nudge-x', eph.nx + 'px');
        eggEl.style.setProperty('--egg-nudge-y', eph.ny + 'px');

        const er = eggEl.getBoundingClientRect();
        if (er.left < wallMargin) {
          eph.nx += wallMargin - er.left;
          eph.vx += wallKick;
        }
        if (er.right > vw - wallMargin) {
          eph.nx -= er.right - (vw - wallMargin);
          eph.vx -= wallKick;
        }
        if (er.top < wallMargin) {
          eph.ny += wallMargin - er.top;
          eph.vy += wallKick;
        }
        if (er.bottom > vh - wallMargin) {
          eph.ny -= er.bottom - (vh - wallMargin);
          eph.vy -= wallKick;
        }
        eggEl.style.setProperty('--egg-nudge-x', eph.nx + 'px');
        eggEl.style.setProperty('--egg-nudge-y', eph.ny + 'px');
      }

      requestAnimationFrame(physicsFrame);
    }

    requestAnimationFrame(physicsFrame);
  }
})();
