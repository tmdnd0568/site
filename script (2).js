(() => {
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero');
  const heroSticky = document.getElementById('heroSticky');
  const heroCopy = document.getElementById('heroCopy');
  const scrollCue = document.getElementById('scrollCue');
  const aiSearchCallout = document.getElementById('aiSearchCallout');

  /* ---------- Canvas Scroll Scrubbing Engine ---------- */
  const heroCanvas = document.getElementById('heroCanvas');
  const ctx = heroCanvas ? heroCanvas.getContext('2d') : null;
  const frameCount = 260;
  const images = new Array(frameCount);
  let currentFrameIndex = 0;

  const getFrameUrl = index => `scroll/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`;

  function resizeCanvas() {
    if (!heroCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    heroCanvas.width = window.innerWidth * dpr;
    heroCanvas.height = window.innerHeight * dpr;
    drawFrame(currentFrameIndex);
  }

  function drawFrame(index) {
    if (!heroCanvas || !ctx) return;

    // Get target image or closest loaded image from memory
    let img = images[index];
    if (!img || !img.complete || img.naturalWidth === 0) {
      let nearest = -1;
      let minDiff = Infinity;
      for (let i = 0; i < frameCount; i++) {
        if (images[i] && images[i].complete && images[i].naturalWidth > 0) {
          const diff = Math.abs(i - index);
          if (diff < minDiff) {
            minDiff = diff;
            nearest = i;
          }
        }
      }
      if (nearest !== -1) {
        img = images[nearest];
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = heroCanvas.width;
    const ch = heroCanvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, x, y, w, h);
  }

  // Throttled Batch Queue Preloader (Max 4 concurrent requests)
  const loadOrder = [];
  for (let i = 0; i < frameCount; i += 4) loadOrder.push(i);
  for (let i = 0; i < frameCount; i++) {
    if (!loadOrder.includes(i)) loadOrder.push(i);
  }

  let activeDownloads = 0;
  let queueIndex = 0;
  const MAX_CONCURRENT = 4;

  function processQueue() {
    while (activeDownloads < MAX_CONCURRENT && queueIndex < loadOrder.length) {
      const frameIdx = loadOrder[queueIndex++];
      activeDownloads++;

      const img = new Image();
      img.onload = img.onerror = () => {
        activeDownloads--;
        images[frameIdx] = img;
        drawFrame(currentFrameIndex);
        processQueue();
      };
      img.src = getFrameUrl(frameIdx);
    }
  }

  processQueue();

  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  const scene = document.getElementById('scene');
  const sun = document.getElementById('sun');
  const sunCore = document.getElementById('sunCore');
  const clouds = document.getElementById('clouds');
  const skylineFar = document.getElementById('skylineFar');
  const street = document.getElementById('street');
  const walker = document.getElementById('walker');
  const legL = document.getElementById('legL');
  const legR = document.getElementById('legR');
  const armL = document.getElementById('armL');
  const armR = document.getElementById('armR');
  const phoneReveal = document.getElementById('phoneReveal');
  const skyStop1 = document.getElementById('skyStop1');
  const skyStop2 = document.getElementById('skyStop2');
  const windows = document.getElementById('windows');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- scroll-scrubbed sequence ---------- */
  function renderScene(p){
    const targetIndex = clamp(Math.floor(p * (frameCount - 1)), 0, frameCount - 1);
    if (targetIndex !== currentFrameIndex) {
      currentFrameIndex = targetIndex;
      drawFrame(currentFrameIndex);
    }

    // copy + scroll cue
    if (heroCopy) {
      heroCopy.style.opacity = clamp(1 - p / 0.1, 0, 1);
      heroCopy.style.transform = `translateY(${p * -40}px)`;
    }
    if (scrollCue) {
      const cueOpacity = clamp(1 - p / 0.12, 0, 1);
      scrollCue.style.opacity = cueOpacity;
      scrollCue.style.transform = `translate(-50%, ${p * 40}px)`;
    }

    // AI search callout box at ezgif-frame-128 (frame index 127)
    if (aiSearchCallout) {
      const dist = Math.abs(currentFrameIndex - 127);
      const calloutAlpha = clamp(1 - dist / 22, 0, 1);
      aiSearchCallout.style.opacity = calloutAlpha;
      aiSearchCallout.style.transform = `translate(-50%, -50%) scale(${lerp(0.85, 1, calloutAlpha)})`;
    }

    // phone reveal fade in towards bottom of hero scroll
    const d = clamp((p - 0.7) / 0.3, 0, 1);
    if (phoneReveal) {
      phoneReveal.style.opacity = d;
      phoneReveal.style.transform = `translate(-50%,-40%) scale(${lerp(0.86, 1, d)})`;
    }
  }

  let ticking = false;
  function onScroll(){
    nav.classList.toggle('is-scrolled', window.scrollY > 8);

    if (!ticking){
      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const total = hero.offsetHeight - window.innerHeight;
        const scrolled = clamp(-rect.top, 0, total);
        const p = total > 0 ? scrolled / total : 0;
        renderScene(p);
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  renderScene(0);

  /* ---------- QR code ---------- */
  if (window.QRCode){
    const heroQr = document.getElementById('heroEndQr');
    if (heroQr && heroQr.children.length === 0) {
      new QRCode(heroQr, {
        text: 'https://moodplace001.vercel.app/',
        width: 160,
        height: 160,
        colorDark: '#1C3B2B',
        colorLight: '#F7F4EE',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }
})();
