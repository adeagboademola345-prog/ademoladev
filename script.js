(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight - 60 && r.bottom > 0;
  };

  const setStagger = (root, base = 0.08) => {
    if (!root) return;
    const items = root.querySelectorAll('.reveal');
    items.forEach((el, i) => el.style.setProperty('--rd', `${(base * i).toFixed(2)}s`));
  };

  /* ==================== HEADER ==================== */

  const header = $('#siteHeader');
  const onScrollHeader = () => header.classList.toggle('scrolled', window.scrollY > 24);

  /* ==================== MOBILE MENU ==================== */

  const menuToggle = $('#menuToggle');
  const navMenu = $('#navMenu');

  const closeMenu = () => {
    navMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('no-scroll');
  };

  const openMenu = () => {
    navMenu.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('no-scroll');
    const firstLink = navMenu.querySelector('.nav-list a');
    if (firstLink) firstLink.focus();
  };

  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    open ? closeMenu() : openMenu();
  });

  $$('.nav-menu a').forEach((a) => {
    a.addEventListener('click', () => {
      if (navMenu.classList.contains('open')) closeMenu();
    });
  });

  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860 && navMenu.classList.contains('open')) closeMenu();
  });

  /* ==================== SCROLL PROGRESS ==================== */

  const scrollProgress = $('#scrollProgress');
  const onScrollProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };

  /* ==================== ACTIVE NAV ==================== */

  const navLinks = $$('.nav-list a');
  const sectionIds = ['work', 'services', 'about', 'contact'];
  const sectionEls = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  let activeSection = sectionIds[0];

  const setActiveSection = (id) => {
    if (id === activeSection || !sectionIds.includes(id)) return;
    activeSection = id;
    navLinks.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  };

  if ('IntersectionObserver' in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sectionEls.forEach((el) => navIO.observe(el));
  }

  /* ==================== HERO STATS ==================== */

  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    const dur = 1300;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const stats = $$('.stat-num');
  if ('IntersectionObserver' in window) {
    const statIO = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    stats.forEach((s) => statIO.observe(s));
  } else {
    stats.forEach(runCount);
  }

  /* ==================== VIDEO / PORTRAIT ==================== */

  const mediaStage = $('#mediaStage');
  const mediaPoster = $('#mediaPoster');
  const mediaVideo = $('#mediaVideo');
  const playBtn = $('#playBtn');
  const playLabel = $('#playLabel');

  const setPlayLabel = (text) => { playLabel.textContent = text; };

  const backToPoster = () => {
    mediaPoster.classList.remove('is-hidden');
    mediaVideo.classList.remove('is-visible');
    mediaVideo.pause();
    setPlayLabel('Hear my welcome');
  };

  const videoFailed = () => {
    backToPoster();
    playBtn.classList.add('is-error');
    setPlayLabel('Video unavailable');
  };

  const startVideo = () => {
    if (playBtn.classList.contains('is-error')) return;
    mediaVideo.muted = false;
    playBtn.disabled = true;
    const attempt = mediaVideo.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(videoFailed);
    }
  };

  mediaVideo.addEventListener('playing', () => {
    mediaPoster.classList.add('is-hidden');
    mediaVideo.classList.add('is-visible');
    playBtn.disabled = false;
    setPlayLabel('Pause welcome');
  });

  mediaVideo.addEventListener('pause', backToPoster);
  mediaVideo.addEventListener('ended', () => {
    mediaVideo.pause();
    setPlayLabel('Play again');
  });
  mediaVideo.addEventListener('error', videoFailed);

  const toggleVideo = () => {
    if (mediaVideo.classList.contains('is-visible')) {
      backToPoster();
    } else {
      startVideo();
    }
  };

  playBtn.addEventListener('click', toggleVideo);
  mediaStage.addEventListener('click', (e) => {
    if (e.target === playBtn) return;
    toggleVideo();
  });

  if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
    mediaStage.addEventListener('mousemove', (e) => {
      const r = mediaStage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      mediaStage.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${y * -4}deg)`;
    });
    mediaStage.addEventListener('mouseleave', () => {
      mediaStage.style.transform = '';
    });
  }

  /* ==================== REVEALS ==================== */

  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const revealIO = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('inview');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => revealIO.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('inview'));
  }

  /* ==================== QUICK ENQUIRY DRAWER ==================== */

  const drawer = $('#formDrawer');
  const drawerHint = $('#formHint');
  let activeDrawer = false;
  let lastFocused = null;

  const focusablesIn = (root) =>
    Array.from(root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.hidden && el.offsetParent !== null);

  const onKeydown = (e) => {
    if (!activeDrawer) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeDrawer();
      return;
    }

    if (e.key === 'Tab') {
      const f = focusablesIn(drawer);
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const openDrawer = () => {
    if (activeDrawer) closeDrawer();
    lastFocused = document.activeElement;
    activeDrawer = true;
    drawerHint.textContent = '';
    drawerHint.className = 'form-hint';
    $('#enquiryForm').querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    drawer.hidden = false;
    document.body.classList.add('no-scroll');
    document.addEventListener('keydown', onKeydown);
    requestAnimationFrame(() => {
      const f = focusablesIn(drawer);
      if (f[0]) f[0].focus();
    });
  };

  const closeDrawer = () => {
    if (!activeDrawer) return;
    drawer.hidden = true;
    activeDrawer = false;
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused && isVisible(lastFocused)) lastFocused.focus();
  };

  $$('[data-drawer-close]').forEach((el) => {
    el.addEventListener('click', closeDrawer);
  });

  $('#openFormBtn').addEventListener('click', openDrawer);

  /* ==================== ENQUIRY FORM ==================== */

  const enquiryForm = $('#enquiryForm');

  const setInvalid = (el) => {
    el.classList.add('is-invalid');
    el.addEventListener('input', () => el.classList.remove('is-invalid'), { once: true });
  };

  enquiryForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = $('#f-name');
    const email = $('#f-email');
    const service = $('#f-service');
    const desc = $('#f-desc');

    drawerHint.textContent = '';
    drawerHint.className = 'form-hint';

    let firstBad = null;
    if (!name.value.trim()) { setInvalid(name); firstBad = firstBad || name; }
    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { setInvalid(email); firstBad = firstBad || email; }
    if (!service.value) { setInvalid(service); firstBad = firstBad || service; }
    if (!desc.value.trim()) { setInvalid(desc); firstBad = firstBad || desc; }

    if (firstBad) {
      drawerHint.textContent = 'Please fill in the highlighted fields.';
      drawerHint.className = 'form-hint err';
      firstBad.focus();
      return;
    }

    const subject = `Project enquiry from ${name.value.trim()} (${service.value})`;
    const bodyLines = [
      'Hi Ademola,',
      '',
      desc.value.trim(),
      '',
      'Name: ' + name.value.trim(),
      'Email: ' + email.value.trim(),
      'Service required: ' + service.value,
    ].join('\n');

    const mailto = 'mailto:adeagboademola345@gmail.com' +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(bodyLines);

    drawerHint.textContent = 'Opening your email app…';
    drawerHint.className = 'form-hint ok';

    window.location.href = mailto;

    window.setTimeout(() => {
      enquiryForm.reset();
      closeDrawer();
    }, 900);
  });

  /* ==================== BACK TO TOP ==================== */

  const backToTop = $('#backToTop');
  const onScrollTop = () => backToTop.classList.toggle('is-visible', window.scrollY > 620);

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ==================== MISC ==================== */

  $('#year').textContent = new Date().getFullYear();

  setStagger(document.querySelector('.hero-text'));
  setStagger(document.querySelector('.svc-grid'));
  setStagger(document.querySelector('.process-grid'));
  setStagger(document.querySelector('.contact-inner'));

  const onScroll = () => {
    onScrollHeader();
    onScrollTop();
    onScrollProgress();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();