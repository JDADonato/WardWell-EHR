// WardWell EHR - Common Form Header & Helpers
import { CONFIG } from '../config.js';
import { formatDate } from '../utils/dates.js';

export function renderFormStandardHeader(patient, formTitle, formCode = 'WW-FRM-01', options = {}) {
  const fullName = `${patient.lastName}, ${patient.firstName} ${patient.middleName || ''}`.trim();
  const ageSex = `${patient.age || '—'} / ${patient.sex || '—'}`;
  const hospNo = patient.hospitalNo || '—';
  const roomBed = patient.roomBed || '—';
  const admDate = formatDate(patient.admissionDate, 'short');
  const phys = patient.attendingPhysician || '—';

  return `
    <header class="form-header-standard">
      <div class="form-header-top">
        <div class="form-header-hospital">
          <img src="assets/logo-icon.svg" class="form-header-logo color-logo" alt="WardWell Hospital Logo" />
          <img src="assets/logo-mono.svg" class="form-header-logo mono-logo print-only" alt="WardWell Hospital Logo" />
          <div class="form-header-hosp-info">
            <h2>${CONFIG.HOSPITAL_NAME}</h2>
            <p>${CONFIG.HOSPITAL_ADDRESS}</p>
          </div>
        </div>
        <div class="form-header-code-block">
          <div>FORM CODE: <strong>${formCode}</strong></div>
          <div>REV: 2026.1 | PAGE 1 OF 1</div>
        </div>
      </div>

      <div class="form-title-banner">
        <h1>${formTitle}</h1>
      </div>

      <!-- Unified Clinical Patient Identification Strip -->
      <div class="form-patient-strip">
        <div class="strip-item">
          <span class="strip-label">Patient Name</span>
          <span class="strip-value" title="${fullName}">${fullName}</span>
        </div>
        <div class="strip-item">
          <span class="strip-label">Hospital No.</span>
          <span class="strip-value">${hospNo}</span>
        </div>
        <div class="strip-item">
          <span class="strip-label">Age / Sex</span>
          <span class="strip-value">${ageSex}</span>
        </div>
        <div class="strip-item">
          <span class="strip-label">Room & Bed</span>
          <span class="strip-value">${roomBed}</span>
        </div>
        <div class="strip-item">
          <span class="strip-label">Admission Date</span>
          <span class="strip-value">${admDate}</span>
        </div>
        ${options.physicianSlot ? options.physicianSlot : `
        <div class="strip-item">
          <span class="strip-label">Attending Physician</span>
          <span class="strip-value" title="${phys}">${phys}</span>
        </div>
        `}
      </div>
    </header>
  `;
}
