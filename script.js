/* =========================================================
   ORTHOS — Orthopaedic Speciality OPD  ·  Interactions
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- Sticky navbar shadow ---------- */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    backToTop.classList.toggle('show', window.scrollY > 600);
    highlightNav();
  };

  /* ---------- Active nav link ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = [...navLinks].map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  function highlightNav() {
    const pos = window.scrollY + 120;
    let current = sections[0]?.getAttribute('id');
    sections.forEach((sec) => {
      if (pos >= sec.offsetTop) current = sec.getAttribute('id');
    });
    navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
  }

  /* ---------- Back to top ---------- */
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const navList = document.getElementById('navLinks');
  function closeMenu() {
    navList.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  hamburger.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });
  navLinks.forEach((l) => l.addEventListener('click', closeMenu));
  document.addEventListener('click', (e) => {
    if (navList.classList.contains('open') && !navList.contains(e.target) && !hamburger.contains(e.target)) closeMenu();
  });

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('.stat-num[data-count]');
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        counterObserver.unobserve(el);
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(eased * target).toLocaleString('en-IN') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((c) => counterObserver.observe(c));

  /* ---------- Testimonial slider ---------- */
  const track = document.getElementById('testiTrack');
  const dotsWrap = document.getElementById('testiDots');
  const slides = track.children;
  let index = 0;

  for (let i = 0; i < slides.length; i++) {
    const d = document.createElement('button');
    d.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  }
  const dots = dotsWrap.children;

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = 'translateX(-' + index * 100 + '%)';
    track.style.transition = 'transform .6s cubic-bezier(.6,0,.2,1)';
    [...dots].forEach((d, di) => d.classList.toggle('active', di === index));
  }
  goTo(0);
  document.getElementById('testiPrev').addEventListener('click', () => goTo(index - 1));
  document.getElementById('testiNext').addEventListener('click', () => goTo(index + 1));

  let autoTimer = setInterval(() => goTo(index + 1), 7000);
  const slider = track.closest('.testimonial-slider');
  slider.addEventListener('mouseenter', () => clearInterval(autoTimer));
  slider.addEventListener('mouseleave', () => {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(index + 1), 7000);
  });
  let touchX = 0;
  slider.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ---------- Appointment form (WhatsApp hand-off) ---------- */
  const form = document.getElementById('appointmentForm');
  const success = document.getElementById('formSuccess');
  const PHONE = '919137400914';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('fName').value.trim();
    const phone = document.getElementById('fPhone').value.trim();
    const service = document.getElementById('fService').value;
    const date = document.getElementById('fDate').value;
    const message = document.getElementById('fMsg').value.trim();

    const lines = [
      'New Appointment Request — Orthos OPD',
      '-------------------------------',
      'Name: ' + name,
      'Phone: ' + phone,
      'Concern: ' + service,
      date ? 'Preferred Date: ' + date : '',
      message ? 'Message: ' + message : ''
    ].filter(Boolean);

    const waUrl = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(lines.join('\n'));
    window.open(waUrl, '_blank', 'noopener');

    success.hidden = false;
    form.querySelectorAll('input, textarea, select').forEach((el) => {
      if (el.type !== 'date') el.value = '';
      else el.value = '';
    });
    setTimeout(() => { success.hidden = true; }, 6000);
  });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Smooth anchor offset already via scroll-padding ---------- */
})();
