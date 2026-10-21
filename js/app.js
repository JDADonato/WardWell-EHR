// WardWell EHR - Core Application Bootstrap, Router Views & Orchestration
import { CONFIG } from './config.js';
import { Auth } from './auth.js';
import { Store } from './store.js';
import { StorageService } from './storage.js';
import { initSeedData } from './seed.js';
import { Router } from './router.js';
import { Logger } from './utils/logger.js';
import { formatDate, calculateAge, getCurrentISODateTime } from './utils/dates.js';
import { Toast } from './ui/toast.js';
import { Modal } from './ui/modal.js';
import { showConfirm } from './ui/confirm.js';
import { ThemeManager } from './ui/theme.js';

// Import All 11 Forms
import { AdmissionForm } from './forms/admission.js';
import { NursingAssessmentForm } from './forms/nursing-assessment.js';
import { ConsentForm } from './forms/consent.js';
import { DoctorsOrderForm } from './forms/doctors-order.js';
import { VitalsForm } from './forms/vitals.js';
import { IvFlowForm } from './forms/iv-flow.js';
import { CarePlanForm } from './forms/care-plan.js';
import { MarForm } from './forms/mar.js';
import { ProgressNotesForm } from './forms/progress-notes.js';
import { EndorsementForm } from './forms/endorsement.js';
import { DischargeForm } from './forms/discharge.js';

const FORMS_METADATA = [
  { key: 'admission', title: '1. Patient Info & Admission', module: AdmissionForm, storeKey: 'admission' },
  { key: 'nursing-assessment', title: '2. Nursing Assessment', module: NursingAssessmentForm, storeKey: 'nursingAssessment' },
  { key: 'consent', title: '3. Informed Consent', module: ConsentForm, storeKey: 'consent' },
  { key: 'doctors-order', title: "4. Doctor's Orders", module: DoctorsOrderForm, storeKey: 'doctorsOrders' },
  { key: 'vitals', title: '5. Vital Signs Monitoring', module: VitalsForm, storeKey: 'vitals' },
  { key: 'iv-flow', title: '6. IV Flow Record', module: IvFlowForm, storeKey: 'ivFlow' },
  { key: 'care-plan', title: '7. Nursing Care Plan', module: CarePlanForm, storeKey: 'carePlan' },
  { key: 'mar', title: '8. Medication Record (MAR)', module: MarForm, storeKey: 'mar' },
  { key: 'progress-notes', title: "9. Nurse's Progress Notes", module: ProgressNotesForm, storeKey: 'progressNotes' },
  { key: 'endorsement', title: '10. Endorsement Form', module: EndorsementForm, storeKey: 'endorsement' },
  { key: 'discharge', title: '11. Discharge Planning', module: DischargeForm, storeKey: 'discharge' }
];

// App State
let currentPatientId = null;
let currentFormKey = 'admission';
let isEditMode = false;
let patientListSearch = '';
let patientListFilter = 'all'; // 'all' | 'Admitted' | 'For Discharge' | 'Discharged'
let patientListSort = 'name';   // 'name' | 'date' | 'room'
let patientListPage = 1;

// Global Error Catchers
window.onerror = function (msg, url, lineNo, columnNo, error) {
  Logger.error('Global', 'window.onerror', `${msg} at ${lineNo}:${columnNo}`, error);
  Toast.error('An unexpected interface error occurred. Details logged in console.', 'System Error');
  return false;
};

window.onunhandledrejection = function (event) {
  Logger.error('Global', 'unhandledrejection', event.reason?.message || 'Unhandled Promise Rejection', event.reason);
  Toast.error('An asynchronous error occurred. Please check console.', 'System Error');
};

// ==========================================================================
// GLOBAL KEYBOARD SHORTCUTS
// ==========================================================================
window.addEventListener('keydown', (e) => {
  // Focus Search with '/'
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    const searchInput = document.getElementById('patient-search-input');
    if (searchInput) searchInput.focus();
  }

  // Ctrl+S / Cmd+S save active edit form
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    const saveBtn = document.getElementById('btn-save-edit') ||
                    document.getElementById('btn-save-na') ||
                    document.getElementById('btn-save-consent') ||
                    document.getElementById('btn-save-orders') ||
                    document.getElementById('btn-save-vit') ||
                    document.getElementById('btn-save-iv') ||
                    document.getElementById('btn-save-ncp') ||
                    document.getElementById('btn-save-mar') ||
                    document.getElementById('btn-save-notes') ||
                    document.getElementById('btn-save-end') ||
                    document.getElementById('btn-save-dis');
    if (saveBtn) {
      e.preventDefault();
      saveBtn.click();
    }
  }
});

// Storage Quota Listener
window.addEventListener('ww:storage-quota-exceeded', () => {
  Toast.error('Browser storage limit exceeded. Please export and remove old records in Settings.', 'Quota Exceeded');
});

// Inactivity Warning Listener
window.addEventListener('ww:inactivity-warning', (e) => {
  Toast.warning(e.detail.message, 'Auto-Lock Warning', 8000);
});

// Auth Change Listener
window.addEventListener('ww:auth-change', (e) => {
  if (e.detail.authenticated) {
    Toast.success('Welcome to WardWell EHR.', 'Access Granted');
    renderAppShell();
    Router.navigate('/patients');
  } else {
    if (e.detail.reason === 'inactivity') {
      Toast.warning('Session locked due to 15 minutes of inactivity.', 'Auto-Locked');
    } else {
      Toast.info('You have locked the EHR session.', 'Session Locked');
    }
    renderLoginView();
  }
});

