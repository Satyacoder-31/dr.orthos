/* =========================================================
   ORTHOS — Orthopaedic Speciality OPD  ·  Interactions
   Dr. Prashant Agrawal · DocOrthos Web Experience
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
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- Sticky navbar shadow & back to top ---------- */
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');
  const onScroll = () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    if (backToTop) backToTop.classList.toggle('show', window.scrollY > 500);
    highlightNav();
  };

  /* ---------- Active nav link ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = [...navLinks].map((l) => {
    const href = l.getAttribute('href');
    return href && href.startsWith('#') ? document.querySelector(href) : null;
  }).filter(Boolean);

  function highlightNav() {
    const pos = window.scrollY + 130;
    let current = sections[0]?.getAttribute('id');
    sections.forEach((sec) => {
      if (pos >= sec.offsetTop) current = sec.getAttribute('id');
    });
    navLinks.forEach((l) => {
      const href = l.getAttribute('href');
      l.classList.toggle('active', href === '#' + current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const navList = document.getElementById('navLinks');
  function closeMenu() {
    if (navList && hamburger) {
      navList.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  }
  if (hamburger && navList) {
    hamburger.addEventListener('click', () => {
      const open = navList.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });
    navLinks.forEach((l) => l.addEventListener('click', closeMenu));
    document.addEventListener('click', (e) => {
      if (navList.classList.contains('open') && !navList.contains(e.target) && !hamburger.contains(e.target)) {
        closeMenu();
      }
    });
  }

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
  if (track && dotsWrap) {
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

    const prevBtn = document.getElementById('testiPrev');
    const nextBtn = document.getElementById('testiNext');
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

    let autoTimer = setInterval(() => goTo(index + 1), 7000);
    const slider = track.closest('.testimonial-slider');
    if (slider) {
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
    }
  }

  /* ---------- Video Filtering ---------- */
  const videoFilterBtns = document.querySelectorAll('#videoFilters .filter-btn');
  const videoCards = document.querySelectorAll('.video-card');

  videoFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      videoFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      videoCards.forEach((card) => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* ---------- Gallery Filtering ---------- */
  const galleryFilterBtns = document.querySelectorAll('#galleryFilters .filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  galleryFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      galleryFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.gfilter;

      galleryItems.forEach((item) => {
        if (filter === 'all' || item.dataset.gcat === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  /* ---------- FAQ Accordion & Search ---------- */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const q = item.querySelector('.faq-question');
    if (q) {
      q.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach((i) => i.classList.remove('active'));
        if (!isActive) item.classList.add('active');
      });
    }
  });

  const faqSearch = document.getElementById('faqSearch');
  if (faqSearch) {
    faqSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      faqItems.forEach((item) => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
          item.style.display = 'block';
          if (query.length > 2) item.classList.add('active');
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  /* ---------- Appointment Form Submission ---------- */
  const form = document.getElementById('appointmentForm');
  const success = document.getElementById('formSuccess');
  const PHONE = '919137400914';

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('fName').value.trim();
      const phone = document.getElementById('fPhone').value.trim();
      const location = document.getElementById('fLocation').value;
      const service = document.getElementById('fService').value;
      const date = document.getElementById('fDate').value;
      const slot = document.getElementById('fSlot').value;
      const message = document.getElementById('fMsg').value.trim();

      const lines = [
        'New Appointment Request — DocOrthos / ORTHOS OPD',
        '--------------------------------------------',
        'Patient Name: ' + name,
        'Mobile Number: ' + phone,
        'Preferred Location: ' + location,
        'Concern / Speciality: ' + service,
        date ? 'Preferred Date: ' + date : '',
        'Preferred Slot: ' + slot,
        message ? 'Symptoms / Details: ' + message : ''
      ].filter(Boolean);

      const waUrl = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(lines.join('\n'));
      window.open(waUrl, '_blank', 'noopener');

      if (success) success.hidden = false;
      form.reset();
      setTimeout(() => { if (success) success.hidden = true; }, 8000);
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Global Modals Handler ---------- */
  window.closeAllModals = function () {
    document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('show'));
    document.body.style.overflow = '';
  };

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeAllModals();
  });

  // Close when clicking modal backdrop
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) window.closeAllModals();
    });
  });

  function showModal(backdropId) {
    const el = document.getElementById(backdropId);
    if (el) {
      el.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  /* ---------- Helper: Location Selector from Schedule Cards ---------- */
  window.selectLocationInForm = function (locName) {
    const locSelect = document.getElementById('fLocation');
    if (locSelect) {
      locSelect.value = locName;
    }
  };

  /* ---------- Video Modal ---------- */
  window.openVideoModal = function (title, desc, duration, thumbUrl) {
    document.getElementById('vmTitle').textContent = title;
    document.getElementById('vmDesc').textContent = desc;
    document.getElementById('vmThumb').src = thumbUrl;
    const searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('Dr Prashant Agrawal ' + title);
    document.getElementById('vmYtLink').href = searchUrl;
    showModal('videoModalBackdrop');
  };

  /* ---------- Lightbox Modal ---------- */
  window.openLightbox = function (imgUrl, caption) {
    document.getElementById('lbImg').src = imgUrl;
    document.getElementById('lbCaption').textContent = caption;
    document.getElementById('lbTitle').textContent = caption;
    showModal('lightboxModalBackdrop');
  };

  /* ---------- Universal Service Details Data & Modal ---------- */
  const servicesData = {
    robotic: {
      title: 'Robotic Joint Replacement (Knee & Hip)',
      img: 'https://images.unsplash.com/photo-1758206523735-079e56f2faf7?q=80&w=1200&auto=format&fit=crop',
      overview: 'Robotic-assisted joint replacement represents the pinnacle of modern orthopedic surgical technology. Under Dr. Prashant Agrawal\'s expertise at Apollo Hospitals Navi Mumbai (NABH & JCI Accredited Centre), robotic systems provide sub-millimeter precision, personalized 3D pre-operative CT modeling, and haptic robotic arm guidance.',
      conditions: [
        'Severe Osteoarthritis of Knee & Hip with joint space obliteration',
        'Rheumatoid Arthritis and inflammatory joint degradation',
        'Avascular Necrosis (AVN) of the femoral head requiring Total Hip Replacement',
        'Post-Traumatic Arthritis following intra-articular fractures'
      ],
      advantages: [
        'Sub-Millimeter Accuracy: Precision bone resections matching the patient\'s unique natural anatomy.',
        'Preservation of Healthy Bone & Ligaments: Spares maximum healthy bone and preserves the posterior cruciate ligament (PCL) where viable.',
        'Optimal Implant Alignment: Eliminates human alignment errors and drastically minimizes implant wear, extending prosthesis lifespan.',
        'Faster, Less Painful Recovery: Minimal soft-tissue disturbance allows most patients to stand and walk on the very evening of surgery.'
      ],
      recovery: 'Patients typically spend 2 to 3 days in the hospital, begin guided physiotherapy within hours, and transition to unassisted walking within 2 to 3 weeks.'
    },
    trauma: {
      title: 'Complex Trauma & Polytrauma Care',
      img: 'https://images.unsplash.com/photo-1748407408885-9b62df0e2527?q=80&w=1200&auto=format&fit=crop',
      overview: 'Complex orthopedic trauma involves high-velocity injuries causing severe damage to bones, joints, muscles, neurovascular bundles, and soft tissue. Dr. Prashant Agrawal is a recognized authority in emergency polytrauma resuscitation, pelvic-acetabular reconstruction, and limb salvage.',
      conditions: [
        'Open (Compound) Fractures with bone exposure and soft-tissue defects',
        'Comminuted and Segmental Fractures of long bones',
        'Pelvic Ring Disruptions & Acetabular (Hip Socket) Fractures',
        'Complex Intra-articular Fractures (Pilon fractures, plateau fractures)',
        'Polytrauma, Mangled Extremities & Acute Compartment Syndrome'
      ],
      advantages: [
        'Multidisciplinary Trauma Team: Coordinated protocols involving orthopedic trauma surgeons, vascular surgeons, and plastic/reconstructive teams.',
        'Advanced Surgical Techniques: Staged damage-control external fixation followed by definitive anatomical locking compression plates (LCP) and interlocking intramedullary nails.',
        'Limb Salvage & Reconstruction: Microsurgical soft-tissue coverage and bone transport to avoid amputation.'
      ],
      recovery: 'Immediate resuscitation, infection control, rigid surgical stabilization, followed by monitored bone healing and intensive rehabilitation to restore mobility, strength, and independence.'
    },
    sports: {
      title: 'Sports Medicine & Athletic Rehabilitation',
      img: 'https://images.unsplash.com/photo-1740512922093-9c2756ab5844?q=80&w=1200&auto=format&fit=crop',
      overview: 'Dedicated to competitive athletes, fitness enthusiasts, and active individuals. Our sports medicine division balances state-of-the-art arthroscopic surgical reconstruction with targeted non-surgical therapies to maximize recovery and prevent re-injury.',
      conditions: [
        'Anterior Cruciate Ligament (ACL) and Posterior Cruciate Ligament (PCL) Tears',
        'Meniscus Tears (Radial, complex, and bucket-handle tears)',
        'Rotator Cuff Tears and Shoulder Impingement Syndrome',
        'Shoulder Labral Tears (Bankart and SLAP lesions) causing recurrent dislocations',
        'Patellar Instability, Hamstring Avulsions & Ankle Ligament Sprains'
      ],
      advantages: [
        'Anatomical Arthroscopic Reconstruction: Keyhole hamstring or bone-patellar tendon autografts.',
        'Regenerative Platelet-Rich Plasma (PRP): Autologous growth factor injections to accelerate tendon and ligament healing.',
        'Structured Return-to-Sport Protocols: Strict objective functional testing prior to athletic clearance.'
      ],
      recovery: 'Phased progressive physical therapy starting day 1, with targeted return to full athletic competition typically achieved between 6 to 9 months.'
    },
    arthroscopy: {
      title: 'Arthroscopic Shoulder & Knee Surgery',
      img: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=1200&auto=format&fit=crop',
      overview: 'Arthroscopy is a minimally invasive surgical procedure that uses high-definition miniature cameras and specialized micro-instruments inserted through tiny incisions (5–8 mm) to inspect, diagnose, and repair damaged joint tissues.',
      conditions: [
        'Knee: Meniscal tears, ACL/PCL tears, cartilage defects, loose bodies, early osteoarthritis',
        'Shoulder: Rotator cuff tears, subacromial impingement, recurrent shoulder dislocation, adhesive capsulitis (frozen shoulder)'
      ],
      advantages: [
        'Minimal Tissue Trauma: Does not require cutting large muscles or opening the entire joint capsule.',
        'Significantly Reduced Pain & Bleeding: Minimal post-operative pain and negligible infection risk.',
        'Day-Care or 24-Hour Stay: Fast discharge and rapid return to everyday activities.'
      ],
      recovery: 'Most patients return home within 24 hours and begin active assisted range-of-motion therapy immediately.'
    },
    fracture: {
      title: 'Comprehensive Fracture Care',
      img: 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?q=80&w=1200&auto=format&fit=crop',
      overview: 'Fracture management at ORTHOS spans complete non-surgical and surgical modalities. We handle fractures from initial emergency reduction and cast immobilization to precise surgical fixation and long-term bone healing surveillance.',
      conditions: [
        'Simple & Non-displaced Fractures: Treated with modern lightweight casts and splints',
        'Displaced & Unstable Fractures: Requiring open reduction and internal fixation (ORIF)',
        'Compound (Open) Fractures: Requiring urgent debridement and antibiotic prophylaxis',
        'Stress Fractures: Cracks caused by repetitive loading in runners and military recruits',
        'Avulsion Fractures: Where tendons pull away fragments of bone'
      ],
      advantages: [
        'On-Site Digital Radiography: Immediate accurate imaging and precise diagnostic assessment.',
        'Biological Internal Fixation: Preserving the fracture hematoma and periosteal blood supply for rapid callus formation.',
        'Structured Bone Density Optimization: Investigating underlying osteoporosis to prevent secondary fractures.'
      ],
      recovery: 'Continuous clinical and radiographic follow-up at 2, 6, and 12 weeks with customized physiotherapy to regain full joint range.'
    },
    periprosthetic: {
      title: 'Peri-Prosthetic Joint Infections & Fractures',
      img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1200&auto=format&fit=crop',
      overview: 'Peri-prosthetic complications represent some of the most challenging problems in orthopedics, occurring around existing joint replacements (hip, knee, shoulder). Dr. Prashant Agrawal brings decades of specialized experience in revision arthroplasty.',
      conditions: [
        'Peri-Prosthetic Joint Infections (PJI): Deep bacterial infections around implants',
        'Peri-Prosthetic Fractures: Broken bones around artificial hip stems or knee femoral components',
        'Aseptic Loosening: Mechanical implant loosening without infection',
        'Persistent Post-Operative Pain & Joint Instability following prior replacements'
      ],
      advantages: [
        'Two-Stage Revision Protocol: Debridement and placement of high-dose antibiotic articulating spacers, followed by definitive revision.',
        'Specialized Revision Implants: Trabecular metal augments, modular revision stems, and constrained revision knee systems.',
        'Multidisciplinary Team: Close coordination with infectious disease specialists and dedicated rehabilitation therapists.'
      ],
      recovery: 'Carefully staged recovery with monitored inflammatory markers (ESR, CRP) and customized weight-bearing protocols.'
    },
    conservative: {
      title: 'Conservative Orthopedic Management',
      img: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=1200&auto=format&fit=crop',
      overview: 'Our core philosophy is that surgery is the last resort. At ORTHOS, we exhaustively explore evidence-based non-surgical interventions to reduce inflammation, strengthen surrounding musculature, and preserve natural joint longevity.',
      conditions: [
        'Mild to Moderate Knee & Hip Osteoarthritis',
        'Chronic Tendinitis, Tendinosis & Bursitis (Tennis elbow, Achilles tendinitis)',
        'Cervical & Lumbar Mechanical Back Pain and Muscle Spasms',
        'Plantar Fasciitis, Ankle Sprains, and Ergonomic Postural Disorders'
      ],
      advantages: [
        'Targeted Physiotherapy Protocols: Guided muscle strengthening and joint mobilization under expert supervision.',
        'Viscosupplementation: High-molecular-weight hyaluronic acid injections providing joint lubrication.',
        'Platelet-Rich Plasma (PRP) Therapy: Harnessing your body\'s natural growth factors to stimulate cartilage health.',
        'Ergonomic Counseling & Custom Orthotics: Unloader braces and workstation posture correction.'
      ],
      recovery: 'Gradual, lasting improvement in joint comfort and functional mobility without surgical downtime.'
    },
    spine: {
      title: 'Spine & Back Care',
      img: 'https://images.unsplash.com/photo-1643834534240-75aee14ecdc8?q=80&w=1200&auto=format&fit=crop',
      overview: 'Comprehensive diagnosis and conservative-first treatment for spinal disorders, back pain, and nerve compression. Led by Dr. Prashant Agrawal, we prioritize non-operative restoration of spinal balance and pain relief.',
      conditions: [
        'Lumbar Disc Herniation (Slipped Disc) & Sciatica nerve pain',
        'Cervical Spondylosis with radiating arm numbness and tingling',
        'Spinal Canal Stenosis and Degenerative Disc Disease',
        'Postural Kyphosis and Chronic Lower Back Strain'
      ],
      advantages: [
        'Comprehensive Neurological Assessment: Thorough clinical examination correlating symptoms with MRI scans.',
        'Non-Surgical Spinal Decompression & Core Stabilization Exercises.',
        'Targeted Epidural & Nerve Root Injections for acute sciatica pain relief.'
      ],
      recovery: 'Over 90% of back pain and sciatica cases achieve complete pain relief and return to normal life through our non-surgical spine protocols.'
    }
  };

  window.openServiceModal = function (key) {
    const data = servicesData[key];
    if (!data) return;

    document.getElementById('smTitle').textContent = data.title;
    const body = document.getElementById('smBody');
    body.innerHTML = `
      <div class="service-modal-hero">
        <img src="${data.img}" alt="${data.title}" />
      </div>
      <div class="service-modal-section">
        <h4>Overview</h4>
        <p>${data.overview}</p>
      </div>
      <div class="service-modal-section">
        <h4>Conditions Treated</h4>
        <ul>${data.conditions.map((c) => `<li>${c}</li>`).join('')}</ul>
      </div>
      <div class="service-modal-section">
        <h4>Key Clinical Advantages</h4>
        <ul>${data.advantages.map((a) => `<li>${a}</li>`).join('')}</ul>
      </div>
      <div class="service-modal-section">
        <h4>Expected Recovery Timeline</h4>
        <p>${data.recovery}</p>
      </div>
    `;
    showModal('serviceModalBackdrop');
  };

  /* ---------- Blog Articles Data & Modal ---------- */
  const blogArticles = [
    {
      title: 'Robotic Knee Replacement vs Traditional Surgery: The Precision Difference',
      category: 'Robotics',
      author: 'Dr. Prashant Agrawal',
      readTime: '5 min read',
      img: 'https://images.unsplash.com/photo-1758206523735-079e56f2faf7?q=80&w=1200&auto=format&fit=crop',
      content: `
        <p><strong>By Dr. Prashant Agrawal (MS Orthopaedics)</strong><br />Senior Consultant Orthopaedic Surgeon · Apollo Hospitals Navi Mumbai &amp; ORTHOS OPD</p>
        <br />
        <h4>Understanding the Robotic Leap</h4>
        <p>For decades, conventional knee replacement surgery relied on mechanical cutting blocks and manual visual alignment. While thousands benefited, individual variations in anatomy, ligament tightness, and bony deformities created challenges in achieving identical balance in every patient.</p>
        <br />
        <p>Today, <strong>robotic-assisted knee replacement</strong> eliminates this variability. A 3D CT scan of the patient's knee is captured prior to surgery. This virtual computer model allows us to plan the exact size, orientation, and angle of the prosthesis with sub-millimeter precision before stepping into the operating theatre.</p>
        <br />
        <h4>Key Advantages of Robotic Surgery:</h4>
        <p>• <strong>Sub-Millimeter Haptic Accuracy:</strong> The robotic arm restricts bone cuts to the exact pre-planned boundary. If the surgeon strays by even 0.5 mm, the robotic system automatically pauses the blade, ensuring total safety for adjacent blood vessels and nerves.</p>
        <p>• <strong>True Soft-Tissue Balance:</strong> The system calculates ligament tension through the complete arc of flexion and extension, resulting in a joint that feels natural and stable.</p>
        <p>• <strong>Less Trauma &amp; Faster Recovery:</strong> Because soft tissues are not aggressively stretched, post-operative swelling and pain are drastically reduced. Most patients at our center walk on the evening of surgery and return home within 48 to 72 hours.</p>
        <br />
        <p>If you suffer from severe osteoarthritis and are considering joint replacement, schedule a consultation at ORTHOS OPD or Apollo Hospitals Navi Mumbai to explore if robotic surgery is right for you.</p>
      `
    },
    {
      title: 'Living with Knee Osteoarthritis: 6 Evidence-Based Steps to Avoid Surgery',
      category: 'Arthritis Care',
      author: 'Dr. Prashant Agrawal',
      readTime: '6 min read',
      img: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=1200&auto=format&fit=crop',
      content: `
        <p><strong>By Dr. Prashant Agrawal (MS Orthopaedics)</strong><br />Lead Specialist — ORTHOS Orthopaedic Speciality OPD</p>
        <br />
        <h4>Surgery is Always the Last Resort</h4>
        <p>A common fear among patients diagnosed with knee osteoarthritis is that surgery is immediate and inevitable. In reality, a vast majority of mild-to-moderate arthritis cases can be successfully managed without surgery through disciplined, evidence-based conservative care.</p>
        <br />
        <h4>The 6 Proven Non-Surgical Strategies:</h4>
        <p>1. <strong>Quadriceps &amp; Hamstring Strengthening:</strong> Strong thigh muscles act as natural shock absorbers for your knee joint. Targeted straight-leg raises, isometric quad sets, and low-impact stationary cycling reduce the mechanical load on worn cartilage.</p>
        <p>2. <strong>Body Weight Management:</strong> Every single kilogram of excess weight puts approximately 4 kilograms of mechanical pressure on your knees during walking. Losing even 5–7% of body weight can reduce joint pain by up to 50%.</p>
        <p>3. <strong>Anti-Inflammatory Nutrition:</strong> A diet rich in Omega-3 fatty acids, turmeric, antioxidants, and adequate hydration helps decrease synovial inflammation.</p>
        <p>4. <strong>Viscosupplementation Injections:</strong> Injecting high-molecular-weight hyaluronic acid into the knee joint supplements depleted synovial fluid, providing lubrication and shock absorption for 6 to 12 months.</p>
        <p>5. <strong>Platelet-Rich Plasma (PRP) Therapy:</strong> Utilizing concentrated platelets from your own blood, PRP releases growth factors that reduce painful cytokines and support cartilage homeostasis.</p>
        <p>6. <strong>Custom Unloader Bracing &amp; Ergonomics:</strong> Specialized orthotic braces shift weight away from the damaged medial compartment of the knee to the healthy lateral side, allowing comfortable walking.</p>
        <br />
        <p>At ORTHOS OPD, our goal is to preserve your natural joints for as long as possible. Consult our team for a personalized conservative management plan.</p>
      `
    },
    {
      title: 'Athletic ACL Tears: Diagnosis, Arthroscopy, and the Road Back to Sports',
      category: 'Sports Medicine',
      author: 'Dr. Prashant Agrawal',
      readTime: '7 min read',
      img: 'https://images.unsplash.com/photo-1740512922093-9c2756ab5844?q=80&w=1200&auto=format&fit=crop',
      content: `
        <p><strong>By Dr. Prashant Agrawal (MS Orthopaedics)</strong><br />Specialist in Sports Injuries &amp; Arthroscopy</p>
        <br />
        <h4>The "Pop" That Stops an Athlete</h4>
        <p>Anterior Cruciate Ligament (ACL) tears are among the most frequent and devastating sports injuries, typically occurring during non-contact deceleration, sudden pivoting, or awkward jump landings in football, cricket, or badminton.</p>
        <br />
        <h4>Symptoms of an Acute ACL Tear:</h4>
        <p>• An audible or felt "pop" inside the knee.</p>
        <p>• Rapid joint swelling (hemarthrosis) within 2 to 4 hours.</p>
        <p>• Severe instability and the feeling that the knee is "giving way".</p>
        <br />
        <h4>Modern Keyhole Arthroscopic Reconstruction:</h4>
        <p>Because the ACL has poor blood supply, complete tears rarely heal on their own. In active individuals, leaving an unstable knee untreated leads to early meniscus tears and secondary osteoarthritis.</p>
        <p>Dr. Prashant Agrawal performs <strong>anatomical keyhole ACL reconstruction</strong> using the patient's own hamstring autograft. Under high-definition arthroscopic visualization, tiny bone tunnels are drilled at the exact anatomical footprint of the native ligament, and the graft is securely fixed with titanium cortical buttons and bio-absorbable screws.</p>
        <br />
        <h4>The Safe Return-to-Sport Roadmap:</h4>
        <p>• <strong>Months 0–2:</strong> Full extension restoration, swelling control, quad reactivation.</p>
        <p>• <strong>Months 2–4:</strong> Closed-chain strengthening, proprioception, and stationary cycling.</p>
        <p>• <strong>Months 4–6:</strong> Straight-line jogging, agility drills, and plyometric jump training.</p>
        <p>• <strong>Months 6–9:</strong> Sport-specific drills and objective functional testing before full clearance.</p>
      `
    },
    {
      title: 'Essential Hip Precautions & Safe Movement After Total Hip Arthroplasty',
      category: 'Hip Health',
      author: 'Dr. Prashant Agrawal',
      readTime: '4 min read',
      img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=1200&auto=format&fit=crop',
      content: `
        <p><strong>By Dr. Prashant Agrawal (MS Orthopaedics)</strong><br />Senior Consultant Orthopaedic Surgeon</p>
        <br />
        <h4>Protecting Your New Hip Joint</h4>
        <p>Total Hip Replacement (THR) is one of the most successful surgeries in modern medicine, offering complete relief from excruciating avascular necrosis (AVN) or severe osteoarthritis. However, the first 6 to 12 weeks post-surgery require strict adherence to movement precautions while the surrounding capsule and muscles heal.</p>
        <br />
        <h4>The Three Golden Rules:</h4>
        <p>1. <strong>Do Not Bend Your Hip Past 90 Degrees:</strong> Avoid sitting in low, deep sofas or chairs. Use a raised toilet seat and keep your knees slightly lower than your hips when seated.</p>
        <p>2. <strong>Do Not Cross Your Legs:</strong> Never cross your legs at the knees or ankles, whether sitting, standing, or lying in bed. Always use a pillow between your legs when sleeping on your side.</p>
        <p>3. <strong>Avoid Excessive Inward Rotation:</strong> Keep your toes pointing forward or slightly outward. Do not pivot forcefully on your operated leg when turning.</p>
        <br />
        <h4>Everyday Safe Living Tips:</h4>
        <p>• Use long-handled shoehorns and reachers to avoid bending down to your feet.</p>
        <p>• Ascend stairs "Good Leg First" (up with the good, down with the bad).</p>
        <p>• Maintain gentle daily walking as prescribed by the ORTHOS physiotherapy team.</p>
        <br />
        <p>With proper care and guidance from Dr. Prashant Agrawal, your new hip joint will grant you decades of painless, active living.</p>
      `
    }
  ];

  window.openBlogModal = function (idx) {
    const item = blogArticles[idx];
    if (!item) return;

    document.getElementById('bmTitle').textContent = item.title;
    const body = document.getElementById('bmBody');
    body.innerHTML = `
      <div style="aspect-ratio:16/9;border-radius:12px;overflow:hidden;margin-bottom:20px;">
        <img src="${item.img}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:14px;">
        ${item.author} · ${item.category} · ${item.readTime}
      </div>
      <div>${item.content}</div>
    `;
    showModal('blogModalBackdrop');
  };

  /* ---------- Legal Modals ---------- */
  window.openLegalModal = function (type) {
    if (type === 'terms') {
      showModal('termsModalBackdrop');
    } else if (type === 'privacy') {
      showModal('privacyModalBackdrop');
    }
  };

  /* ---------- Clean Route & Hash Deep Linking ---------- */
  function handleUrlRoute() {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (path.includes('terms') || hash === '#terms') {
      openLegalModal('terms');
    } else if (path.includes('privacy') || hash === '#privacy') {
      openLegalModal('privacy');
    } else if (path.includes('about') || hash === '#about') {
      document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
    } else if (path.includes('services') || path.includes('joint') || hash === '#services') {
      document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' });
    } else if (path.includes('appointment') || path.includes('contact') || hash === '#contact') {
      document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
    } else if (path.includes('faq') || hash === '#faq') {
      document.querySelector('#faq')?.scrollIntoView({ behavior: 'smooth' });
    } else if (path.includes('gallery') || hash === '#gallery') {
      document.querySelector('#gallery')?.scrollIntoView({ behavior: 'smooth' });
    } else if (path.includes('blogs') || hash === '#blogs') {
      document.querySelector('#blogs')?.scrollIntoView({ behavior: 'smooth' });
    } else if (path.includes('videos') || hash === '#videos') {
      document.querySelector('#videos')?.scrollIntoView({ behavior: 'smooth' });
    } else if (path.includes('schedules') || hash === '#schedule') {
      document.querySelector('#schedule')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  window.addEventListener('DOMContentLoaded', handleUrlRoute);
  window.addEventListener('hashchange', handleUrlRoute);
})();
