/* =========================================================
   ORTHOS OPD — Unified Data Store & Single Admin Authentication
   DocOrthos · Dr. Prashant Agrawal
   ========================================================= */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OrthosStore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEYS = {
    AUTH: 'orthos_admin_auth',
    SESSION: 'orthos_admin_session',
    APPOINTMENTS: 'orthos_appointments',
    BLOGS: 'orthos_blogs',
    VIDEOS: 'orthos_videos',
    GALLERY: 'orthos_gallery',
    FAQS: 'orthos_faqs',
    SCHEDULES: 'orthos_schedules',
    SETTINGS: 'orthos_settings',
    LOGS: 'orthos_audit_logs'
  };

  // Default Single Administrator Credentials
  const DEFAULT_ADMIN = {
    username: 'admin',
    // SHA-256 of ('orthos@admin2026' + 'orthos_salt_v1')
    passwordHash: 'f3a13613ce1fad8dbf5a98d1044c1ab57b60ce5dbd325f28b757ae221b2938c3',
    salt: 'orthos_salt_v1',
    displayName: 'Dr. Prashant Agrawal',
    role: 'Senior Consultant & Lead Administrator',
    email: 'orthososc@gmail.com',
    createdAt: '2026-01-01T00:00:00.000Z'
  };

  // Simple, reliable SHA-256 helper with Node and Web Crypto support
  async function sha256(str) {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
      try {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback below
      }
    }
    if (typeof require !== 'undefined') {
      try {
        const c = require('crypto');
        return c.createHash('sha256').update(str).digest('hex');
      } catch (e) {
        // Fallback below
      }
    }
    // Fast lightweight fallback hash
    let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  }

  // Pre-loaded realistic patient appointments
  const INITIAL_APPOINTMENTS = [
    {
      id: 'apt-101',
      name: 'Rajesh K. Verma',
      phone: '+91 98201 44512',
      location: 'ORTHOS OPD — Seawoods West',
      service: 'Robotic Knee / Hip Replacement',
      date: '2026-10-02',
      slot: 'Morning Slot (9:00 AM – 1:00 PM)',
      message: 'Severe bilateral osteoarthritis grade 4. Walking with knee support for 2 years. Seeking opinion for robotic knee surgery.',
      status: 'pending',
      createdAt: '2026-09-28T09:30:00.000Z',
      notes: 'Priority consultation requested. Referred by Dr. Mehta.'
    },
    {
      id: 'apt-102',
      name: 'Ananya Deshmukh',
      phone: '+91 98334 11209',
      location: 'Apollo Hospitals — CBD Belapur',
      service: 'Sports Injury / Arthroscopy',
      date: '2026-09-29',
      slot: 'Hospital Slot (2:00 PM – 5:00 PM)',
      message: 'Sudden pop in right knee during badminton match. Joint swollen and unstable.',
      status: 'confirmed',
      createdAt: '2026-09-27T16:15:00.000Z',
      notes: 'Advised pre-consultation MRI Knee report review.'
    },
    {
      id: 'apt-103',
      name: 'Sunil Ramesh Patil',
      phone: '+91 97692 88401',
      location: 'ORTHOS OPD — Seawoods West',
      service: 'Complex Trauma / Fracture',
      date: '2026-09-26',
      slot: 'Evening Slot (5:00 PM – 8:00 PM)',
      message: 'Distal radius fracture follow-up. Cast removal and physiotherapy evaluation needed.',
      status: 'completed',
      createdAt: '2026-09-25T11:00:00.000Z',
      notes: 'Cast removed, excellent bone union. Started active wrist physiotherapy.'
    },
    {
      id: 'apt-104',
      name: 'Meenakshi Iyer',
      phone: '+91 91672 33418',
      location: 'ORTHOS OPD — Seawoods West',
      service: 'Spine / Back / Sciatica',
      date: '2026-09-30',
      slot: 'Morning Slot (9:00 AM – 1:00 PM)',
      message: 'L4-L5 disc protrusion diagnosed on MRI. Shooting leg pain on left side.',
      status: 'pending',
      createdAt: '2026-09-28T14:40:00.000Z',
      notes: ''
    }
  ];

  // Pre-loaded Blogs
  const INITIAL_BLOGS = [
    {
      id: 'blog-1',
      title: 'Robotic Knee Replacement vs Traditional Surgery: The Precision Difference',
      category: 'Robotics',
      author: 'Dr. Prashant Agrawal',
      readTime: '5 min read',
      publishedAt: '2026-08-15',
      img: 'https://images.unsplash.com/photo-1758206523735-079e56f2faf7?q=80&w=1200&auto=format&fit=crop',
      excerpt: 'How robotic-assisted technology uses pre-operative 3D CT modeling to eliminate human error, preserve natural ligaments, and achieve sub-millimeter balance.',
      content: `<h4>Understanding the Robotic Leap</h4>
<p>For decades, conventional knee replacement surgery relied on mechanical cutting blocks and manual visual alignment. While thousands benefited, individual variations in anatomy, ligament tightness, and bony deformities created challenges in achieving identical balance in every patient.</p>
<p>Today, <strong>robotic-assisted knee replacement</strong> eliminates this variability. A 3D CT scan of the patient's knee is captured prior to surgery. This virtual computer model allows us to plan the exact size, orientation, and angle of the prosthesis with sub-millimeter precision before stepping into the operating theatre.</p>
<h4>Key Advantages of Robotic Surgery:</h4>
<p>• <strong>Sub-Millimeter Haptic Accuracy:</strong> The robotic arm restricts bone cuts to the exact pre-planned boundary. If the surgeon strays by even 0.5 mm, the robotic system automatically pauses the blade, ensuring total safety for adjacent blood vessels and nerves.</p>
<p>• <strong>True Soft-Tissue Balance:</strong> The system calculates ligament tension through the complete arc of flexion and extension, resulting in a joint that feels natural and stable.</p>
<p>• <strong>Less Trauma & Faster Recovery:</strong> Because soft tissues are not aggressively stretched, post-operative swelling and pain are drastically reduced. Most patients at our center walk on the evening of surgery and return home within 48 to 72 hours.</p>`
    },
    {
      id: 'blog-2',
      title: 'Living with Knee Osteoarthritis: 6 Evidence-Based Steps to Avoid Surgery',
      category: 'Arthritis Care',
      author: 'Dr. Prashant Agrawal',
      readTime: '6 min read',
      publishedAt: '2026-08-28',
      img: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=1200&auto=format&fit=crop',
      excerpt: 'Comprehensive overview of non-surgical pain management including viscosupplementation, PRP injections, lifestyle changes, and targeted exercise.',
      content: `<h4>Surgery is Always the Last Resort</h4>
<p>A common fear among patients diagnosed with knee osteoarthritis is that surgery is immediate and inevitable. In reality, a vast majority of mild-to-moderate arthritis cases can be successfully managed without surgery through disciplined, evidence-based conservative care.</p>
<h4>The 6 Proven Non-Surgical Strategies:</h4>
<p>1. <strong>Quadriceps & Hamstring Strengthening:</strong> Strong thigh muscles act as natural shock absorbers for your knee joint.</p>
<p>2. <strong>Body Weight Management:</strong> Every single kilogram of excess weight puts approximately 4 kilograms of mechanical pressure on your knees.</p>
<p>3. <strong>Anti-Inflammatory Nutrition:</strong> A diet rich in Omega-3 fatty acids, turmeric, antioxidants, and adequate hydration helps decrease synovial inflammation.</p>
<p>4. <strong>Viscosupplementation Injections:</strong> Injecting high-molecular-weight hyaluronic acid provides joint lubrication for 6 to 12 months.</p>
<p>5. <strong>Platelet-Rich Plasma (PRP) Therapy:</strong> Harnessing your body's natural growth factors to support cartilage health.</p>
<p>6. <strong>Custom Unloader Bracing:</strong> Specialized orthotic braces shift weight away from damaged compartments.</p>`
    },
    {
      id: 'blog-3',
      title: 'Athletic ACL Tears: Diagnosis, Arthroscopy, and the Road Back to Sports',
      category: 'Sports Medicine',
      author: 'Dr. Prashant Agrawal',
      readTime: '7 min read',
      publishedAt: '2026-09-10',
      img: 'https://images.unsplash.com/photo-1740512922093-9c2756ab5844?q=80&w=1200&auto=format&fit=crop',
      excerpt: 'Anterior Cruciate Ligament injury mechanisms, arthroscopic keyhole reconstruction, and step-by-step phased return-to-sport physical therapy roadmap.',
      content: `<h4>The "Pop" That Stops an Athlete</h4>
<p>Anterior Cruciate Ligament (ACL) tears are among the most frequent and devastating sports injuries, typically occurring during non-contact deceleration, sudden pivoting, or awkward jump landings in football, cricket, or badminton.</p>
<h4>Modern Keyhole Arthroscopic Reconstruction:</h4>
<p>Dr. Prashant Agrawal performs <strong>anatomical keyhole ACL reconstruction</strong> using the patient's own hamstring autograft. Under high-definition arthroscopic visualization, tiny bone tunnels are drilled at the exact anatomical footprint, minimizing surgical morbidity.</p>
<h4>Safe Return-to-Sport Roadmap:</h4>
<p>• <strong>Months 0–2:</strong> Full extension restoration, swelling control, quad reactivation.</p>
<p>• <strong>Months 2–4:</strong> Closed-chain strengthening, proprioception, and stationary cycling.</p>
<p>• <strong>Months 4–6:</strong> Straight-line jogging, agility drills, and plyometric jump training.</p>
<p>• <strong>Months 6–9:</strong> Sport-specific drills and objective functional testing before full clearance.</p>`
    },
    {
      id: 'blog-4',
      title: 'Essential Hip Precautions & Safe Movement After Total Hip Arthroplasty',
      category: 'Hip Health',
      author: 'Dr. Prashant Agrawal',
      readTime: '4 min read',
      publishedAt: '2026-09-18',
      img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=1200&auto=format&fit=crop',
      excerpt: 'Post-operative safety protocols, safe sleeping postures, sitting angles, and daily living guidelines following modern hip replacement surgery.',
      content: `<h4>Protecting Your New Hip Joint</h4>
<p>Total Hip Replacement (THR) is one of the most successful surgeries in modern medicine. However, the first 6 to 12 weeks post-surgery require strict adherence to movement precautions while the surrounding capsule and muscles heal.</p>
<h4>The Three Golden Rules:</h4>
<p>1. <strong>Do Not Bend Your Hip Past 90 Degrees:</strong> Avoid sitting in low, deep sofas. Use a raised toilet seat.</p>
<p>2. <strong>Do Not Cross Your Legs:</strong> Never cross your legs at knees or ankles. Sleep with a pillow between knees.</p>
<p>3. <strong>Avoid Excessive Inward Rotation:</strong> Keep your toes pointing forward or slightly outward.</p>`
    }
  ];

  // Pre-loaded Educational Videos
  const INITIAL_VIDEOS = [
    {
      id: 'vid-1',
      title: 'Examination of Knee Joint by Dr Prashant Agrawal',
      category: 'knee',
      categoryLabel: 'Knee Exam',
      duration: '12:45',
      doctor: 'Dr. Prashant Agrawal',
      description: 'Clinical knee evaluation techniques, ligament testing (Lachman, anterior drawer), and diagnostic palpation for joint pain patients.',
      thumb: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop',
      youtubeUrl: 'https://www.youtube.com/results?search_query=Dr+Prashant+Agrawal+Examination+of+Knee+Joint'
    },
    {
      id: 'vid-2',
      title: 'Dr Prashant Agrawal speaking on Management of Knee Pain and Arthritis',
      category: 'knee',
      categoryLabel: 'Arthritis Care',
      duration: '18:20',
      doctor: 'Dr. Prashant Agrawal',
      description: 'Comprehensive lecture on conservative medical management, lifestyle changes, and surgical options for knee osteoarthritis.',
      thumb: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=800&auto=format&fit=crop',
      youtubeUrl: 'https://www.youtube.com/results?search_query=Dr+Prashant+Agrawal+Management+of+Knee+Pain+Arthritis'
    },
    {
      id: 'vid-3',
      title: 'Orthopaedic Implants by Dr Prashant Agrawal',
      category: 'robotic',
      categoryLabel: 'Implants',
      duration: '14:15',
      doctor: 'Dr. Prashant Agrawal',
      description: 'Understanding modern implant metallurgy, biocompatibility, ceramic vs cobalt chromium, and high-flex knee designs.',
      thumb: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=800&auto=format&fit=crop',
      youtubeUrl: 'https://www.youtube.com/results?search_query=Dr+Prashant+Agrawal+Orthopaedic+Implants'
    },
    {
      id: 'vid-4',
      title: 'Robotic Knee Replacement Surgery Technology & Haptics',
      category: 'robotic',
      categoryLabel: 'Robotic Surgery',
      duration: '16:40',
      doctor: 'Dr. Prashant Agrawal',
      description: 'How sub-millimeter robotic haptics ensure exact component alignment, zero ligament cuts, and rapid hospital discharge.',
      thumb: 'https://images.unsplash.com/photo-1758206523735-079e56f2faf7?q=80&w=800&auto=format&fit=crop',
      youtubeUrl: 'https://www.youtube.com/results?search_query=Dr+Prashant+Agrawal+Robotic+Knee+Replacement'
    },
    {
      id: 'vid-5',
      title: 'Complex Trauma Case Management & Pelvic Reconstruction',
      category: 'trauma',
      categoryLabel: 'Complex Trauma',
      duration: '15:10',
      doctor: 'Dr. Prashant Agrawal',
      description: 'Emergency resuscitation and staged damage-control fixation protocols in multi-fragment pelvic fractures.',
      thumb: 'https://images.unsplash.com/photo-1748407408885-9b62df0e2527?q=80&w=800&auto=format&fit=crop',
      youtubeUrl: 'https://www.youtube.com/results?search_query=Dr+Prashant+Agrawal+Trauma+Pelvic'
    },
    {
      id: 'vid-6',
      title: 'Patient Recovery: Walking 4 Hours After Robotic Knee Replacement',
      category: 'recovery',
      categoryLabel: 'Patient Story',
      duration: '06:30',
      doctor: 'Dr. Prashant Agrawal',
      description: 'Live patient testimonial and early weight-bearing rehabilitation footage on day of surgery.',
      thumb: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop',
      youtubeUrl: 'https://www.youtube.com/results?search_query=Dr+Prashant+Agrawal+Patient+Testimonial+Robotic'
    }
  ];

  // Pre-loaded Gallery items
  const INITIAL_GALLERY = [
    {
      id: 'gal-1',
      title: 'Private Consultation Suite',
      category: 'facility',
      categoryLabel: 'Facility',
      caption: 'Spacious Consultation Suite at ORTHOS OPD Seawoods',
      img: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 'gal-2',
      title: 'Robotic Surgical Platform',
      category: 'surgery',
      categoryLabel: 'Robotic Surgery',
      caption: 'Sub-millimeter Robotic Joint Replacement in Modular Operation Theatre',
      img: 'https://images.unsplash.com/photo-1758206523735-079e56f2faf7?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 'gal-3',
      title: 'Digital Radiography Unit',
      category: 'facility',
      categoryLabel: 'Facility',
      caption: 'On-Site Digital X-Ray & Immediate Diagnostics',
      img: 'https://images.unsplash.com/photo-1616012480717-fd9867059ca0?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 'gal-4',
      title: 'Patient Mobility Milestones',
      category: 'patients',
      categoryLabel: 'Patient Recovery',
      caption: 'Doctor Consulting Recovering Knee Replacement Patient',
      img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop'
    }
  ];

  // Pre-loaded FAQs
  const INITIAL_FAQS = [
    {
      id: 'faq-1',
      question: 'What is ORTHOS?',
      category: 'General',
      answer: '<strong>ORTHOS</strong> is an advanced Orthopaedic Speciality OPD founded and led by Dr. Prashant Agrawal. It is a comprehensive musculoskeletal center providing diagnostic imaging, conservative joint preservation, sports medicine, complex trauma management, and robotic-assisted joint replacement. Operating with a strict <em>Patient-First philosophy</em>, every patient receives unhurried, VIP care.'
    },
    {
      id: 'faq-2',
      question: 'Who is the lead specialist at ORTHOS?',
      category: 'Doctor',
      answer: 'The lead specialist at ORTHOS is <strong>Dr. Prashant Agrawal</strong> (MS Orthopaedics), Senior Consultant Orthopaedic & Joint Replacement Surgeon with over <strong>33 years of orthopaedic experience</strong>. He is also a Senior Consultant at Apollo Hospitals Navi Mumbai, specializing in Complex Trauma, Pelvic Fractures, and Robotic Joint Replacement.'
    },
    {
      id: 'faq-3',
      question: 'What treatments are available at ORTHOS?',
      category: 'Treatments',
      answer: 'ORTHOS provides a full spectrum of surgical and non-surgical orthopaedic care, including: Robotic Joint Replacement (Knee & Hip), Complex Trauma Care & Fractures, Sports Medicine & Arthroscopy, Peri-Prosthetic Revisions, Conservative PRP Injections & Viscosupplementation, and Non-Surgical Spine/Sciatica Relief.'
    },
    {
      id: 'faq-4',
      question: 'Where and when is Dr. Prashant Agrawal available for consultations?',
      category: 'Appointments',
      answer: 'Dr. Prashant Agrawal consults daily at two primary locations: 1) <strong>ORTHOS @ KRSNAA DIAGNOSTICS LTD (Seawoods West)</strong>: <strong>3:30 PM to 6:00 PM Every Day</strong>. 2) <strong>Apollo Hospitals Navi Mumbai (CBD Belapur)</strong>: <strong>10:00 AM to 3:00 PM Every Day</strong>. Round-the-clock emergency fracture and polytrauma services are available 24/7 at Apollo Hospitals Navi Mumbai.'
    },
    {
      id: 'faq-5',
      question: 'What is robotic-assisted knee replacement?',
      category: 'Robotics',
      answer: 'Robotic-assisted joint replacement uses a CT-based 3D computer model of the patient\'s knee to personalize implant alignment before surgery. During the operation, the robotic arm provides real-time haptic feedback, preventing inadvertent ligament damage and ensuring sub-millimeter precision cuts.'
    }
  ];

  // Pre-loaded Clinic Schedules
  const INITIAL_SCHEDULES = {
    seawoods: {
      name: 'ORTHOS @ KRSNAA DIAGNOSTICS LTD',
      badge: 'Primary OPD Clinic',
      address: 'Shop No 3-6, Om Nilkanth Apartment, CHS Sector 42-A, Seawoods (W), Navi Mumbai 400706, MS India',
      timing: '3:30 PM TO 6:00 PM EVERY DAY',
      morning: '3:30 PM – 6:00 PM',
      evening: 'EVERY DAY',
      sunday: 'Open Daily (3:30 PM – 6:00 PM)',
      phone: '+91 91374 00914',
      status: 'Open',
      directionsUrl: 'https://www.google.com/maps/dir/19.0188906,73.0287094/Shop+No+3-6,+Krsnaa,+Om+Neelkanth,+Krsnaa+Diagnostics+Ltd,+Health+Express,+Plot+no.+31,+Seawoods+West,+Sector+42A,+Seawoods,+Navi+Mumbai,+Maharashtra+400706/@19.0314525,73.0305082,12z/data=!4m9!4m8!1m1!4e1!1m5!1m1!1s0x3be7c35525557755:0x59bbb314c55b3759!2m2!1d73.0163313!2d19.0161994'
    },
    apollo: {
      name: 'Apollo Hospitals Navi Mumbai',
      badge: 'Hospital OPD & Robotics',
      address: 'Parsik Hill Road, CBD Belapur, Navi Mumbai 400614, MS India',
      timing: '10:00 AM TO 3:00 PM EVERY DAY',
      afternoon: '10:00 AM – 3:00 PM',
      surgeries: 'EVERY DAY',
      inpatient: 'Scheduled Robotic Electives',
      phone: '+91 91374 00914',
      status: 'Open',
      apolloUrl: 'https://www.apollo247.com/doctors/dr-prashant-agrawal-72775fd2-2e75-4ca1-a549-9347f71449a3'
    },
    google: {
      name: 'Dr Prashant Agrawal',
      title: 'ORTHOPEDIC ROBOTIC Joint Replacement Surgeon',
      rating: '5.0',
      reviewUrl: 'https://local.google.com/place?placeid=ChIJcU1eC7DD5zsRjauF0PkCYJw&utm_medium=noren&utm_source=gbp&utm_campaign=2026'
    },
    emergency: {
      available: true,
      note: '24/7 Polytrauma & Emergency Fracture Support at Apollo Hospitals Navi Mumbai'
    }
  };

  // Pre-loaded Settings & Announcement
  const INITIAL_SETTINGS = {
    clinicName: 'ORTHOS Orthopaedic Speciality OPD',
    doctorName: 'Dr. Prashant Agrawal',
    degrees: 'MS Orthopaedics, FASM',
    primaryPhone: '+91 91374 00914',
    whatsappNumber: '919137400914',
    emergencyPhone: '+91 91374 00914',
    email: 'orthososc@gmail.com',
    announcement: {
      enabled: false,
      text: 'Notice: Special Robotic Joint Assessment Camp this Saturday. Prior booking required.',
      type: 'info' // 'info' | 'warning' | 'success'
    }
  };

  // Helper storage functions
  function getRaw(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      console.warn('Storage read error for key:', key, e);
      return fallback;
    }
  }

  function setRaw(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Dispatch custom event for real-time reactivity
      window.dispatchEvent(new CustomEvent('orthos-store-updated', { detail: { key, value } }));
      return true;
    } catch (e) {
      console.error('Storage write error for key:', key, e);
      return false;
    }
  }

  // Audit Logging
  function logAction(action, details) {
    const logs = getRaw(STORAGE_KEYS.LOGS, []);
    const entry = {
      id: 'log-' + Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      user: 'admin'
    };
    logs.unshift(entry);
    if (logs.length > 100) logs.pop(); // keep last 100
    setRaw(STORAGE_KEYS.LOGS, logs);
  }

  // Initialization check
  function initStore() {
    if (!localStorage.getItem(STORAGE_KEYS.AUTH)) {
      setRaw(STORAGE_KEYS.AUTH, DEFAULT_ADMIN);
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      setRaw(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BLOGS)) {
      setRaw(STORAGE_KEYS.BLOGS, INITIAL_BLOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VIDEOS)) {
      setRaw(STORAGE_KEYS.VIDEOS, INITIAL_VIDEOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GALLERY)) {
      setRaw(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAQS)) {
      setRaw(STORAGE_KEYS.FAQS, INITIAL_FAQS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHEDULES)) {
      setRaw(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setRaw(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
  }

  // Run initial setup immediately
  initStore();

  // Public API
  return {
    // ---------------- AUTHENTICATION (SINGLE USER) ----------------
    async login(username, password, remember = true) {
      const auth = getRaw(STORAGE_KEYS.AUTH, DEFAULT_ADMIN);
      const cleanUser = (username || '').trim().toLowerCase();
      const inputHash = await sha256(password + auth.salt);

      if (cleanUser === auth.username.toLowerCase() && inputHash === auth.passwordHash) {
        const session = {
          token: 'orthos_sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
          username: auth.username,
          displayName: auth.displayName,
          role: auth.role,
          email: auth.email,
          createdAt: new Date().toISOString(),
          remember: Boolean(remember),
          expiresAt: remember ? Date.now() + 30 * 86400000 : Date.now() + 43200000 // 30 days vs 12 hours
        };
        setRaw(STORAGE_KEYS.SESSION, session);
        logAction('LOGIN_SUCCESS', 'Administrator logged into portal');
        return { success: true, session };
      } else {
        logAction('LOGIN_FAILED', 'Failed login attempt with username: ' + cleanUser);
        return { success: false, message: 'Invalid username or password' };
      }
    },

    logout() {
      logAction('LOGOUT', 'Administrator signed out');
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEYS.SESSION);
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      if (typeof window !== 'undefined' && window.dispatchEvent && typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('orthos-auth-changed', { detail: { authenticated: false } }));
      }
      return true;
    },

    isAuthenticated() {
      const session = getRaw(STORAGE_KEYS.SESSION, null);
      if (!session || !session.token) return false;
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        return false;
      }
      return true;
    },

    getCurrentUser() {
      if (!this.isAuthenticated()) return null;
      const session = getRaw(STORAGE_KEYS.SESSION, null);
      const auth = getRaw(STORAGE_KEYS.AUTH, DEFAULT_ADMIN);
      return {
        username: auth.username,
        displayName: auth.displayName,
        role: auth.role,
        email: auth.email,
        sessionCreatedAt: session.createdAt
      };
    },

    async changePassword(oldPassword, newPassword) {
      if (!this.isAuthenticated()) return { success: false, message: 'Unauthorized' };
      const auth = getRaw(STORAGE_KEYS.AUTH, DEFAULT_ADMIN);
      const oldHash = await sha256(oldPassword + auth.salt);

      if (oldHash !== auth.passwordHash) {
        return { success: false, message: 'Current password is incorrect' };
      }
      if (!newPassword || newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long' };
      }

      const newSalt = 'orthos_salt_' + Math.random().toString(36).substring(2);
      const newHash = await sha256(newPassword + newSalt);
      auth.passwordHash = newHash;
      auth.salt = newSalt;
      auth.updatedAt = new Date().toISOString();
      setRaw(STORAGE_KEYS.AUTH, auth);
      logAction('PASSWORD_CHANGED', 'Administrator updated master password');
      return { success: true, message: 'Password successfully changed!' };
    },

    updateAdminProfile(updates) {
      if (!this.isAuthenticated()) return { success: false, message: 'Unauthorized' };
      const auth = getRaw(STORAGE_KEYS.AUTH, DEFAULT_ADMIN);
      if (updates.username) auth.username = updates.username.trim();
      if (updates.displayName) auth.displayName = updates.displayName.trim();
      if (updates.email) auth.email = updates.email.trim();
      setRaw(STORAGE_KEYS.AUTH, auth);
      logAction('PROFILE_UPDATED', 'Admin profile info updated');
      return { success: true, auth };
    },

    // ---------------- APPOINTMENTS ----------------
    getAppointments() {
      return getRaw(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    },

    saveAppointment(data) {
      const list = this.getAppointments();
      const newAppt = {
        id: data.id || 'apt-' + Date.now(),
        name: (data.name || '').trim(),
        phone: (data.phone || '').trim(),
        location: data.location || 'ORTHOS OPD — Seawoods West',
        service: data.service || 'General Orthopaedic Consultation',
        date: data.date || new Date().toISOString().split('T')[0],
        slot: data.slot || 'Morning Slot (9:00 AM – 1:00 PM)',
        message: (data.message || '').trim(),
        status: data.status || 'pending', // 'pending' | 'confirmed' | 'completed' | 'cancelled'
        createdAt: data.createdAt || new Date().toISOString(),
        notes: data.notes || ''
      };

      const existingIndex = list.findIndex(a => a.id === newAppt.id);
      if (existingIndex >= 0) {
        list[existingIndex] = { ...list[existingIndex], ...newAppt };
        logAction('APPT_UPDATED', `Updated appointment ${newAppt.id} for ${newAppt.name}`);
      } else {
        list.unshift(newAppt);
        logAction('APPT_CREATED', `New appointment booked for ${newAppt.name} (${newAppt.service})`);
      }
      setRaw(STORAGE_KEYS.APPOINTMENTS, list);
      return newAppt;
    },

    updateAppointmentStatus(id, newStatus, internalNotes) {
      const list = this.getAppointments();
      const appt = list.find(a => a.id === id);
      if (appt) {
        appt.status = newStatus;
        if (internalNotes !== undefined) appt.notes = internalNotes;
        appt.updatedAt = new Date().toISOString();
        setRaw(STORAGE_KEYS.APPOINTMENTS, list);
        logAction('APPT_STATUS_CHANGE', `Appointment ${id} (${appt.name}) changed to ${newStatus}`);
        return { success: true, appt };
      }
      return { success: false, message: 'Appointment not found' };
    },

    deleteAppointment(id) {
      let list = this.getAppointments();
      const target = list.find(a => a.id === id);
      list = list.filter(a => a.id !== id);
      setRaw(STORAGE_KEYS.APPOINTMENTS, list);
      logAction('APPT_DELETED', `Deleted appointment ${id} (${target?.name || ''})`);
      return { success: true };
    },

    // ---------------- BLOGS ----------------
    getBlogs() {
      return getRaw(STORAGE_KEYS.BLOGS, INITIAL_BLOGS);
    },

    saveBlog(blogData) {
      const blogs = this.getBlogs();
      const newBlog = {
        id: blogData.id || 'blog-' + Date.now(),
        title: (blogData.title || '').trim(),
        category: (blogData.category || 'Clinical Care').trim(),
        author: blogData.author || 'Dr. Prashant Agrawal',
        readTime: blogData.readTime || '5 min read',
        publishedAt: blogData.publishedAt || new Date().toISOString().split('T')[0],
        img: blogData.img || 'https://images.unsplash.com/photo-1758206523735-079e56f2faf7?q=80&w=1200&auto=format&fit=crop',
        excerpt: (blogData.excerpt || '').trim(),
        content: blogData.content || ''
      };

      const idx = blogs.findIndex(b => b.id === newBlog.id);
      if (idx >= 0) {
        blogs[idx] = newBlog;
        logAction('BLOG_UPDATED', `Updated article: ${newBlog.title}`);
      } else {
        blogs.unshift(newBlog);
        logAction('BLOG_CREATED', `Published new article: ${newBlog.title}`);
      }
      setRaw(STORAGE_KEYS.BLOGS, blogs);
      return newBlog;
    },

    deleteBlog(id) {
      let blogs = this.getBlogs();
      const target = blogs.find(b => b.id === id);
      blogs = blogs.filter(b => b.id !== id);
      setRaw(STORAGE_KEYS.BLOGS, blogs);
      logAction('BLOG_DELETED', `Deleted article: ${target?.title || id}`);
      return { success: true };
    },

    // ---------------- VIDEOS ----------------
    getVideos() {
      return getRaw(STORAGE_KEYS.VIDEOS, INITIAL_VIDEOS);
    },

    saveVideo(vidData) {
      const videos = this.getVideos();
      const newVid = {
        id: vidData.id || 'vid-' + Date.now(),
        title: (vidData.title || '').trim(),
        category: vidData.category || 'knee',
        categoryLabel: vidData.categoryLabel || 'Educational',
        duration: vidData.duration || '10:00',
        doctor: vidData.doctor || 'Dr. Prashant Agrawal',
        description: (vidData.description || '').trim(),
        thumb: vidData.thumb || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop',
        youtubeUrl: vidData.youtubeUrl || 'https://www.youtube.com/'
      };

      const idx = videos.findIndex(v => v.id === newVid.id);
      if (idx >= 0) {
        videos[idx] = newVid;
        logAction('VIDEO_UPDATED', `Updated video: ${newVid.title}`);
      } else {
        videos.unshift(newVid);
        logAction('VIDEO_CREATED', `Added new video: ${newVid.title}`);
      }
      setRaw(STORAGE_KEYS.VIDEOS, videos);
      return newVid;
    },

    deleteVideo(id) {
      let videos = this.getVideos();
      const target = videos.find(v => v.id === id);
      videos = videos.filter(v => v.id !== id);
      setRaw(STORAGE_KEYS.VIDEOS, videos);
      logAction('VIDEO_DELETED', `Deleted video: ${target?.title || id}`);
      return { success: true };
    },

    // ---------------- GALLERY ----------------
    getGallery() {
      return getRaw(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
    },

    saveGalleryItem(itemData) {
      const gallery = this.getGallery();
      const newItem = {
        id: itemData.id || 'gal-' + Date.now(),
        title: (itemData.title || '').trim(),
        category: itemData.category || 'facility',
        categoryLabel: itemData.categoryLabel || 'Clinical Showcase',
        caption: (itemData.caption || itemData.title || '').trim(),
        img: itemData.img || ''
      };

      const idx = gallery.findIndex(g => g.id === newItem.id);
      if (idx >= 0) {
        gallery[idx] = newItem;
        logAction('GALLERY_UPDATED', `Updated gallery item: ${newItem.title}`);
      } else {
        gallery.unshift(newItem);
        logAction('GALLERY_CREATED', `Added gallery photo: ${newItem.title}`);
      }
      setRaw(STORAGE_KEYS.GALLERY, gallery);
      return newItem;
    },

    deleteGalleryItem(id) {
      let gallery = this.getGallery();
      const target = gallery.find(g => g.id === id);
      gallery = gallery.filter(g => g.id !== id);
      setRaw(STORAGE_KEYS.GALLERY, gallery);
      logAction('GALLERY_DELETED', `Deleted gallery item: ${target?.title || id}`);
      return { success: true };
    },

    // ---------------- FAQS ----------------
    getFaqs() {
      return getRaw(STORAGE_KEYS.FAQS, INITIAL_FAQS);
    },

    saveFaq(faqData) {
      const faqs = this.getFaqs();
      const newFaq = {
        id: faqData.id || 'faq-' + Date.now(),
        question: (faqData.question || '').trim(),
        category: (faqData.category || 'General').trim(),
        answer: (faqData.answer || '').trim()
      };

      const idx = faqs.findIndex(f => f.id === newFaq.id);
      if (idx >= 0) {
        faqs[idx] = newFaq;
        logAction('FAQ_UPDATED', `Updated FAQ: ${newFaq.question}`);
      } else {
        faqs.push(newFaq);
        logAction('FAQ_CREATED', `Added FAQ: ${newFaq.question}`);
      }
      setRaw(STORAGE_KEYS.FAQS, faqs);
      return newFaq;
    },

    deleteFaq(id) {
      let faqs = this.getFaqs();
      const target = faqs.find(f => f.id === id);
      faqs = faqs.filter(f => f.id !== id);
      setRaw(STORAGE_KEYS.FAQS, faqs);
      logAction('FAQ_DELETED', `Deleted FAQ: ${target?.question || id}`);
      return { success: true };
    },

    // ---------------- SCHEDULES & TIMINGS ----------------
    getSchedules() {
      const data = getRaw(STORAGE_KEYS.SCHEDULES, null);
      if (!data || !data.seawoods || !data.seawoods.timing || data.seawoods.timing !== '3:30 PM TO 6:00 PM EVERY DAY') {
        setRaw(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
        return INITIAL_SCHEDULES;
      }
      return data;
    },

    saveSchedules(schedulesData) {
      setRaw(STORAGE_KEYS.SCHEDULES, schedulesData);
      logAction('SCHEDULE_UPDATED', 'Updated clinic consultation schedules');
      return { success: true };
    },

    // ---------------- CLINIC SETTINGS & ANNOUNCEMENT ----------------
    getSettings() {
      return getRaw(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    },

    saveSettings(settingsData) {
      setRaw(STORAGE_KEYS.SETTINGS, settingsData);
      logAction('SETTINGS_UPDATED', 'Updated clinic contact & announcement settings');
      return { success: true };
    },

    // ---------------- LOGS ----------------
    getLogs() {
      return getRaw(STORAGE_KEYS.LOGS, []);
    },

    clearLogs() {
      setRaw(STORAGE_KEYS.LOGS, []);
      return { success: true };
    },

    // ---------------- BACKUP & RESTORE ----------------
    exportAllData() {
      const dump = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        site: 'ORTHOS — Dr. Prashant Agrawal',
        appointments: this.getAppointments(),
        blogs: this.getBlogs(),
        videos: this.getVideos(),
        gallery: this.getGallery(),
        faqs: this.getFaqs(),
        schedules: this.getSchedules(),
        settings: this.getSettings()
      };
      return JSON.stringify(dump, null, 2);
    },

    importAllData(jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        if (data.appointments) setRaw(STORAGE_KEYS.APPOINTMENTS, data.appointments);
        if (data.blogs) setRaw(STORAGE_KEYS.BLOGS, data.blogs);
        if (data.videos) setRaw(STORAGE_KEYS.VIDEOS, data.videos);
        if (data.gallery) setRaw(STORAGE_KEYS.GALLERY, data.gallery);
        if (data.faqs) setRaw(STORAGE_KEYS.FAQS, data.faqs);
        if (data.schedules) setRaw(STORAGE_KEYS.SCHEDULES, data.schedules);
        if (data.settings) setRaw(STORAGE_KEYS.SETTINGS, data.settings);
        logAction('BACKUP_RESTORED', 'Full database restored from JSON backup');
        return { success: true, message: 'All data successfully restored!' };
      } catch (err) {
        return { success: false, message: 'Invalid JSON backup file: ' + err.message };
      }
    },

    resetToDefaults() {
      setRaw(STORAGE_KEYS.AUTH, DEFAULT_ADMIN);
      setRaw(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
      setRaw(STORAGE_KEYS.BLOGS, INITIAL_BLOGS);
      setRaw(STORAGE_KEYS.VIDEOS, INITIAL_VIDEOS);
      setRaw(STORAGE_KEYS.GALLERY, INITIAL_GALLERY);
      setRaw(STORAGE_KEYS.FAQS, INITIAL_FAQS);
      setRaw(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
      setRaw(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
      logAction('FACTORY_RESET', 'Database reset to initial clinic defaults');
      return { success: true, message: 'Reset completed to default state' };
    }
  };
});