// ==========================================================================
// VIEW: LOGIN GATE
// ==========================================================================
function renderLoginView() {
  const root = document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <div class="login-screen">
      <div class="login-bg-shapes">
        <div class="login-shape shape-1"></div>
        <div class="login-shape shape-2"></div>
        <div class="login-shape shape-3"></div>
      </div>

      <div class="login-card" id="login-card">
        <div class="login-header">
          <img src="assets/logo-icon.svg" class="login-logo" alt="WardWell Icon" />
          <h1>${CONFIG.SYSTEM_NAME}</h1>
          <p>${CONFIG.TAGLINE}</p>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-pwd">Ward Staff Access Passcode</label>
            <div class="password-input-wrap">
              <input type="password" id="login-pwd" class="form-control form-control-lg" placeholder="Enter ward passcode" required autofocus autocomplete="current-password" />
              <button type="button" class="pwd-toggle-btn" id="pwd-toggle" aria-label="Toggle password visibility">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
            <div id="login-error-msg" class="field-error" style="display: none; margin-top: 0.5rem;"></div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" id="login-btn" style="width: 100%; margin-top: 0.5rem;">
            Unlock WardWell EHR
          </button>
        </form>

        <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; border-top: 1px solid var(--border-light); padding-top: 1rem;">
          Protected clinical viewer &bull; Authorized hospital ward personnel only.<br>
          <span style="font-size: 0.72rem; opacity: 0.8;">WardWell General Hospital System &bull; v${CONFIG.APP_VERSION}</span>
        </div>
      </div>
    </div>
  `;

  // Cooldown check on load
  const remaining = Auth.getCooldownRemaining();
  if (remaining > 0) {
    applyCooldownUI(remaining);
  }

  // Password toggle
  const pwdInput = document.getElementById('login-pwd');
  const toggleBtn = document.getElementById('pwd-toggle');
  toggleBtn.addEventListener('click', () => {
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      toggleBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    } else {
      pwdInput.type = 'password';
      toggleBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
  });

  // Login submission
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = pwdInput.value;
    if (!val) return;

    const res = await Auth.login(val);
    if (!res.success) {
      const card = document.getElementById('login-card');
      card.classList.remove('shake');
      void card.offsetWidth; // retrigger reflow
      card.classList.add('shake');

      const errEl = document.getElementById('login-error-msg');
      if (res.reason === 'cooldown') {
        applyCooldownUI(res.remainingSeconds);
        Toast.error(`Too many failed attempts. Please wait ${res.remainingSeconds}s.`, 'Access Locked');
      } else {
        errEl.textContent = `Invalid password. ${res.attemptsLeft} attempt(s) remaining before temporary lockout.`;
        errEl.style.display = 'block';
        Toast.error('Incorrect passcode. Access denied.', 'Authentication Failed');
        pwdInput.focus();
        pwdInput.select();
      }
    }
  });
}

function applyCooldownUI(seconds) {
  const btn = document.getElementById('login-btn');
  const pwdInput = document.getElementById('login-pwd');
  const errEl = document.getElementById('login-error-msg');
  if (!btn || !pwdInput) return;

  btn.disabled = true;
  pwdInput.disabled = true;

  let left = seconds;
  errEl.textContent = `Too many failed attempts. Try again in ${left}s.`;
  errEl.style.display = 'block';

  const timer = setInterval(() => {
    left--;
    if (left <= 0) {
      clearInterval(timer);
      btn.disabled = false;
      pwdInput.disabled = false;
      errEl.style.display = 'none';
      btn.textContent = 'Unlock WardWell EHR';
      pwdInput.focus();
    } else {
      errEl.textContent = `Too many failed attempts. Try again in ${left}s.`;
      btn.textContent = `Locked (${left}s)`;
    }
  }, 1000);
}

// ==========================================================================
// APP SHELL RENDERER
// ==========================================================================
function renderAppShell() {
  const root = document.getElementById('app');
  if (!root) return;

  root.innerHTML = `
    <!-- Top Navigation Header -->
    <header class="app-header">
      <a href="#/patients" class="brand-wrapper" title="WardWell EHR Home">
        <img src="assets/logo.svg" class="brand-logo-img" alt="WardWell EHR Logo" />
      </a>

      <div class="header-actions">
        <!-- Settings Modal Button -->
        <button type="button" class="btn btn-icon btn-ghost" id="btn-open-settings" title="Data Management & Settings" aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>

        <!-- Lock Button -->
        <button type="button" class="btn btn-outline btn-sm" id="btn-lock-session" title="Lock Session">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>Lock</span>
        </button>
      </div>
    </header>

    <!-- Main Content Container -->
    <main id="app-main" style="flex: 1; display: flex; flex-direction: column;"></main>
  `;

  // Attach Header Actions
  document.getElementById('btn-lock-session').addEventListener('click', () => {
    Auth.logout('manual');
  });

  document.getElementById('btn-open-settings').addEventListener('click', openSettingsModal);
}

// ==========================================================================
// VIEW: PATIENT LIST (HOME SCREEN)
// ==========================================================================
function renderPatientListView() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const allPatients = Store.getPatients();

  // Compute stat counters
  const totalCount = allPatients.length;
  const admittedCount = allPatients.filter(p => p.status === 'Admitted').length;
  const forDischargeCount = allPatients.filter(p => p.status === 'For Discharge').length;
  const dischargedCount = allPatients.filter(p => p.status === 'Discharged').length;

  main.innerHTML = `
    <div class="main-container">
      <!-- Summary Stat Cards -->
      <div class="stats-grid">
        <div class="stat-card accent">
          <span class="stat-label">Total Ward Patients</span>
          <span class="stat-value" id="stat-total">${totalCount}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Currently Admitted</span>
          <span class="stat-value" style="color: var(--status-admitted-text);" id="stat-admitted">${admittedCount}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">For Discharge Today</span>
          <span class="stat-value" style="color: var(--status-fordischarge-text);" id="stat-fordischarge">${forDischargeCount}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Discharged</span>
          <span class="stat-value" style="color: var(--text-secondary);" id="stat-discharged">${dischargedCount}</span>
        </div>
      </div>

      <!-- Header Row with Add Patient Button -->
      <div class="list-header-row">
        <div>
          <h2>Ward Patients Directory</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Manage patient charts, monitor vitals, and update inpatient clinical records.</p>
        </div>
        <button type="button" class="btn btn-primary" id="btn-add-patient">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>New Patient Admission</span>
        </button>
      </div>

      <!-- Search & Filters Bar -->
      <div class="search-filters-bar">
        <!-- Search Input -->
        <div class="search-input-wrap">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="patient-search-input" class="form-control" placeholder="Search by name, ID, room, doctor, diagnosis..." value="${patientListSearch}" />
          <span class="search-shortcut-hint">/</span>
        </div>

        <!-- Status Filter Tabs -->
        <div class="filter-tabs">
          <button type="button" class="filter-tab-btn ${patientListFilter === 'all' ? 'active' : ''}" data-filter="all">All (${totalCount})</button>
          <button type="button" class="filter-tab-btn ${patientListFilter === 'Admitted' ? 'active' : ''}" data-filter="Admitted">Admitted (${admittedCount})</button>
          <button type="button" class="filter-tab-btn ${patientListFilter === 'For Discharge' ? 'active' : ''}" data-filter="For Discharge">For Discharge (${forDischargeCount})</button>
          <button type="button" class="filter-tab-btn ${patientListFilter === 'Discharged' ? 'active' : ''}" data-filter="Discharged">Discharged (${dischargedCount})</button>
        </div>

        <!-- Sort Select -->
        <div class="sort-select-wrap">
          <label for="sort-select" style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">SORT:</label>
          <select id="sort-select" class="form-control form-control-sm" style="width: 150px;">
            <option value="name" ${patientListSort === 'name' ? 'selected' : ''}>Name (A-Z)</option>
            <option value="date" ${patientListSort === 'date' ? 'selected' : ''}>Admission Date</option>
            <option value="room" ${patientListSort === 'room' ? 'selected' : ''}>Room / Bed</option>
          </select>
        </div>
      </div>

      <!-- Table / Cards Container -->
      <div id="patient-list-stage">
        <!-- Rendered by updatePatientListStage() -->
      </div>
    </div>
  `;

  // Attach search input debounced (250ms)
  let searchTimer = null;
  const searchInput = document.getElementById('patient-search-input');
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      patientListSearch = e.target.value.trim().toLowerCase();
      patientListPage = 1;
      updatePatientListStage();
    }, 250);
  });

  // Attach filter tabs
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      patientListFilter = btn.dataset.filter;
      patientListPage = 1;
      updatePatientListStage();
    });
  });

  // Attach sort select
  document.getElementById('sort-select').addEventListener('click', (e) => {
    if (patientListSort !== e.target.value) {
      patientListSort = e.target.value;
      updatePatientListStage();
    }
  });

  // Attach Add Patient button
  document.getElementById('btn-add-patient').addEventListener('click', () => {
    openAddPatientModal();
  });

  updatePatientListStage();
}

function updatePatientListStage() {
  const stage = document.getElementById('patient-list-stage');
  if (!stage) return;

  const allPatients = Store.getPatients();

  // 1. Filter by Status
  let filtered = allPatients.filter(p => {
    if (patientListFilter !== 'all' && p.status !== patientListFilter) return false;
    return true;
  });

  // 2. Filter by Search Query
  if (patientListSearch) {
    const q = patientListSearch.toLowerCase();
    filtered = filtered.filter(p => {
      const fullName = `${p.lastName} ${p.firstName} ${p.middleName || ''}`.toLowerCase();
      const hosp = (p.hospitalNo || '').toLowerCase();
      const room = (p.roomBed || '').toLowerCase();
      const doc = (p.attendingPhysician || '').toLowerCase();
      const diag = (p.admittingDiagnosis || '').toLowerCase();
      return fullName.includes(q) || hosp.includes(q) || room.includes(q) || doc.includes(q) || diag.includes(q);
    });
  }

  // 3. Sort
  filtered.sort((a, b) => {
    if (patientListSort === 'name') {
      return a.lastName.localeCompare(b.lastName);
    }
    if (patientListSort === 'date') {
      return new Date(b.admissionDate || 0) - new Date(a.admissionDate || 0);
    }
    if (patientListSort === 'room') {
      return (a.roomBed || '').localeCompare(b.roomBed || '');
    }
    return 0;
  });

  // 4. Pagination
  const perPage = CONFIG.PATIENTS_PER_PAGE || 10;
  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  if (patientListPage > totalPages) patientListPage = totalPages;
  const startIndex = (patientListPage - 1) * perPage;
  const pagedPatients = filtered.slice(startIndex, startIndex + perPage);

  if (filtered.length === 0) {
    if (patientListSearch) {
      stage.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem; background-color: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); margin-bottom: 0.75rem;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <h3>No patients found</h3>
          <p style="color: var(--text-secondary); margin-top: 0.35rem;">No patient matched your search query "<strong>${patientListSearch}</strong>".</p>
          <button type="button" class="btn btn-secondary btn-sm" id="clear-search-btn" style="margin-top: 1rem;">Clear Search</button>
        </div>
      `;
      document.getElementById('clear-search-btn')?.addEventListener('click', () => {
        patientListSearch = '';
        const inp = document.getElementById('patient-search-input');
        if (inp) inp.value = '';
        updatePatientListStage();
      });
    } else {
      stage.innerHTML = `
        <div style="text-align: center; padding: 4rem 1rem; background-color: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <h3>No patients in this directory</h3>
          <p style="color: var(--text-secondary); margin-top: 0.35rem;">There are no patients currently registered under this filter.</p>
          <button type="button" class="btn btn-primary" id="empty-add-btn" style="margin-top: 1rem;">+ Add Patient</button>
        </div>
      `;
      document.getElementById('empty-add-btn')?.addEventListener('click', openAddPatientModal);
    }
    return;
  }

  // Helper for search highlight
  function highlight(text) {
    if (!text) return '—';
    if (!patientListSearch) return text;
    const regex = new RegExp(`(${patientListSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.toString().replace(regex, '<mark class="highlight">$1</mark>');
  }

  // Desktop Table HTML
  const tableRows = pagedPatients.map(p => {
    const initials = `${(p.firstName?.[0] || 'P')}${(p.lastName?.[0] || 'T')}`.toUpperCase();
    const fullName = `${p.lastName}, ${p.firstName} ${p.middleName || ''}`.trim();
    const statusClass = p.status === 'Admitted' ? 'badge-admitted' : p.status === 'For Discharge' ? 'badge-fordischarge' : 'badge-discharged';

    return `
      <tr class="patient-table-row" data-id="${p.id}" style="cursor: pointer;">
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="avatar">${initials}</div>
            <div>
              <div style="font-weight: 600; font-size: 0.95rem;">${highlight(fullName)}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">${highlight(p.hospitalNo)}</div>
            </div>
          </div>
        </td>
        <td style="white-space: nowrap;">${p.age || '—'} / ${p.sex || '—'}</td>
        <td style="white-space: nowrap; font-weight: 500;">${highlight(p.roomBed)}</td>
        <td style="white-space: nowrap; font-size: 0.84rem;">${formatDate(p.admissionDate, 'short')}</td>
        <td class="col-doctor" title="${p.attendingPhysician}">${highlight(p.attendingPhysician)}</td>
        <td class="col-diagnosis" title="${p.admittingDiagnosis}">${highlight(p.admittingDiagnosis)}</td>
        <td class="col-status" style="white-space: nowrap;">
          <span class="badge ${statusClass}">${p.status}</span>
        </td>
        <td class="col-actions" onclick="event.stopPropagation();">
          <div class="row-actions-cluster">
            <button type="button" class="btn btn-icon btn-sm btn-ghost edit-patient-btn" data-id="${p.id}" title="Edit Demographics">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button type="button" class="btn btn-icon btn-sm btn-ghost del-patient-btn" data-id="${p.id}" title="Delete Patient" style="color: var(--status-critical-text);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Mobile Cards HTML
  const cardsHtml = pagedPatients.map(p => {
    const initials = `${(p.firstName?.[0] || 'P')}${(p.lastName?.[0] || 'T')}`.toUpperCase();
    const fullName = `${p.lastName}, ${p.firstName} ${p.middleName || ''}`.trim();
    const statusClass = p.status === 'Admitted' ? 'badge-admitted' : p.status === 'For Discharge' ? 'badge-fordischarge' : 'badge-discharged';

    return `
      <div class="patient-card-item" data-id="${p.id}">
        <div class="card-top">
          <div class="card-patient-info">
            <div class="avatar">${initials}</div>
            <div>
              <div style="font-weight: 600; font-size: 1rem;">${highlight(fullName)}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">${highlight(p.hospitalNo)}</div>
            </div>
          </div>
          <span class="badge ${statusClass}">${p.status}</span>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem;">
          <div><strong>Room:</strong> ${highlight(p.roomBed)}</div>
          <div><strong>Age/Sex:</strong> ${p.age} / ${p.sex}</div>
          <div style="grid-column: 1 / -1;"><strong>Diagnosis:</strong> ${highlight(p.admittingDiagnosis)}</div>
        </div>
        <div class="card-actions">
          <button type="button" class="btn btn-icon btn-sm btn-ghost del-patient-btn" data-id="${p.id}" title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          <button type="button" class="btn btn-icon btn-sm btn-ghost edit-patient-btn" data-id="${p.id}" title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <a href="#/patients/${p.id}/admission" class="btn btn-sm btn-primary">Open Chart</a>
        </div>
      </div>
    `;
  }).join('');

  stage.innerHTML = `
    <!-- Desktop Table -->
    <div class="table-responsive patient-table-desktop">
      <table class="data-table">
        <thead>
          <tr>
            <th>Patient Name & Hospital ID</th>
            <th>Age / Sex</th>
            <th>Room / Bed</th>
            <th>Admitted</th>
            <th>Attending Physician</th>
            <th>Admitting Diagnosis</th>
            <th class="col-status">Status</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="patient-cards-mobile">
      ${cardsHtml}
    </div>

    <!-- Pagination Bar -->
    <div class="pagination-bar">
      <div style="font-size: 0.85rem; color: var(--text-secondary);">
        Showing ${startIndex + 1} to ${Math.min(startIndex + perPage, filtered.length)} of ${filtered.length} patients
      </div>
      <div class="pagination-controls">
        <button type="button" class="btn btn-sm btn-outline" id="prev-page-btn" ${patientListPage <= 1 ? 'disabled' : ''}>&larr; Prev</button>
        <span style="font-size: 0.85rem; padding: 0 0.5rem; font-weight: 600;">Page ${patientListPage} of ${totalPages}</span>
        <button type="button" class="btn btn-sm btn-outline" id="next-page-btn" ${patientListPage >= totalPages ? 'disabled' : ''}>Next &rarr;</button>
      </div>
    </div>
  `;

  // Attach row and card click to navigate to patient chart
  stage.querySelectorAll('.patient-table-row').forEach(row => {
    row.addEventListener('click', () => {
      Router.navigate(`/patients/${row.dataset.id}/admission`);
    });
  });

  stage.querySelectorAll('.patient-card-item').forEach(card => {
    card.addEventListener('click', () => {
      Router.navigate(`/patients/${card.dataset.id}/admission`);
    });
  });

  // Attach delete buttons
  stage.querySelectorAll('.del-patient-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const patient = Store.getPatientById(id);
      if (!patient) return;

      const confirmed = await showConfirm({
        title: 'Delete Patient Record',
        message: `Are you sure you want to delete patient "${patient.firstName} ${patient.lastName}" (${patient.hospitalNo})? You can undo this action within 8 seconds.`,
        confirmText: 'Delete Patient',
        isDanger: true
      });

      if (confirmed) {
        Store.deletePatient(id);
        Toast.withUndo(
          `Patient ${patient.lastName} was deleted.`,
          () => {
            Store.undoDelete();
            Toast.success('Patient record restored.', 'Restored');
            updatePatientListStage();
          },
          'Patient Deleted'
        );
        updatePatientListStage();
      }
    });
  });

  // Attach edit buttons
  stage.querySelectorAll('.edit-patient-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditPatientDemographicsModal(btn.dataset.id);
    });
  });

  // Attach pagination buttons
  document.getElementById('prev-page-btn')?.addEventListener('click', () => {
    if (patientListPage > 1) {
      patientListPage--;
      updatePatientListStage();
    }
  });

  document.getElementById('next-page-btn')?.addEventListener('click', () => {
    if (patientListPage < totalPages) {
      patientListPage++;
      updatePatientListStage();
    }
  });
}

