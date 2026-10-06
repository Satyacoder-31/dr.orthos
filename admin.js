/* =========================================================
   ORTHOS OPD — Administrator Portal Logic
   Single User Control Engine · Dr. Prashant Agrawal
   ========================================================= */

(function () {
  'use strict';

  // State
  let currentTab = 'dashboard';
  let apptFilter = 'all';
  let apptSearchQuery = '';
  let failedLoginAttempts = 0;
  let lockoutTimer = null;

  // DOM Elements
  const loginView = document.getElementById('loginView');
  const adminApp = document.getElementById('adminApp');
  const loginForm = document.getElementById('loginForm');
  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const rememberMe = document.getElementById('rememberMe');
  const loginAlert = document.getElementById('loginAlert');
  const quickFillBtn = document.getElementById('quickFillBtn');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Modals & Forms
  const apptModalOverlay = document.getElementById('apptModalOverlay');
  const apptModalForm = document.getElementById('apptModalForm');
  const blogModalOverlay = document.getElementById('blogModalOverlay');
  const blogModalForm = document.getElementById('blogModalForm');
  const videoModalOverlay = document.getElementById('videoModalOverlay');
  const videoModalForm = document.getElementById('videoModalForm');
  const galleryModalOverlay = document.getElementById('galleryModalOverlay');
  const galleryModalForm = document.getElementById('galleryModalForm');
  const faqModalOverlay = document.getElementById('faqModalOverlay');
  const faqModalForm = document.getElementById('faqModalForm');
  const restoreModalOverlay = document.getElementById('restoreModalOverlay');
  const restoreForm = document.getElementById('restoreForm');

  // Toast container
  const toastContainer = document.getElementById('adminToastContainer');

  /* =========================================================
     TOAST NOTIFICATIONS
     ========================================================= */
  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    
    let iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    if (type === 'success') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'danger') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    }

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /* =========================================================
     MODAL CONTROLS
     ========================================================= */
  function openModal(modalEl) {
    if (modalEl) modalEl.classList.add('show');
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.classList.remove('show');
  }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      closeModal(document.getElementById(modalId));
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show').forEach(m => closeModal(m));
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  /* =========================================================
     AUTHENTICATION FLOW (SINGLE USER)
     ========================================================= */
  function checkAuth() {
    if (OrthosStore.isAuthenticated()) {
      loginView.style.display = 'none';
      adminApp.style.display = 'flex';
      initDashboard();
    } else {
      loginView.style.display = 'flex';
      adminApp.style.display = 'none';
    }
  }

  // Password Reveal Toggle
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      loginPassword.setAttribute('type', type);
      togglePasswordBtn.style.color = type === 'text' ? 'var(--navy-900)' : 'var(--slate-400)';
    });
  }

  // Quick 1-Click Credentials Helper
  if (quickFillBtn) {
    quickFillBtn.addEventListener('click', () => {
      loginUsername.value = 'admin';
      loginPassword.value = 'orthos@admin2026';
      showToast('Master credentials autofilled for test login', 'info');
    });
  }

  // Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (failedLoginAttempts >= 5) {
        loginAlert.style.display = 'block';
        loginAlert.textContent = 'Too many failed login attempts. Terminal locked for 60 seconds.';
        return;
      }

      const user = loginUsername.value.trim();
      const pass = loginPassword.value;
      const remember = rememberMe ? rememberMe.checked : true;

      const submitBtn = document.getElementById('loginSubmitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Verifying credentials...</span>';

      try {
        const res = await OrthosStore.login(user, pass, remember);
        if (res.success) {
          failedLoginAttempts = 0;
          loginAlert.style.display = 'none';
          loginForm.reset();
          checkAuth();
          showToast(`Welcome back, ${res.session.displayName}! Full operational access granted.`, 'success');
        } else {
          failedLoginAttempts++;
          loginAlert.style.display = 'block';
          loginAlert.textContent = `${res.message}. (${5 - failedLoginAttempts} attempts remaining)`;
          if (failedLoginAttempts >= 5) {
            loginAlert.textContent = 'Too many failed attempts. Terminal locked for 60 seconds.';
            lockoutTimer = setTimeout(() => {
              failedLoginAttempts = 0;
              loginAlert.style.display = 'none';
            }, 60000);
          }
        }
      } catch (err) {
        loginAlert.style.display = 'block';
        loginAlert.textContent = 'Authentication error: ' + err.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In to Dashboard</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Sign out of the administrator portal?')) {
        OrthosStore.logout();
        checkAuth();
        showToast('You have safely signed out.', 'info');
      }
    });
  }

  /* =========================================================
     TAB NAVIGATION & CLOCK
     ========================================================= */
  function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(`pane-${tabId}`);
    if (activePane) activePane.classList.add('active');

    // Update Topbar Title
    const titles = {
      dashboard: 'Dashboard Overview',
      appointments: 'Appointments & Patient Bookings',
      blogs: 'Clinical Articles & Patient Guides',
      videos: 'Patient Education Videos',
      gallery: 'Inside ORTHOS Image Gallery',
      faqs: 'Frequently Asked Questions (FAQ)',
      schedules: 'OPD Schedules & Public Notice',
      settings: 'Clinic Settings & Single Admin Security'
    };
    const topbarHeading = document.getElementById('topbarHeading');
    if (topbarHeading) topbarHeading.textContent = titles[tabId] || 'Console';

    // Refresh tab content
    if (tabId === 'appointments') renderAppointments();
    if (tabId === 'blogs') renderBlogs();
    if (tabId === 'videos') renderVideos();
    if (tabId === 'gallery') renderGallery();
    if (tabId === 'faqs') renderFaqs();
    if (tabId === 'schedules') loadScheduleSettings();
    if (tabId === 'settings') loadClinicSettings();
    if (tabId === 'dashboard') renderDashboardKPIs();
  }

  document.querySelectorAll('.sidebar-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Live Clock
  function startLiveClock() {
    const el = document.getElementById('liveClock');
    if (!el) return;
    const update = () => {
      const now = new Date();
      el.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }) + ' · ' + now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };
    update();
    setInterval(update, 1000);
  }

  /* =========================================================
     DASHBOARD INITIALIZATION
     ========================================================= */
  function initDashboard() {
    startLiveClock();
    renderDashboardKPIs();
    renderAppointments();
    renderBlogs();
    renderVideos();
    renderGallery();
    renderFaqs();
    loadScheduleSettings();
    loadClinicSettings();

    // Set user profile
    const user = OrthosStore.getCurrentUser();
    if (user) {
      const nameEl = document.getElementById('sidebarDoctorName');
      if (nameEl) nameEl.textContent = user.displayName;
    }
  }

  function renderDashboardKPIs() {
    const appts = OrthosStore.getAppointments();
    const blogs = OrthosStore.getBlogs();
    const videos = OrthosStore.getVideos();
    const gallery = OrthosStore.getGallery();

    const pending = appts.filter(a => a.status === 'pending').length;
    const confirmed = appts.filter(a => a.status === 'confirmed').length;

    document.getElementById('kpiTotalBookings').textContent = appts.length;
    document.getElementById('kpiPendingBookings').textContent = pending;
    document.getElementById('kpiConfirmedBookings').textContent = confirmed;
    document.getElementById('kpiTotalContent').textContent = blogs.length + videos.length + gallery.length;

    // Badges in sidebar
    const pendingBadge = document.getElementById('pendingBadge');
    if (pendingBadge) {
      pendingBadge.textContent = pending;
      pendingBadge.style.display = pending > 0 ? 'inline-block' : 'none';
    }

    const blogCountBadge = document.getElementById('blogCountBadge');
    if (blogCountBadge) blogCountBadge.textContent = blogs.length;

    const videoCountBadge = document.getElementById('videoCountBadge');
    if (videoCountBadge) videoCountBadge.textContent = videos.length;

    // Recent 5 in Dashboard
    const tbody = document.getElementById('dashApptTbody');
    if (!tbody) return;
    const recent = appts.slice(0, 5);

    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--slate-400);">No appointment requests received yet.</td></tr>';
      return;
    }

    tbody.innerHTML = recent.map(a => `
      <tr>
        <td>
          <div class="patient-cell">
            <span class="patient-name">${escapeHtml(a.name)}</span>
            <span class="patient-phone">${escapeHtml(a.phone)}</span>
          </div>
        </td>
        <td><strong>${escapeHtml(a.service)}</strong></td>
        <td><small>${escapeHtml(a.location)}</small></td>
        <td>
          <div>${a.date || 'Flexible'}</div>
          <small style="color:var(--slate-500);">${escapeHtml(a.slot)}</small>
        </td>
        <td><span class="status-pill ${a.status}">${a.status}</span></td>
        <td>
          <div class="action-btns">
            ${a.status === 'pending' ? `
              <button class="topbar-btn" onclick="quickStatusChange('${a.id}', 'confirmed')" title="Confirm Appointment" style="height:30px;padding:0 8px;font-size:11px;color:var(--success);border-color:var(--success);">Confirm</button>
            ` : ''}
            <button class="btn-icon whatsapp" onclick="openWhatsAppChat('${a.phone}', '${escapeHtml(a.name)}', '${escapeHtml(a.service)}', '${a.date}', '${escapeHtml(a.slot)}')" title="Message on WhatsApp">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.08-.13-.28-.2-.57-.35ZM12.05 21.79h-.02a9.84 9.84 0 0 1-5.01-1.37l-.36-.21-3.73.98 1-3.63-.23-.37a9.82 9.82 0 0 1-1.51-5.25c0-5.44 4.43-9.86 9.88-9.86 2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.9 6.98c0 5.44-4.44 9.86-9.9 9.86Zm8.24-18.1A11.8 11.8 0 0 0 12.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.3-1.65a11.9 11.9 0 0 0 5.72 1.46h.01c6.53 0 11.87-5.34 11.87-11.9 0-3.18-1.24-6.17-3.49-8.42Z"/></svg>
            </button>
            <button class="btn-icon" onclick="openEditApptModal('${a.id}')" title="Edit & Notes">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Dashboard shortcut buttons
  document.getElementById('dashBtnNewAppt')?.addEventListener('click', () => openNewApptModal());
  document.getElementById('dashBtnNewBlog')?.addEventListener('click', () => { switchTab('blogs'); openNewBlogModal(); });
  document.getElementById('dashBtnNewVideo')?.addEventListener('click', () => { switchTab('videos'); openNewVideoModal(); });
  document.getElementById('dashBtnAnnouncement')?.addEventListener('click', () => switchTab('schedules'));
  document.getElementById('dashViewAllApptsBtn')?.addEventListener('click', () => switchTab('appointments'));
  document.getElementById('quickNewApptBtn')?.addEventListener('click', () => openNewApptModal());

  /* =========================================================
     APPOINTMENTS ENGINE
     ========================================================= */
  function renderAppointments() {
    const tbody = document.getElementById('apptsFullTbody');
    if (!tbody) return;

    let list = OrthosStore.getAppointments();

    // Filter by tab
    if (apptFilter !== 'all') {
      list = list.filter(a => a.status === apptFilter);
    }

    // Filter by search query
    if (apptSearchQuery) {
      const q = apptSearchQuery.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        a.service.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--slate-400);">No appointments found matching current filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(a => `
      <tr>
        <td>
          <div class="patient-cell">
            <span class="patient-name">${escapeHtml(a.name)}</span>
            <span class="patient-phone">${escapeHtml(a.phone)}</span>
            <small style="color:var(--slate-400);font-size:11px;margin-top:2px;">Requested: ${formatDate(a.createdAt)}</small>
          </div>
        </td>
        <td>
          <strong>${escapeHtml(a.service)}</strong>
          ${a.message ? `<div style="font-size:12px;color:var(--slate-500);margin-top:3px;max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(a.message)}">📝 ${escapeHtml(a.message)}</div>` : ''}
          ${a.notes ? `<div style="font-size:11px;color:var(--teal);margin-top:2px;font-weight:600;">✦ Notes: ${escapeHtml(a.notes)}</div>` : ''}
        </td>
        <td><small>${escapeHtml(a.location)}</small></td>
        <td>
          <strong style="color:var(--navy-900);">${a.date || 'Flexible'}</strong>
          <div style="font-size:12px;color:var(--slate-500);">${escapeHtml(a.slot)}</div>
        </td>
        <td>
          <select class="select-field" style="padding:4px 8px;font-size:12px;font-weight:700;height:32px;width:auto;" onchange="quickStatusChange('${a.id}', this.value)">
            <option value="pending" ${a.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${a.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${a.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon whatsapp" onclick="openWhatsAppChat('${a.phone}', '${escapeHtml(a.name)}', '${escapeHtml(a.service)}', '${a.date}', '${escapeHtml(a.slot)}')" title="Send WhatsApp Message">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.08-.13-.28-.2-.57-.35ZM12.05 21.79h-.02a9.84 9.84 0 0 1-5.01-1.37l-.36-.21-3.73.98 1-3.63-.23-.37a9.82 9.82 0 0 1-1.51-5.25c0-5.44 4.43-9.86 9.88-9.86 2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.9 6.98c0 5.44-4.44 9.86-9.9 9.86Zm8.24-18.1A11.8 11.8 0 0 0 12.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.3-1.65a11.9 11.9 0 0 0 5.72 1.46h.01c6.53 0 11.87-5.34 11.87-11.9 0-3.18-1.24-6.17-3.49-8.42Z"/></svg>
            </button>
            <a href="tel:${escapeHtml(a.phone)}" class="btn-icon call" title="Call Patient">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>
            </a>
          </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="openEditApptModal('${a.id}')" title="Edit Appointment & Notes">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="btn-icon danger" onclick="deleteAppt('${a.id}')" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Filter Buttons
  document.querySelectorAll('[data-appt-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-appt-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      apptFilter = btn.dataset.apptFilter;
      renderAppointments();
    });
  });

  // Search Input
  const apptSearchInput = document.getElementById('apptSearchInput');
  if (apptSearchInput) {
    apptSearchInput.addEventListener('input', (e) => {
      apptSearchQuery = e.target.value.trim();
      renderAppointments();
    });
  }

  // Quick Status Change
  window.quickStatusChange = function (id, newStatus) {
    OrthosStore.updateAppointmentStatus(id, newStatus);
    showToast(`Appointment status changed to ${newStatus.toUpperCase()}`, 'success');
    renderAppointments();
    renderDashboardKPIs();
  };

  // WhatsApp Messaging
  window.openWhatsAppChat = function (phone, name, service, date, slot) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `Hello ${name},\nGreetings from ORTHOS Orthopaedic Speciality OPD (Dr. Prashant Agrawal).\n\nYour consultation request for *${service}* on *${date || 'Upcoming Slot'}* (${slot}) has been confirmed.\n\nClinic Desk: +91 91374 00914\nLocation: KRSNAA Seawoods West / Apollo Hospitals CBD Belapur.`;
    const url = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
  };

  // Add / Edit Appointment Modal
  window.openNewApptModal = function () {
    document.getElementById('apptModalTitle').textContent = 'New Patient Appointment';
    document.getElementById('apptModalId').value = '';
    apptModalForm.reset();
    document.getElementById('apptModalDate').value = new Date().toISOString().split('T')[0];
    openModal(apptModalOverlay);
  };

  window.openEditApptModal = function (id) {
    const appts = OrthosStore.getAppointments();
    const appt = appts.find(a => a.id === id);
    if (!appt) return;

    document.getElementById('apptModalTitle').textContent = `Edit Appointment · ${appt.name}`;
    document.getElementById('apptModalId').value = appt.id;
    document.getElementById('apptModalName').value = appt.name;
    document.getElementById('apptModalPhone').value = appt.phone;
    document.getElementById('apptModalLocation').value = appt.location;
    document.getElementById('apptModalService').value = appt.service;
    document.getElementById('apptModalDate').value = appt.date || '';
    document.getElementById('apptModalSlot').value = appt.slot;
    document.getElementById('apptModalStatus').value = appt.status;
    document.getElementById('apptModalMessage').value = appt.message || '';
    document.getElementById('apptModalNotes').value = appt.notes || '';

    openModal(apptModalOverlay);
  };

  if (apptModalForm) {
    apptModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('apptModalId').value;
      const data = {
        id: id || undefined,
        name: document.getElementById('apptModalName').value,
        phone: document.getElementById('apptModalPhone').value,
        location: document.getElementById('apptModalLocation').value,
        service: document.getElementById('apptModalService').value,
        date: document.getElementById('apptModalDate').value,
        slot: document.getElementById('apptModalSlot').value,
        status: document.getElementById('apptModalStatus').value,
        message: document.getElementById('apptModalMessage').value,
        notes: document.getElementById('apptModalNotes').value
      };

      OrthosStore.saveAppointment(data);
      closeModal(apptModalOverlay);
      renderAppointments();
      renderDashboardKPIs();
      showToast(id ? 'Appointment updated successfully!' : 'New appointment created!', 'success');
    });
  }

  document.getElementById('addApptBtn')?.addEventListener('click', openNewApptModal);

  window.deleteAppt = function (id) {
    if (confirm('Delete this appointment record?')) {
      OrthosStore.deleteAppointment(id);
      renderAppointments();
      renderDashboardKPIs();
      showToast('Appointment record deleted.', 'info');
    }
  };

  // Export to CSV
  document.getElementById('exportApptsCsvBtn')?.addEventListener('click', () => {
    const list = OrthosStore.getAppointments();
    if (!list.length) {
      showToast('No appointment records to export.', 'warning');
      return;
    }

    const headers = ['ID', 'Patient Name', 'Phone', 'Location', 'Service', 'Date', 'Slot', 'Status', 'Symptoms', 'Doctor Notes', 'Created At'];
    const rows = list.map(a => [
      `"${a.id}"`,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${(a.phone || '').replace(/"/g, '""')}"`,
      `"${(a.location || '').replace(/"/g, '""')}"`,
      `"${(a.service || '').replace(/"/g, '""')}"`,
      `"${a.date || ''}"`,
      `"${(a.slot || '').replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${(a.message || '').replace(/"/g, '""')}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
      `"${a.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orthos_appointments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Appointments exported to CSV file.', 'success');
  });

  /* =========================================================
     BLOG ARTICLES ENGINE
     ========================================================= */
  function renderBlogs() {
    const grid = document.getElementById('blogsGridAdmin');
    if (!grid) return;
    const blogs = OrthosStore.getBlogs();

    if (blogs.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--slate-400);">No clinical articles published yet. Click "Write New Article" to add one.</div>';
      return;
    }

    grid.innerHTML = blogs.map(b => `
      <div class="admin-card-item">
        <div class="card-item-media">
          <img src="${b.img}" alt="${escapeHtml(b.title)}" />
          <span class="card-item-tag">${escapeHtml(b.category)}</span>
          <span class="card-item-meta">${escapeHtml(b.readTime)}</span>
        </div>
        <div class="card-item-body">
          <h4>${escapeHtml(b.title)}</h4>
          <p>${escapeHtml(b.excerpt || '')}</p>
          <div class="card-item-footer">
            <span style="font-size:11px;color:var(--slate-400);">${b.publishedAt || ''}</span>
            <div class="action-btns">
              <button class="btn-icon" onclick="openEditBlogModal('${b.id}')" title="Edit Article">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="btn-icon danger" onclick="deleteBlogItem('${b.id}')" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.openNewBlogModal = function () {
    document.getElementById('blogModalTitle').textContent = 'Write New Clinical Article';
    document.getElementById('blogModalId').value = '';
    blogModalForm.reset();
    document.getElementById('blogModalImg').value = 'https://images.unsplash.com/photo-1758206523735-079e56f2faf7?q=80&w=1200&auto=format&fit=crop';
    openModal(blogModalOverlay);
  };

  window.openEditBlogModal = function (id) {
    const blogs = OrthosStore.getBlogs();
    const b = blogs.find(item => item.id === id);
    if (!b) return;

    document.getElementById('blogModalTitle').textContent = 'Edit Article';
    document.getElementById('blogModalId').value = b.id;
    document.getElementById('blogModalTitleInput').value = b.title;
    document.getElementById('blogModalCategory').value = b.category;
    document.getElementById('blogModalReadTime').value = b.readTime;
    document.getElementById('blogModalImg').value = b.img;
    document.getElementById('blogModalExcerpt').value = b.excerpt || '';
    document.getElementById('blogModalContent').value = b.content || '';
    openModal(blogModalOverlay);
  };

  if (blogModalForm) {
    blogModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('blogModalId').value;
      const data = {
        id: id || undefined,
        title: document.getElementById('blogModalTitleInput').value,
        category: document.getElementById('blogModalCategory').value,
        readTime: document.getElementById('blogModalReadTime').value,
        img: document.getElementById('blogModalImg').value,
        excerpt: document.getElementById('blogModalExcerpt').value,
        content: document.getElementById('blogModalContent').value
      };

      OrthosStore.saveBlog(data);
      closeModal(blogModalOverlay);
      renderBlogs();
      renderDashboardKPIs();
      showToast('Article published and updated on live website!', 'success');
    });
  }

  document.getElementById('addNewBlogBtn')?.addEventListener('click', openNewBlogModal);

  window.deleteBlogItem = function (id) {
    if (confirm('Delete this clinical article?')) {
      OrthosStore.deleteBlog(id);
      renderBlogs();
      renderDashboardKPIs();
      showToast('Article removed from public website.', 'info');
    }
  };

  /* =========================================================
     PATIENT VIDEOS ENGINE
     ========================================================= */
  function renderVideos() {
    const grid = document.getElementById('videosGridAdmin');
    if (!grid) return;
    const vids = OrthosStore.getVideos();

    if (vids.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--slate-400);">No videos added yet.</div>';
      return;
    }

    grid.innerHTML = vids.map(v => `
      <div class="admin-card-item">
        <div class="card-item-media">
          <img src="${v.thumb}" alt="${escapeHtml(v.title)}" />
          <span class="card-item-tag">${escapeHtml(v.categoryLabel || v.category)}</span>
          <span class="card-item-meta">${escapeHtml(v.duration || 'Video')}</span>
        </div>
        <div class="card-item-body">
          <h4>${escapeHtml(v.title)}</h4>
          <p>${escapeHtml(v.description || '')}</p>
          <div class="card-item-footer">
            <a href="${v.youtubeUrl}" target="_blank" style="font-size:12px;color:var(--info);font-weight:700;">Open Link ↗</a>
            <div class="action-btns">
              <button class="btn-icon" onclick="openEditVideoModal('${v.id}')" title="Edit Video">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="btn-icon danger" onclick="deleteVideoItem('${v.id}')" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.openNewVideoModal = function () {
    document.getElementById('videoModalHeading').textContent = 'Add Patient Education Video';
    document.getElementById('videoModalId').value = '';
    videoModalForm.reset();
    document.getElementById('vidThumb').value = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop';
    openModal(videoModalOverlay);
  };

  window.openEditVideoModal = function (id) {
    const vids = OrthosStore.getVideos();
    const v = vids.find(item => item.id === id);
    if (!v) return;

    document.getElementById('videoModalHeading').textContent = 'Edit Video';
    document.getElementById('videoModalId').value = v.id;
    document.getElementById('vidTitle').value = v.title;
    document.getElementById('vidCategory').value = v.category;
    document.getElementById('vidDuration').value = v.duration;
    document.getElementById('vidUrl').value = v.youtubeUrl;
    document.getElementById('vidThumb').value = v.thumb;
    document.getElementById('vidDesc').value = v.description;
    openModal(videoModalOverlay);
  };

  if (videoModalForm) {
    videoModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('videoModalId').value;
      const cat = document.getElementById('vidCategory').value;
      const labels = {
        knee: 'Knee Care',
        robotic: 'Robotic Surgery',
        trauma: 'Complex Trauma',
        recovery: 'Patient Story',
        academic: 'Academic Conference'
      };

      const data = {
        id: id || undefined,
        title: document.getElementById('vidTitle').value,
        category: cat,
        categoryLabel: labels[cat] || 'Educational',
        duration: document.getElementById('vidDuration').value,
        youtubeUrl: document.getElementById('vidUrl').value,
        thumb: document.getElementById('vidThumb').value,
        description: document.getElementById('vidDesc').value
      };

      OrthosStore.saveVideo(data);
      closeModal(videoModalOverlay);
      renderVideos();
      renderDashboardKPIs();
      showToast('Video saved and updated on public site!', 'success');
    });
  }

  document.getElementById('addNewVideoBtn')?.addEventListener('click', openNewVideoModal);

  window.deleteVideoItem = function (id) {
    if (confirm('Delete this video from the website?')) {
      OrthosStore.deleteVideo(id);
      renderVideos();
      renderDashboardKPIs();
      showToast('Video deleted.', 'info');
    }
  };

  /* =========================================================
     GALLERY ENGINE
     ========================================================= */
  function renderGallery() {
    const grid = document.getElementById('galleryGridAdmin');
    if (!grid) return;
    const items = OrthosStore.getGallery();

    grid.innerHTML = items.map(g => `
      <div class="admin-card-item">
        <div class="card-item-media">
          <img src="${g.img}" alt="${escapeHtml(g.title)}" />
          <span class="card-item-tag">${escapeHtml(g.categoryLabel || g.category)}</span>
        </div>
        <div class="card-item-body">
          <h4>${escapeHtml(g.title)}</h4>
          <p>${escapeHtml(g.caption || '')}</p>
          <div class="card-item-footer">
            <span style="font-size:11px;color:var(--slate-400);">${g.category}</span>
            <div class="action-btns">
              <button class="btn-icon" onclick="openEditGalleryModal('${g.id}')" title="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="btn-icon danger" onclick="deleteGalleryItem('${g.id}')" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.openNewGalleryModal = function () {
    document.getElementById('galleryModalHeading').textContent = 'Add Gallery Photo';
    document.getElementById('galId').value = '';
    galleryModalForm.reset();
    openModal(galleryModalOverlay);
  };

  window.openEditGalleryModal = function (id) {
    const list = OrthosStore.getGallery();
    const item = list.find(g => g.id === id);
    if (!item) return;

    document.getElementById('galleryModalHeading').textContent = 'Edit Photo';
    document.getElementById('galId').value = item.id;
    document.getElementById('galTitle').value = item.title;
    document.getElementById('galCategory').value = item.category;
    document.getElementById('galCaption').value = item.caption;
    document.getElementById('galImg').value = item.img;
    openModal(galleryModalOverlay);
  };

  if (galleryModalForm) {
    galleryModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('galId').value;
      const cat = document.getElementById('galCategory').value;
      const labels = {
        facility: 'Clinical Facility',
        surgery: 'Robotic Surgery',
        patients: 'Patient Recovery',
        academic: 'Conferences & Events'
      };

      const data = {
        id: id || undefined,
        title: document.getElementById('galTitle').value,
        category: cat,
        categoryLabel: labels[cat] || cat,
        caption: document.getElementById('galCaption').value,
        img: document.getElementById('galImg').value
      };

      OrthosStore.saveGalleryItem(data);
      closeModal(galleryModalOverlay);
      renderGallery();
      renderDashboardKPIs();
      showToast('Gallery image saved!', 'success');
    });
  }

  document.getElementById('addNewGalleryBtn')?.addEventListener('click', openNewGalleryModal);

  window.deleteGalleryItem = function (id) {
    if (confirm('Delete this gallery photo?')) {
      OrthosStore.deleteGalleryItem(id);
      renderGallery();
      renderDashboardKPIs();
      showToast('Photo removed from gallery.', 'info');
    }
  };

  /* =========================================================
     FAQ ENGINE
     ========================================================= */
  function renderFaqs() {
    const listEl = document.getElementById('faqListAdmin');
    if (!listEl) return;
    const faqs = OrthosStore.getFaqs();

    listEl.innerHTML = faqs.map(f => `
      <div class="admin-faq-card">
        <div style="flex:1;">
          <div class="faq-q-title">${escapeHtml(f.question)} <span style="font-size:11px;font-weight:600;color:var(--teal);background:var(--teal-glow);padding:2px 8px;border-radius:12px;margin-left:6px;">${escapeHtml(f.category)}</span></div>
          <div class="faq-q-ans">${f.answer}</div>
        </div>
        <div class="action-btns" style="flex-shrink:0;">
          <button class="btn-icon" onclick="openEditFaqModal('${f.id}')" title="Edit FAQ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
          <button class="btn-icon danger" onclick="deleteFaqItem('${f.id}')" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  window.openNewFaqModal = function () {
    document.getElementById('faqModalHeading').textContent = 'Add FAQ';
    document.getElementById('faqId').value = '';
    faqModalForm.reset();
    openModal(faqModalOverlay);
  };

  window.openEditFaqModal = function (id) {
    const list = OrthosStore.getFaqs();
    const item = list.find(f => f.id === id);
    if (!item) return;

    document.getElementById('faqModalHeading').textContent = 'Edit FAQ';
    document.getElementById('faqId').value = item.id;
    document.getElementById('faqQuestion').value = item.question;
    document.getElementById('faqCategory').value = item.category;
    document.getElementById('faqAnswer').value = item.answer;
    openModal(faqModalOverlay);
  };

  if (faqModalForm) {
    faqModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('faqId').value;
      const data = {
        id: id || undefined,
        question: document.getElementById('faqQuestion').value,
        category: document.getElementById('faqCategory').value,
        answer: document.getElementById('faqAnswer').value
      };

      OrthosStore.saveFaq(data);
      closeModal(faqModalOverlay);
      renderFaqs();
      showToast('FAQ updated on public website!', 'success');
    });
  }

  document.getElementById('addNewFaqBtn')?.addEventListener('click', openNewFaqModal);

  window.deleteFaqItem = function (id) {
    if (confirm('Delete this FAQ?')) {
      OrthosStore.deleteFaq(id);
      renderFaqs();
      showToast('FAQ deleted.', 'info');
    }
  };

  /* =========================================================
     SCHEDULES & ANNOUNCEMENT ENGINE
     ========================================================= */
  function loadScheduleSettings() {
    const sch = OrthosStore.getSchedules();
    if (sch.seawoods) {
      document.getElementById('schSeaMorning').value = sch.seawoods.morning || '';
      document.getElementById('schSeaEvening').value = sch.seawoods.evening || '';
      document.getElementById('schSeaSunday').value = sch.seawoods.sunday || '';
      document.getElementById('schSeaPhone').value = sch.seawoods.phone || '';
    }
    if (sch.apollo) {
      document.getElementById('schApoAfternoon').value = sch.apollo.afternoon || '';
      document.getElementById('schApoSurgeries').value = sch.apollo.surgeries || '';
      document.getElementById('schApoInpatient').value = sch.apollo.inpatient || '';
    }

    const settings = OrthosStore.getSettings();
    if (settings.announcement) {
      document.getElementById('announcementEnabled').checked = Boolean(settings.announcement.enabled);
      document.getElementById('announcementText').value = settings.announcement.text || '';
      document.getElementById('announcementType').value = settings.announcement.type || 'info';
    }
  }

  document.getElementById('schedulesForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const sch = OrthosStore.getSchedules();
    sch.seawoods = {
      ...sch.seawoods,
      morning: document.getElementById('schSeaMorning').value,
      evening: document.getElementById('schSeaEvening').value,
      sunday: document.getElementById('schSeaSunday').value,
      phone: document.getElementById('schSeaPhone').value
    };
    sch.apollo = {
      ...sch.apollo,
      afternoon: document.getElementById('schApoAfternoon').value,
      surgeries: document.getElementById('schApoSurgeries').value,
      inpatient: document.getElementById('schApoInpatient').value
    };

    OrthosStore.saveSchedules(sch);
    showToast('Consultation schedules updated on live site!', 'success');
  });

  document.getElementById('announcementForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = OrthosStore.getSettings();
    settings.announcement = {
      enabled: document.getElementById('announcementEnabled').checked,
      text: document.getElementById('announcementText').value.trim(),
      type: document.getElementById('announcementType').value
    };

    OrthosStore.saveSettings(settings);
    showToast('Public announcement settings updated!', 'success');
  });

  /* =========================================================
     SECURITY & CLINIC SETTINGS
     ========================================================= */
  function loadClinicSettings() {
    const settings = OrthosStore.getSettings();
    const auth = OrthosStore.getCurrentUser();

    if (auth && document.getElementById('adminUsernameInput')) {
      document.getElementById('adminUsernameInput').value = auth.username;
    }
    if (document.getElementById('setWhatsapp')) {
      document.getElementById('setWhatsapp').value = settings.whatsappNumber || '919137400914';
      document.getElementById('setPhone').value = settings.primaryPhone || '+91 91374 00914';
      document.getElementById('setEmail').value = settings.email || 'orthososc@gmail.com';
      document.getElementById('setEmergencyPhone').value = settings.emergencyPhone || '+91 91374 00914';
    }

    renderAuditLogs();
  }

  // Change Password Form
  document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const curr = document.getElementById('currPasswordInput').value;
    const newPass = document.getElementById('newPasswordInput').value;
    const confirmPass = document.getElementById('confirmPasswordInput').value;
    const newUsername = document.getElementById('adminUsernameInput').value.trim();

    if (newPass !== confirmPass) {
      showToast('New passwords do not match!', 'danger');
      return;
    }

    const res = await OrthosStore.changePassword(curr, newPass);
    if (res.success) {
      if (newUsername) {
        OrthosStore.updateAdminProfile({ username: newUsername });
      }
      document.getElementById('currPasswordInput').value = '';
      document.getElementById('newPasswordInput').value = '';
      document.getElementById('confirmPasswordInput').value = '';
      showToast('Master password successfully updated!', 'success');
    } else {
      showToast(res.message, 'danger');
    }
  });

  // Clinic Contact Channels Form
  document.getElementById('clinicContactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = OrthosStore.getSettings();
    settings.whatsappNumber = document.getElementById('setWhatsapp').value.trim();
    settings.primaryPhone = document.getElementById('setPhone').value.trim();
    settings.email = document.getElementById('setEmail').value.trim();
    settings.emergencyPhone = document.getElementById('setEmergencyPhone').value.trim();

    OrthosStore.saveSettings(settings);
    showToast('Clinic communication details updated!', 'success');
  });

  // Download Backup (JSON)
  document.getElementById('downloadBackupBtn')?.addEventListener('click', () => {
    const jsonStr = OrthosStore.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orthos_clinic_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Complete database backup downloaded.', 'success');
  });

  // Restore Modal
  document.getElementById('openRestoreModalBtn')?.addEventListener('click', () => {
    restoreForm.reset();
    openModal(restoreModalOverlay);
  });

  // Restore File Upload
  const restoreFileInput = document.getElementById('restoreFileInput');
  if (restoreFileInput) {
    restoreFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('restoreJsonText').value = event.target.result;
      };
      reader.readAsText(file);
    });
  }

  if (restoreForm) {
    restoreForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = document.getElementById('restoreJsonText').value.trim();
      if (!text) {
        showToast('Please upload a backup file or paste JSON content.', 'warning');
        return;
      }

      const res = OrthosStore.importAllData(text);
      if (res.success) {
        closeModal(restoreModalOverlay);
        initDashboard();
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'danger');
      }
    });
  }

  // Factory Reset
  document.getElementById('resetDefaultsBtn')?.addEventListener('click', () => {
    if (confirm('CRITICAL ACTION: Reset all appointments, articles, videos, and settings to original clinic defaults? This cannot be undone.')) {
      if (confirm('Confirm once more: Are you absolutely certain you want to reset everything?')) {
        OrthosStore.resetToDefaults();
        initDashboard();
        showToast('Reset completed to default clinic state.', 'info');
      }
    }
  });

  // Audit Logs
  function renderAuditLogs() {
    const tbody = document.getElementById('auditLogTbody');
    if (!tbody) return;
    const logs = OrthosStore.getLogs();

    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:18px;color:var(--slate-400);">No logged activity yet.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.slice(0, 20).map(l => `
      <tr>
        <td style="white-space:nowrap;font-size:12px;color:var(--slate-500);">${formatDate(l.timestamp)}</td>
        <td><strong style="font-size:12px;color:var(--navy-900);">${escapeHtml(l.action)}</strong></td>
        <td style="font-size:12.5px;">${escapeHtml(l.details)}</td>
      </tr>
    `).join('');
  }

  /* =========================================================
     UTILITIES
     ========================================================= */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  }

  // Cross-tab real-time sync
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('orthos_')) {
      if (OrthosStore.isAuthenticated()) {
        renderDashboardKPIs();
        if (currentTab === 'appointments') renderAppointments();
        if (currentTab === 'blogs') renderBlogs();
        if (currentTab === 'videos') renderVideos();
        if (currentTab === 'gallery') renderGallery();
        if (currentTab === 'faqs') renderFaqs();
      } else {
        checkAuth();
      }
    }
  });

  // Start
  document.addEventListener('DOMContentLoaded', checkAuth);
})();
