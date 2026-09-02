(() => {
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero');
  const heroSticky = document.getElementById('heroSticky');
  const heroCopy = document.getElementById('heroCopy');
  const scrollCue = document.getElementById('scrollCue');
  const heroEndReveal = document.getElementById('heroEndReveal');

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

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- scroll-scrubbed sequence ---------- */
  function renderScene(p){
    const scrubP = clamp(p / 0.65, 0, 1);
    const targetIndex = clamp(Math.floor(scrubP * (frameCount - 1)), 0, frameCount - 1);
    if (targetIndex !== currentFrameIndex) {
      currentFrameIndex = targetIndex;
      drawFrame(currentFrameIndex);
    }

    // Initial hero copy + scroll cue
    if (heroCopy) {
      heroCopy.style.opacity = clamp(1 - p / 0.1, 0, 1);
      heroCopy.style.transform = `translateY(${p * -40}px)`;
    }
    if (scrollCue) {
      const cueOpacity = clamp(1 - p / 0.12, 0, 1);
      scrollCue.style.opacity = cueOpacity;
      scrollCue.style.transform = `translate(-50%, ${p * 40}px)`;
    }

    // Hero End Reveal: phone mockup + text + QR code
    const revealP = clamp((p - 0.6) / 0.35, 0, 1);
    if (heroEndReveal) {
      heroEndReveal.style.opacity = revealP;
      heroEndReveal.style.transform = `translateY(${lerp(40, 0, revealP)}px)`;
      heroEndReveal.style.pointerEvents = revealP > 0.5 ? 'auto' : 'none';
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

  /* ---------- QR codes ---------- */
  function initQRCodes() {
    if (!window.QRCode) return;
    
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

    const infoQr = document.getElementById('qrcode');
    if (infoQr && infoQr.children.length === 0) {
      new QRCode(infoQr, {
        text: 'https://moodplace001.vercel.app/',
        width: 148,
        height: 148,
        colorDark: '#1C3B2B',
        colorLight: '#F7F4EE',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }

  /* ---------- Features Section Scroll Reveal Observer ---------- */
  function initScrollReveal() {
    const revealRows = document.querySelectorAll('[data-reveal]');
    if (!revealRows.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.15
    });

    revealRows.forEach((row) => observer.observe(row));
  }

  /* ---------- UI/UX Screen Gallery Horizontal Drag & Wheel & Button Controller ---------- */
  function initGalleryControls() {
    const gallery = document.getElementById('screenGallery');
    const prevBtn = document.getElementById('galleryPrevBtn');
    const nextBtn = document.getElementById('galleryNextBtn');
    if (!gallery) return;

    // 1. Mouse Drag to Scroll
    let isDown = false;
    let startX;
    let scrollLeft;

    gallery.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - gallery.offsetLeft;
      scrollLeft = gallery.scrollLeft;
    });
    gallery.addEventListener('mouseleave', () => { isDown = false; });
    gallery.addEventListener('mouseup', () => { isDown = false; });
    gallery.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - gallery.offsetLeft;
      const walk = (x - startX) * 2; // scroll speed
      gallery.scrollLeft = scrollLeft - walk;
    });

    // 2. Mouse Wheel vertical to horizontal smooth scroll
    gallery.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        gallery.scrollBy({
          left: e.deltaY * 1.5,
          behavior: 'smooth'
        });
      }
    }, { passive: false });

    // 3. Arrow buttons navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        gallery.scrollBy({ left: -260, behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        gallery.scrollBy({ left: 260, behavior: 'smooth' });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initQRCodes();
      initScrollReveal();
      initGalleryControls();
    });
  } else {
    initQRCodes();
    initScrollReveal();
    initGalleryControls();
  }
  window.addEventListener('load', () => {
    initQRCodes();
    initScrollReveal();
    initGalleryControls();
  });
})();