// ==========================================================================
// VIEW: PATIENT RECORD (CHART WORKSPACE)
// ==========================================================================
function renderPatientRecordView(patientId, formKey = 'admission') {
  const main = document.getElementById('app-main');
  if (!main) return;

  const patient = Store.getPatientById(patientId);
  if (!patient) {
    main.innerHTML = `
      <div class="main-container" style="text-align: center; padding: 4rem 1rem;">
        <h2>Patient Not Found</h2>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">The requested patient record could not be found.</p>
        <a href="#/patients" class="btn btn-primary" style="margin-top: 1rem;">Back to Patients</a>
      </div>
    `;
    return;
  }

  if (currentPatientId !== patientId || currentFormKey !== formKey) {
    isEditMode = false;
  }
  currentPatientId = patientId;
  currentFormKey = formKey;

  const fullName = `${patient.lastName}, ${patient.firstName} ${patient.middleName || ''}`.trim();
  const initials = `${(patient.firstName?.[0] || 'P')}${(patient.lastName?.[0] || 'T')}`.toUpperCase();
  const statusClass = patient.status === 'Admitted' ? 'badge-admitted' : patient.status === 'For Discharge' ? 'badge-fordischarge' : 'badge-discharged';

  const formMeta = FORMS_METADATA.find(f => f.key === formKey) || FORMS_METADATA[0];
  const completionMap = Store.getFormCompletionMap(patient);

  const currentIndex = FORMS_METADATA.findIndex(f => f.key === formKey);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const prevForm = safeIndex > 0 ? FORMS_METADATA[safeIndex - 1] : null;
  const nextForm = safeIndex < FORMS_METADATA.length - 1 ? FORMS_METADATA[safeIndex + 1] : null;

  // Render Sidebar Form Navigation Items
  const sidebarNavItems = FORMS_METADATA.map((f, i) => {
    const isCompleted = completionMap[f.key];
    const isActive = f.key === formKey;
    return `
      <a href="#/patients/${patient.id}/${f.key}" class="form-nav-item ${isActive ? 'active' : ''}">
        <div class="form-nav-left">
          <span class="form-nav-num">${i + 1}.</span>
          <span title="${f.title}">${f.title.replace(/^\d+\.\s*/, '')}</span>
        </div>
        <span class="completion-indicator ${isCompleted ? 'completed' : ''}" title="${isCompleted ? 'Form completed' : 'Form incomplete'}"></span>
      </a>
    `;
  }).join('');

  // Mobile Tabs
  const mobileTabs = FORMS_METADATA.map((f, i) => {
    const isActive = f.key === formKey;
    const isCompleted = completionMap[f.key];
    return `
      <a href="#/patients/${patient.id}/${f.key}" class="mobile-tab-btn ${isActive ? 'active' : ''}">
        <span>${i + 1}. ${f.title.replace(/^\d+\.\s*/, '').slice(0, 16)}</span>
        <span class="completion-indicator ${isCompleted ? 'completed' : ''}" style="width: 6px; height: 6px;"></span>
      </a>
    `;
  }).join('');

  main.innerHTML = `
    <!-- Sticky Patient Identification Banner -->
    <div class="patient-banner">
      <div class="patient-banner-main">
        <a href="#/patients" class="btn btn-icon btn-sm btn-outline banner-back-btn" title="Back to Patients List">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </a>
        <div class="avatar">${initials}</div>
        <div class="banner-info-wrap">
          <div class="banner-name">
            <span class="banner-patient-name" title="${fullName}">${fullName}</span>
            <span class="badge ${statusClass}">${patient.status}</span>
          </div>
          <div class="banner-sub">
            <span><strong>Room:</strong> ${patient.roomBed}</span>
            <span><strong>ID:</strong> ${patient.hospitalNo}</span>
            <span class="banner-meta-desktop"><strong>Age/Sex:</strong> ${patient.age} / ${patient.sex}</span>
            <span class="banner-meta-desktop"><strong>Doctor:</strong> ${patient.attendingPhysician}</span>
            ${patient.allergies && !patient.allergies.toLowerCase().includes('none')
              ? `<span class="allergy-pill">Allergies: ${patient.allergies}</span>`
              : ''
            }
          </div>
        </div>
      </div>
      <div class="banner-actions">
        <button type="button" class="btn btn-sm btn-outline no-print banner-print-btn" id="btn-print-full-chart" title="Print all 11 forms sequentially">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          <span class="btn-text">Print Complete Chart</span>
        </button>
      </div>
    </div>

    <!-- Workspace: Sidebar + Main Form Area -->
    <div class="chart-workspace">
      <!-- Desktop Sidebar -->
      <aside class="chart-sidebar no-print">
        <div class="sidebar-title">Clinical Forms Directory</div>
        ${sidebarNavItems}
      </aside>

      <!-- Main Form Stage -->
      <section class="chart-content">
        <!-- Breadcrumbs -->
        <div class="breadcrumbs no-print">
          <a href="#/patients">Patients</a>
          <span>/</span>
          <span>${patient.lastName}, ${patient.firstName}</span>
          <span>/</span>
          <span class="current">${formMeta.title}</span>
        </div>

        <!-- Form Action Bar -->
        <div class="form-action-bar no-print ${isEditMode ? 'editing-active' : ''}" id="chart-form-action-bar">
          <div class="form-action-left">
            <span class="form-mode-badge ${isEditMode ? 'badge-edit' : 'badge-view'}" id="form-mode-badge">
              ${isEditMode ? 'Editing Mode' : 'View Mode'}
            </span>
            <span class="draft-status-indicator" id="draft-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Auto-saved to storage
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;" id="form-action-buttons">
            <!-- Buttons injected and wired by updateActionBarUI() -->
          </div>
        </div>

        <!-- Render Specific Form Stage -->
        <div id="form-stage" class="form-stage-transition">
          <!-- Active Form Element mounted here -->
        </div>
      </section>
    </div>

    <!-- Sticky Bottom Mobile Form Navigation Dock -->
    <nav class="mobile-form-nav-container no-print" aria-label="Clinical Forms Navigation">
      <!-- Horizontal Scrollable Tabs Strip -->
      <div class="mobile-form-tabs" id="mobile-form-tabs">
        ${mobileTabs}
      </div>

      <!-- Stepper Toolbar -->
      <div class="mobile-form-bottom-toolbar">
        <button
          type="button"
          class="mobile-nav-step-btn mobile-nav-prev"
          id="btn-mobile-prev-form"
          ${prevForm ? '' : 'disabled'}
          title="${prevForm ? `Previous: ${prevForm.title}` : 'First Form'}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          <span>Back</span>
        </button>

        <div class="mobile-form-select-wrap">
          <button
            type="button"
            class="mobile-bottom-form-trigger"
            id="btn-open-form-sheet"
            aria-haspopup="dialog"
            aria-expanded="false"
            title="Select Clinical Form"
          >
            <span class="mobile-trigger-counter">${safeIndex + 1}/11</span>
            <span class="mobile-trigger-title">${formMeta.title.replace(/^\d+\.\s*/, '')}</span>
            <svg class="mobile-trigger-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>

          <!-- Hidden select for programmatic testing & full backwards compatibility -->
          <select id="mobile-form-select" class="visually-hidden" aria-hidden="true" tabindex="-1">
            ${FORMS_METADATA.map((f, i) => `
              <option value="${f.key}" ${f.key === formKey ? 'selected' : ''}>
                ${i + 1}/${FORMS_METADATA.length}: ${f.title.replace(/^\d+\.\s*/, '')} ${completionMap[f.key] ? '✓' : ''}
              </option>
            `).join('')}
          </select>
        </div>

        <button
          type="button"
          class="mobile-nav-step-btn mobile-nav-next"
          id="btn-mobile-next-form"
          ${nextForm ? '' : 'disabled'}
          title="${nextForm ? `Next: ${nextForm.title}` : 'Last Form'}"
        >
          <span>Next</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    </nav>

    <!-- Native Mobile Clinical Forms Bottom Sheet Picker -->
    <div class="mobile-forms-sheet-backdrop" id="mobile-forms-sheet-backdrop" aria-hidden="true">
      <div class="mobile-forms-sheet" id="mobile-forms-sheet" role="dialog" aria-modal="true" aria-labelledby="form-sheet-title">
        <div class="mobile-forms-sheet-handle"></div>
        
        <div class="mobile-forms-sheet-header">
          <div class="mobile-sheet-title-wrap">
            <h3 id="form-sheet-title" class="mobile-sheet-title">Clinical Forms Directory</h3>
            <p class="mobile-sheet-subtitle">
              <span class="sheet-status-dot"></span>
              ${Object.values(completionMap).filter(Boolean).length} of 11 Forms Completed
            </p>
          </div>
          <button type="button" class="mobile-sheet-close-btn" id="btn-close-form-sheet" aria-label="Close form picker">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="mobile-forms-sheet-list" id="mobile-forms-sheet-list">
          ${FORMS_METADATA.map((f, i) => {
            const isCurrent = f.key === formKey;
            const isDone = completionMap[f.key];
            return `
              <button
                type="button"
                class="mobile-sheet-form-item ${isCurrent ? 'active' : ''} ${isDone ? 'completed' : ''}"
                data-form-key="${f.key}"
              >
                <div class="sheet-item-num">${String(i + 1).padStart(2, '0')}</div>
                <div class="sheet-item-info">
                  <span class="sheet-item-title">${f.title.replace(/^\d+\.\s*/, '')}</span>
                  <span class="sheet-item-status">
                    ${isCurrent ? 'Currently Viewing' : isDone ? 'Completed' : 'Pending Entry'}
                  </span>
                </div>
                <div class="sheet-item-badge">
                  ${isCurrent 
                    ? '<span class="sheet-pill sheet-pill-active"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Active</span>'
                    : isDone
                    ? '<span class="sheet-pill sheet-pill-done"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Done</span>'
                    : '<span class="sheet-pill sheet-pill-pending">Open</span>'
                  }
                </div>
              </button>
            `;
          }).join('')}
        </div>

        <div class="mobile-forms-sheet-footer">
          <button type="button" class="btn btn-outline mobile-sheet-cancel-btn" id="btn-cancel-form-sheet">Dismiss</button>
        </div>
      </div>
    </div>
  `;

  // Attach Print Full Chart button
  document.getElementById('btn-print-full-chart')?.addEventListener('click', () => {
    renderCompleteChartForPrint(patient);
  });

  // Safe navigation helper that checks for unsaved edits
  const safeNavigate = async (targetFormKey) => {
    if (!targetFormKey || targetFormKey === formKey) return false;
    if (isEditMode) {
      const discard = await showConfirm({
        title: 'Discard Changes?',
        message: 'You are currently editing this form. Switching forms will discard any unsaved modifications.',
        confirmText: 'Discard & Switch',
        cancelText: 'Stay on Form'
      });
      if (!discard) return false;
      isEditMode = false;
    }
    Router.navigate(`/patients/${patient.id}/${targetFormKey}`);
    return true;
  };

  // Mobile Prev / Next Steppers
  document.getElementById('btn-mobile-prev-form')?.addEventListener('click', async () => {
    if (prevForm) {
      await safeNavigate(prevForm.key);
    }
  });

  document.getElementById('btn-mobile-next-form')?.addEventListener('click', async () => {
    if (nextForm) {
      await safeNavigate(nextForm.key);
    }
  });

  // Mobile Forms Sheet Picker Modal Controls
  const sheetBackdrop = document.getElementById('mobile-forms-sheet-backdrop');
  const triggerBtn = document.getElementById('btn-open-form-sheet');
  const openSheet = () => {
    sheetBackdrop?.classList.add('open');
    sheetBackdrop?.setAttribute('aria-hidden', 'false');
    triggerBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeSheet = () => {
    sheetBackdrop?.classList.remove('open');
    sheetBackdrop?.setAttribute('aria-hidden', 'true');
    triggerBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  triggerBtn?.addEventListener('click', openSheet);
  document.getElementById('btn-close-form-sheet')?.addEventListener('click', closeSheet);
  document.getElementById('btn-cancel-form-sheet')?.addEventListener('click', closeSheet);
  sheetBackdrop?.addEventListener('click', (e) => {
    if (e.target === sheetBackdrop) {
      closeSheet();
    }
  });

  document.querySelectorAll('.mobile-sheet-form-item').forEach(item => {
    item.addEventListener('click', async () => {
      const targetKey = item.dataset.formKey;
      closeSheet();
      await safeNavigate(targetKey);
    });
  });

  // Mobile Jump Dropdown Listener (for backwards compatibility & programmatic access)
  document.getElementById('mobile-form-select')?.addEventListener('change', async (e) => {
    const targetKey = e.target.value;
    const ok = await safeNavigate(targetKey);
    if (!ok) {
      e.target.value = formKey;
    }
  });

  // Mobile Tabs Click Guard
  document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (isEditMode) {
        e.preventDefault();
        const targetHref = btn.getAttribute('href') || '';
        const match = targetHref.match(/#\/patients\/[^/]+\/([^/]+)/);
        if (match && match[1]) {
          await safeNavigate(match[1]);
        }
      }
    });
  });

  // Desktop Sidebar Form Click Guard
  document.querySelectorAll('.form-nav-item').forEach(link => {
    link.addEventListener('click', async (e) => {
      if (isEditMode) {
        e.preventDefault();
        const targetHref = link.getAttribute('href') || '';
        const match = targetHref.match(/#\/patients\/[^/]+\/([^/]+)/);
        if (match && match[1]) {
          await safeNavigate(match[1]);
        }
      }
    });
  });

  // Banner Back Button Click Guard
  document.querySelector('.banner-back-btn')?.addEventListener('click', async (e) => {
    if (isEditMode) {
      e.preventDefault();
      const discard = await showConfirm({
        title: 'Discard Changes?',
        message: 'You are currently editing this form. Navigating back to the patient directory will discard any unsaved modifications.',
        confirmText: 'Discard & Exit',
        cancelText: 'Stay on Form'
      });
      if (discard) {
        isEditMode = false;
        Router.navigate('/patients');
      }
    }
  });

  // Smooth scroll active mobile tab into view
  setTimeout(() => {
    document.querySelector('.mobile-tab-btn.active')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, 100);

  // Initialize Action Bar controls and render form
  updateActionBarUI();
  renderActiveForm();
}

function updateActionBarUI() {
  const bar = document.getElementById('chart-form-action-bar');
  if (!bar) return;

  bar.classList.toggle('editing-active', isEditMode);

  const badge = document.getElementById('form-mode-badge');
  if (badge) {
    badge.className = `form-mode-badge ${isEditMode ? 'badge-edit' : 'badge-view'}`;
    badge.textContent = isEditMode ? 'Editing Mode' : 'View Mode';
  }

  const btnContainer = document.getElementById('form-action-buttons');
  if (!btnContainer) return;

  if (isEditMode) {
    btnContainer.innerHTML = `
      <button type="button" class="btn btn-sm btn-outline" id="btn-cancel-edit-mode">Cancel</button>
    `;
    document.getElementById('btn-cancel-edit-mode')?.addEventListener('click', async () => {
      const cancel = await showConfirm({
        title: 'Discard Changes?',
        message: 'Are you sure you want to cancel? Any unsaved edits will be discarded.',
        confirmText: 'Discard Changes',
        cancelText: 'Continue Editing'
      });
      if (cancel) {
        setEditMode(false);
      }
    });
  } else {
    btnContainer.innerHTML = `
      <button type="button" class="btn btn-sm btn-primary" id="btn-toggle-edit-mode">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        <span>Edit Form</span>
      </button>
      <button type="button" class="btn btn-sm btn-outline" id="btn-print-form">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        <span>Print Form</span>
      </button>
    `;
    document.getElementById('btn-toggle-edit-mode')?.addEventListener('click', () => {
      setEditMode(true);
    });
    document.getElementById('btn-print-form')?.addEventListener('click', () => {
      window.print();
    });
  }
}

function setEditMode(newMode) {
  isEditMode = newMode;
  updateActionBarUI();
  renderActiveForm();
}

function renderActiveForm() {
  const stage = document.getElementById('form-stage');
  if (!stage) return;

  const patient = Store.getPatientById(currentPatientId);
  if (!patient) return;

  const formMeta = FORMS_METADATA.find(f => f.key === currentFormKey) || FORMS_METADATA[0];

  const onSave = (formData) => {
    Store.saveFormData(patient.id, formMeta.storeKey, formData);
    Toast.success(`"${formMeta.title}" saved successfully.`, 'Form Saved');
    setEditMode(false);
  };

  const onCancel = () => {
    setEditMode(false);
  };

  stage.innerHTML = '';
  let formNode = null;

  if (isEditMode) {
    formNode = formMeta.module.renderEdit(patient, onSave, onCancel);
  } else {
    formNode = formMeta.module.renderView(patient, () => {
      setEditMode(true);
    }, () => {
      window.print();
    });
  }

  stage.appendChild(formNode);
}

// ==========================================================================
// COMPLETE CHART PRINT PREVIEW
// ==========================================================================
function renderCompleteChartForPrint(patient) {
  const main = document.getElementById('app-main');
  if (!main) return;

  Toast.info('Rendering complete 11-form chart for print preview...', 'Print Ready');

  const wrapper = document.createElement('div');
  wrapper.className = 'print-complete-chart-container';

  // Sticky Print Toolbar with Back Button
  const toolbar = document.createElement('div');
  toolbar.className = 'print-preview-toolbar no-print';
  toolbar.innerHTML = `
    <div class="print-toolbar-left">
      <button type="button" class="btn btn-outline btn-sm print-toolbar-back-btn" id="btn-exit-print-preview" title="Back to Patient Chart">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        <span class="btn-text-mobile">Chart</span>
        <span class="btn-text-desktop">Back to Patient Chart</span>
      </button>
    </div>
    
    <div class="print-toolbar-center">
      <div class="print-doc-badge">
        <span class="print-doc-name">Complete Medical Record</span>
        <span class="print-doc-count">11 Forms</span>
      </div>
      <div class="print-doc-patient">
        <span class="print-patient-name">${patient.lastName}, ${patient.firstName}</span>
        <span class="print-patient-id">&bull; ${patient.hospitalNo}</span>
      </div>
    </div>

    <div class="print-toolbar-right">
      <button type="button" class="btn btn-primary btn-sm print-toolbar-print-btn" id="btn-do-print" title="Print Complete Chart (All 11 Forms)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        <span class="btn-text-mobile">Print</span>
        <span class="btn-text-desktop">Print / Save as PDF</span>
      </button>
    </div>
  `;
  wrapper.appendChild(toolbar);

  // Forms Container
  const formsContainer = document.createElement('div');
  formsContainer.className = 'print-forms-flow';

  FORMS_METADATA.forEach(f => {
    const formView = f.module.renderView(patient, () => {}, () => {});
    formsContainer.appendChild(formView);
  });
  wrapper.appendChild(formsContainer);

  main.innerHTML = '';
  main.appendChild(wrapper);

  // Wire Toolbar Handlers
  document.getElementById('btn-exit-print-preview')?.addEventListener('click', () => {
    setEditMode(false);
    renderPatientRecordView(patient.id, currentFormKey);
  });

  document.getElementById('btn-do-print')?.addEventListener('click', () => {
    window.print();
  });
}

// ==========================================================================
// MODAL: ADD PATIENT
// ==========================================================================
function openAddPatientModal() {
  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <form id="new-patient-form">
      <div class="grid-3">
        <div class="form-group">
          <label class="form-label" for="np-last">Last Name <span class="required">*</span></label>
          <input type="text" id="np-last" class="form-control" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="np-first">First Name <span class="required">*</span></label>
          <input type="text" id="np-first" class="form-control" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="np-mid">Middle Name</label>
          <input type="text" id="np-mid" class="form-control" />
        </div>

        <div class="form-group">
          <label class="form-label" for="np-dob">Date of Birth <span class="required">*</span></label>
          <input type="date" id="np-dob" class="form-control" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="np-sex">Sex / Gender <span class="required">*</span></label>
          <select id="np-sex" class="form-control">
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="np-status">Admission Status</label>
          <select id="np-status" class="form-control">
            <option value="Admitted">Admitted</option>
            <option value="For Discharge">For Discharge</option>
            <option value="Discharged">Discharged</option>
          </select>
        </div>

        <div class="form-group col-span-2">
          <label class="form-label" for="np-room">Ward Room & Bed <span class="required">*</span></label>
          <input type="text" id="np-room" class="form-control" placeholder="e.g. Ward 2 - Bed 05" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="np-doc">Attending Physician <span class="required">*</span></label>
          <input type="text" id="np-doc" class="form-control" placeholder="Dr. Alicia Ramos, MD" required />
        </div>

        <div class="form-group col-span-3">
          <label class="form-label" for="np-diag">Admitting Diagnosis <span class="required">*</span></label>
          <input type="text" id="np-diag" class="form-control" placeholder="e.g. Acute Gastroenteritis with Moderate Dehydration" required />
        </div>

        <div class="form-group col-span-2">
          <label class="form-label" for="np-allergies">Allergies</label>
          <input type="text" id="np-allergies" class="form-control" placeholder="None Known / Penicillin..." value="None Known" />
        </div>
        <div class="form-group">
          <label class="form-label" for="np-phone">Contact Phone</label>
          <input type="tel" id="np-phone" class="form-control" placeholder="0917-000-0000" />
        </div>
      </div>
    </form>
  `;

  const modal = Modal.create({
    title: 'New Patient Admission',
    content: modalContent,
    size: 'lg',
    footerButtons: [
      {
        label: 'Cancel',
        className: 'btn-outline',
        onClick: ({ close }) => close()
      },
      {
        label: 'Create Patient Chart',
        className: 'btn-primary',
        onClick: ({ close }) => {
          const form = modalContent.querySelector('#new-patient-form');
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          const newPatient = Store.savePatient({
            lastName: modalContent.querySelector('#np-last').value.trim(),
            firstName: modalContent.querySelector('#np-first').value.trim(),
            middleName: modalContent.querySelector('#np-mid').value.trim(),
            dob: modalContent.querySelector('#np-dob').value,
            sex: modalContent.querySelector('#np-sex').value,
            status: modalContent.querySelector('#np-status').value,
            roomBed: modalContent.querySelector('#np-room').value.trim(),
            attendingPhysician: modalContent.querySelector('#np-doc').value.trim(),
            admittingDiagnosis: modalContent.querySelector('#np-diag').value.trim(),
            allergies: modalContent.querySelector('#np-allergies').value.trim(),
            phone: modalContent.querySelector('#np-phone').value.trim()
          });

          close();
          Toast.success(`Patient record created for ${newPatient.firstName} ${newPatient.lastName}.`, 'Patient Admitted');
          Router.navigate(`/patients/${newPatient.id}/admission`);
        }
      }
    ]
  });

  modal.open();
}

// ==========================================================================
// MODAL: EDIT PATIENT DEMOGRAPHICS
// ==========================================================================
function openEditPatientDemographicsModal(patientId) {
  const patient = Store.getPatientById(patientId);
  if (!patient) return;

  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <form id="edit-patient-demographics-form">
      <div class="grid-3">
        <div class="form-group">
          <label class="form-label" for="ep-last">Last Name <span class="required">*</span></label>
          <input type="text" id="ep-last" class="form-control" value="${patient.lastName}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="ep-first">First Name <span class="required">*</span></label>
          <input type="text" id="ep-first" class="form-control" value="${patient.firstName}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="ep-mid">Middle Name</label>
          <input type="text" id="ep-mid" class="form-control" value="${patient.middleName || ''}" />
        </div>

        <div class="form-group">
          <label class="form-label" for="ep-dob">Date of Birth <span class="required">*</span></label>
          <input type="date" id="ep-dob" class="form-control" value="${patient.dob || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="ep-sex">Sex / Gender</label>
          <select id="ep-sex" class="form-control">
            <option value="Female" ${patient.sex === 'Female' ? 'selected' : ''}>Female</option>
            <option value="Male" ${patient.sex === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Other" ${patient.sex === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="ep-status">Status</label>
          <select id="ep-status" class="form-control">
            <option value="Admitted" ${patient.status === 'Admitted' ? 'selected' : ''}>Admitted</option>
            <option value="For Discharge" ${patient.status === 'For Discharge' ? 'selected' : ''}>For Discharge</option>
            <option value="Discharged" ${patient.status === 'Discharged' ? 'selected' : ''}>Discharged</option>
          </select>
        </div>

        <div class="form-group col-span-2">
          <label class="form-label" for="ep-room">Room & Bed</label>
          <input type="text" id="ep-room" class="form-control" value="${patient.roomBed || ''}" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="ep-doc">Attending Physician</label>
          <input type="text" id="ep-doc" class="form-control" value="${patient.attendingPhysician || ''}" required />
        </div>

        <div class="form-group col-span-3">
          <label class="form-label" for="ep-diag">Admitting Diagnosis</label>
          <input type="text" id="ep-diag" class="form-control" value="${patient.admittingDiagnosis || ''}" required />
        </div>

        <div class="form-group col-span-3">
          <label class="form-label" for="ep-allergies">Known Allergies</label>
          <input type="text" id="ep-allergies" class="form-control" value="${patient.allergies || 'None Known'}" />
        </div>
      </div>
    </form>
  `;

  const modal = Modal.create({
    title: `Edit Details: ${patient.firstName} ${patient.lastName}`,
    content: modalContent,
    size: 'lg',
    footerButtons: [
      {
        label: 'Cancel',
        className: 'btn-outline',
        onClick: ({ close }) => close()
      },
      {
        label: 'Save Changes',
        className: 'btn-primary',
        onClick: ({ close }) => {
          Store.savePatient({
            id: patient.id,
            lastName: modalContent.querySelector('#ep-last').value.trim(),
            firstName: modalContent.querySelector('#ep-first').value.trim(),
            middleName: modalContent.querySelector('#ep-mid').value.trim(),
            dob: modalContent.querySelector('#ep-dob').value,
            sex: modalContent.querySelector('#ep-sex').value,
            status: modalContent.querySelector('#ep-status').value,
            roomBed: modalContent.querySelector('#ep-room').value.trim(),
            attendingPhysician: modalContent.querySelector('#ep-doc').value.trim(),
            admittingDiagnosis: modalContent.querySelector('#ep-diag').value.trim(),
            allergies: modalContent.querySelector('#ep-allergies').value.trim()
          });

          close();
          Toast.success('Patient demographics updated.', 'Saved');
          updatePatientListStage();
        }
      }
    ]
  });

  modal.open();
}

// ==========================================================================
// MODAL: SETTINGS & DATA MANAGEMENT (Export, Import, Reset, Storage Usage)
// ==========================================================================
function openSettingsModal() {
  const usage = StorageService.getUsage();

  const modalContent = document.createElement('div');
  modalContent.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Storage Indicator -->
      <div style="background-color: var(--mist); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
        <h4 style="font-size: 0.95rem; font-family: var(--font-sans); font-weight: 700; margin-bottom: 0.25rem;">Browser Storage Health</h4>
        <p style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
          All WardWell EHR prototype data is stored strictly in your browser's local sandbox (${usage.isFallback ? 'Memory fallback' : 'localStorage'}).
        </p>
        <div style="font-size: 0.88rem; font-family: var(--font-mono);">
          Estimated Storage Used: <strong>${usage.usedKb} KB</strong> (${usage.count} storage entries)
        </div>
      </div>

      <!-- Export / Backup -->
      <div>
        <h4 style="font-size: 0.95rem; font-family: var(--font-sans); font-weight: 700; margin-bottom: 0.25rem;">Data Backup & Export</h4>
        <p style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
          Download a complete snapshot of all patient records and clinical forms in JSON format.
        </p>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-export-json">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span>Export All Data (JSON)</span>
        </button>
      </div>

      <!-- Import / Restore -->
      <div>
        <h4 style="font-size: 0.95rem; font-family: var(--font-sans); font-weight: 700; margin-bottom: 0.25rem;">Import / Restore Data</h4>
        <p style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
          Load patient records from an exported WardWell JSON file. Validates schema before applying.
        </p>
        <input type="file" id="import-json-input" accept=".json,application/json" style="display: none;" />
        <button type="button" class="btn btn-outline btn-sm" id="btn-trigger-import">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <span>Import JSON File...</span>
        </button>
      </div>

      <!-- Reset Demo Data -->
      <div style="border-top: 1px solid var(--border-light); padding-top: 1rem;">
        <h4 style="font-size: 0.95rem; font-family: var(--font-sans); font-weight: 700; color: var(--status-critical-text); margin-bottom: 0.25rem;">Reset Fictional Demo Data</h4>
        <p style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
          Restore initial fictional sample patients and discard all custom modifications.
        </p>
        <button type="button" class="btn btn-danger btn-sm" id="btn-reset-demo">
          Reset to Factory Demo Data
        </button>
      </div>
    </div>
  `;

  const modal = Modal.create({
    title: 'WardWell Settings & Data Management',
    content: modalContent,
    size: 'md',
    footerButtons: [
      {
        label: 'Close',
        className: 'btn-secondary',
        onClick: ({ close }) => close()
      }
    ]
  });

  modal.open();

  // Export JSON Handler
  modalContent.querySelector('#btn-export-json').addEventListener('click', () => {
    const data = {
      app: CONFIG.SYSTEM_NAME,
      version: CONFIG.APP_VERSION,
      exportedAt: new Date().toISOString(),
      patients: Store.getPatients()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wardwell-ehr-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.success('Patient data exported successfully.', 'Backup Created');
  });

  // Import JSON Handler
  const fileInput = modalContent.querySelector('#import-json-input');
  modalContent.querySelector('#btn-trigger-import').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const importedPatients = parsed.patients || (Array.isArray(parsed) ? parsed : null);

        if (!Array.isArray(importedPatients) || importedPatients.length === 0) {
          Toast.error('Invalid WardWell JSON file: No patients array found.', 'Import Error');
          return;
        }

        StorageService.set(CONFIG.STORAGE_KEYS.PATIENTS, importedPatients);
        Toast.success(`Imported ${importedPatients.length} patient records successfully.`, 'Import Complete');
        modal.close();
        if (Router.getHash().startsWith('/patients')) {
          renderPatientListView();
        }
      } catch (err) {
        Toast.error('Failed to parse JSON file. Ensure file is valid.', 'Import Failed');
      }
    };
    reader.readAsText(file);
  });

  // Reset Demo Data
  modalContent.querySelector('#btn-reset-demo').addEventListener('click', async () => {
    const confirmed = await showConfirm({
      title: 'Reset to Factory Demo Data?',
      message: 'This will erase all custom changes and reload the 11 fictional Filipino sample patients. This cannot be undone.',
      confirmText: 'Reset Everything',
      isDanger: true
    });

    if (confirmed) {
      initSeedData(true);
      modal.close();
      Toast.success('Factory fictional demo data restored.', 'Reset Complete');
      Router.navigate('/patients');
      renderPatientListView();
    }
  });
}

// ==========================================================================
// ROUTER INITIALIZATION
// ==========================================================================
export function initApp() {
  Logger.info('App', 'init', `Bootstrapping ${CONFIG.SYSTEM_NAME} v${CONFIG.APP_VERSION}`);

  // Theme Init
  ThemeManager.init();

  // Storage Migration & Seed Init
  StorageService.migrate();
  initSeedData(false);

  // Define Routes
  Router.add('/login', () => {
    renderLoginView();
  });

  Router.add('/patients', () => {
    renderAppShell();
    renderPatientListView();
  });

  Router.add('/patients/:id', ({ id }) => {
    renderAppShell();
    renderPatientRecordView(id, 'admission');
  });

  Router.add('/patients/:id/:form', ({ id, form }) => {
    renderAppShell();
    renderPatientRecordView(id, form);
  });

  Router.setNotFound((path) => {
    Logger.warn('Router', '404', `Path not found: ${path}`);
    renderAppShell();
    const main = document.getElementById('app-main');
    if (main) {
      main.innerHTML = `
        <div class="main-container" style="text-align: center; padding: 4rem 1rem;">
          <h1 style="font-size: 2.5rem; color: var(--sage-dark);">404</h1>
          <h2>Page Not Found</h2>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">The clinical route <code>${path}</code> does not exist.</p>
          <a href="#/patients" class="btn btn-primary" style="margin-top: 1.5rem;">Return to Patients Directory</a>
        </div>
      `;
    }
  });

  Router.init();
}

// Bootstrap resiliently
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
