(() => {
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch =
    'ontouchstart' in window ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);

  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // --- GSAP availability check ---
  const hasGSAP = typeof window.gsap !== 'undefined';

  // --- Smooth scroll to anchors ---
  function smoothScrollToHash(hash) {
    const target = document.querySelector(hash);
    if (!target) return;

    // Keep it simple + reliable; respect reduced motion
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  document.querySelectorAll('.js-scroll').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      smoothScrollToHash(href);
    });
  });

  // --- Drawer (right-to-left reveal) ---
  const drawer = document.getElementById('drawer');
  const backdrop = document.querySelector('.js-drawer-backdrop');
  const openBtns = document.querySelectorAll('.js-menu-open');
  const closeBtn = document.querySelector('.js-menu-close');
  const drawerLinks = document.querySelectorAll('.js-drawer-link');

  let isOpen = false;
  let lastActiveEl = null;

  function setAriaExpanded(expanded) {
    openBtns.forEach((btn) => btn.setAttribute('aria-expanded', expanded ? 'true' : 'false'));
  }

  function lockBody(lock) {
    document.body.classList.toggle('body--locked', lock);
  }

  function focusFirstLink() {
    const first = drawer?.querySelector('.drawer__link');
    if (first) first.focus();
  }

  // GSAP timeline for drawer (luxury timing)
  let drawerTl = null;
  function buildDrawerTimeline() {
    if (!hasGSAP) return null;

    const links = drawer.querySelectorAll('.drawer__link');
    const headerBits = drawer.querySelectorAll('.drawer__title, .drawer__close');
    const footerBits = drawer.querySelectorAll('.drawer__footer');

    const tl = window.gsap.timeline({ paused: true });

    // Backdrop fade + drawer slide
    tl.set(backdrop, { display: 'block' }, 0)
      .to(backdrop, {
        opacity: 1,
        duration: prefersReducedMotion ? 0.12 : 0.28,
        ease: 'power2.out',
      }, 0)
      .to(drawer, {
        x: 0,
        duration: prefersReducedMotion ? 0.16 : 0.62,
        ease: 'power3.out', // cinematic, heavy
      }, 0);

    // Stagger content inside
    tl.fromTo(headerBits, { y: 10, opacity: 0 }, {
      y: 0, opacity: 1,
      duration: prefersReducedMotion ? 0.12 : 0.30,
      ease: 'power2.out',
      stagger: prefersReducedMotion ? 0 : 0.06,
    }, prefersReducedMotion ? 0.05 : 0.18);

    tl.fromTo(links, { x: 18, opacity: 0 }, {
      x: 0, opacity: 1,
      duration: prefersReducedMotion ? 0.12 : 0.34,
      ease: 'power2.out',
      stagger: prefersReducedMotion ? 0 : 0.065,
    }, prefersReducedMotion ? 0.08 : 0.26);

    tl.fromTo(footerBits, { y: 10, opacity: 0 }, {
      y: 0, opacity: 1,
      duration: prefersReducedMotion ? 0.12 : 0.28,
      ease: 'power2.out',
    }, prefersReducedMotion ? 0.10 : 0.46);

    return tl;
  }

  function openDrawer() {
    if (isOpen) return;
    isOpen = true;

    lastActiveEl = document.activeElement;

    // show elements (ensure they exist)
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.style.opacity = '0';
    }

    if (drawer) {
      drawer.setAttribute('aria-hidden', 'false');
    }

    lockBody(true);
    setAriaExpanded(true);

    // Ensure base position for non-GSAP fallback
    if (!hasGSAP) {
      drawer.style.transform = 'translateX(0)';
      backdrop.style.opacity = '1';
      focusFirstLink();
      return;
    }

    if (!drawerTl) drawerTl = buildDrawerTimeline();
    window.gsap.set(drawer, { x: '100%' });
    window.gsap.set(drawer.querySelectorAll('.drawer__title, .drawer__close, .drawer__link, .drawer__footer'), { opacity: 0 });
    drawerTl.restart().eventCallback('onComplete', () => {
      focusFirstLink();
    });
  }

  function closeDrawer() {
    if (!isOpen) return;
    isOpen = false;

    setAriaExpanded(false);

    const restoreFocus = () => {
      if (lastActiveEl && typeof lastActiveEl.focus === 'function') lastActiveEl.focus();
      lastActiveEl = null;
    };

    const finalize = () => {
      if (drawer) drawer.setAttribute('aria-hidden', 'true');
      if (backdrop) {
        backdrop.hidden = true;
        backdrop.style.opacity = '';
      }
      lockBody(false);
      restoreFocus();
    };

    if (!hasGSAP || !drawerTl) {
      drawer.style.transform = 'translateX(100%)';
      finalize();
      return;
    }

    // Reverse animation (cinematic close)
    drawerTl.eventCallback('onReverseComplete', finalize);
    drawerTl.reverse();
  }

  openBtns.forEach((btn) => btn.addEventListener('click', openDrawer));
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  if (backdrop) {
    backdrop.addEventListener('click', closeDrawer);
  }

  drawerLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        closeDrawer();
        // slight delay so the close feels heavy, then scroll
        window.setTimeout(() => smoothScrollToHash(href), prefersReducedMotion ? 0 : 260);
      } else {
        closeDrawer();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') closeDrawer();
  });

  // basic focus trap
  document.addEventListener('keydown', (e) => {
    if (!isOpen || e.key !== 'Tab' || !drawer) return;

    const focusables = drawer.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // --- Page load sequence (GSAP cinematic) ---
  function runIntroAnimation() {
    if (!hasGSAP) return;

    const tl = window.gsap.timeline();
    const durIn = prefersReducedMotion ? 0.12 : 0.65;

    // Initial states
    window.gsap.set(
      ['.js-hero-kicker', '.js-hero-title', '.js-hero-sub', '.js-hero-cta', '.js-hero-statline'],
      { opacity: 0, y: 14 }
    );

    tl.to('.js-hero-kicker', { opacity: 1, y: 0, duration: durIn * 0.55, ease: 'power2.out' }, 0.05)
      .to('.js-hero-title',  { opacity: 1, y: 0, duration: durIn, ease: 'power3.out' }, 0.12)
      .to('.js-hero-sub',    { opacity: 1, y: 0, duration: durIn * 0.72, ease: 'power2.out' }, 0.22)
      .to('.js-hero-cta',    { opacity: 1, y: 0, duration: durIn * 0.70, ease: 'power2.out' }, 0.32)
      .to('.js-hero-statline',{ opacity: 1, y: 0, duration: durIn * 0.70, ease: 'power2.out' }, 0.40);
  }

  // --- Custom cursor: dot + ring (desktop only) ---
  function initCursor() {
    if (isTouch || prefersReducedMotion) return;

    const cursor = document.querySelector('.cursor');
    const dot = document.querySelector('.cursor__dot');
    const ring = document.querySelector('.cursor__ring');
    if (!cursor || !dot || !ring) return;

    // Hide native cursor only on desktop
    document.documentElement.style.cursor = 'none';
    document.body.style.cursor = 'none';

    // Also hide cursor for text inputs by allowing native cursor
    const allowNative = (el) => {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return true;
      if (el.isContentEditable) return true;
      return false;
    };

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    // Use GSAP quick setters for buttery transforms
    const setDotX = hasGSAP ? window.gsap.quickSetter(dot, 'x', 'px') : null;
    const setDotY = hasGSAP ? window.gsap.quickSetter(dot, 'y', 'px') : null;
    const setRingX = hasGSAP ? window.gsap.quickSetter(ring, 'x', 'px') : null;
    const setRingY = hasGSAP ? window.gsap.quickSetter(ring, 'y', 'px') : null;

    // Show cursor once moved
    let shown = false;

    function onMove(e) {
      x = e.clientX;
      y = e.clientY;

      if (!shown) {
        shown = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }

      // If hovering over text input areas, temporarily restore native cursor
      const el = document.elementFromPoint(x, y);
      if (allowNative(el)) {
        dot.style.opacity = '0';
        ring.style.opacity = '0';
        document.documentElement.style.cursor = '';
        document.body.style.cursor = '';
      } else {
        if (shown) {
          dot.style.opacity = '1';
          ring.style.opacity = '1';
        }
        document.documentElement.style.cursor = 'none';
        document.body.style.cursor = 'none';
      }
    }

    window.addEventListener('mousemove', onMove, { passive: true });

    // Hover response on interactive elements
    const interactiveSelector = 'a, button, [role="button"], .btn, .drawer__link';
    function isInteractive(el) {
      return el && el.closest && el.closest(interactiveSelector);
    }

    window.addEventListener('mousemove', (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const overInteractive = !!isInteractive(el);
      if (!overInteractive) {
        ring.style.borderColor = 'rgba(231,231,234,0.26)';
        ring.style.background = 'rgba(225,27,35,0.02)';
        ring.style.width = '34px';
        ring.style.height = '34px';
      } else {
        ring.style.borderColor = 'rgba(225,27,35,0.55)';
        ring.style.background = 'rgba(225,27,35,0.06)';
        ring.style.width = '42px';
        ring.style.height = '42px';
      }
    }, { passive: true });

    // Animation loop with slight inertia on ring
    function tick() {
      // dot snaps to pointer, ring lags behind (premium feel)
      rx += (x - rx) * 0.14;
      ry += (y - ry) * 0.14;

      if (hasGSAP) {
        setDotX(x);
        setDotY(y);
        setRingX(rx);
        setRingY(ry);
      } else {
        dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      }

      window.requestAnimationFrame(tick);
    }
    tick();
  }

  // --- Init ---
  // Set initial drawer styles for no-flash
  if (drawer) {
    drawer.style.transform = 'translateX(100%)';
  }
  if (backdrop) {
    backdrop.hidden = true;
    backdrop.style.opacity = '0';
  }

  runIntroAnimation();
  initCursor();
})();
