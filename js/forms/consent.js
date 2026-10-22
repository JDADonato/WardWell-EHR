// Form 3: Informed Consent Form
import { renderFormStandardHeader, renderImmutableNotice } from './common.js';
import { formatDate, getCurrentISODateTime } from '../utils/dates.js';
import { SignaturePad } from '../ui/signature-pad.js';

export const ConsentForm = {
  renderView(patient, onEdit, onPrint) {
    const c = patient.forms?.consent || {};
    const fullName = `${patient.lastName}, ${patient.firstName} ${patient.middleName || ''}`.trim();

    const container = document.createElement('div');
    container.className = 'form-paper';
    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Informed Consent for Medical Treatment / Procedure', 'WW-CNS-03')}

      <!-- Step 1: Patient Information -->
      <section class="form-section">
        <h3 class="form-section-title">Step 1: Patient Information & Treatment Description</h3>
        <p style="font-size: 0.92rem; line-height: 1.6; margin-bottom: 1rem; color: var(--text-primary);">
          I, <u><strong>${fullName}</strong></u>, residing at <u>${patient.address || '—'}, ${patient.cityStateZip || ''}</u>, hereby give my free and voluntary consent to the following medical treatment / procedure:
        </p>
        <div class="grid-2">
          <div class="view-field col-span-2">
            <span class="view-label">Procedure / Treatment Name</span>
            <span class="view-value font-mono"><strong>${c.procedureName || 'Routine Inpatient Medical Care, IV Therapy, and Diagnostic Workup'}</strong></span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Description & Purpose</span>
            <span class="view-value">${c.procedureDescription || 'Administration of prescribed intravenous and oral pharmacotherapy, diagnostic blood collection, radiological examinations, and bedside clinical nursing care.'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Scheduled Date & Time</span>
            <span class="view-value">${formatDate(c.procedureDateTime || patient.admissionDate, 'datetime')}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Location / Department</span>
            <span class="view-value">${c.procedureLocation || patient.roomBed || 'WardWell Medical Ward'}</span>
          </div>
        </div>
      </section>

      <!-- Step 2: Medical Provider Information -->
      <section class="form-section">
        <h3 class="form-section-title">Step 2: Medical Provider Information</h3>
        <div class="grid-3">
          <div class="view-field">
            <span class="view-label">Attending Medical Provider</span>
            <span class="view-value">${c.providerName || patient.attendingPhysician || 'Dr. Alicia Ramos, MD'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">PRC License Number</span>
            <span class="view-value font-mono">${c.providerLicense || 'PRC-0089241'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Provider Hospital Address</span>
            <span class="view-value">WardWell General Hospital, Department of Medicine</span>
          </div>
        </div>
      </section>

      <!-- Step 3: Emergency Contact -->
      <section class="form-section">
        <h3 class="form-section-title">Step 3: Emergency Contact</h3>
        <div class="grid-3">
          <div class="view-field">
            <span class="view-label">Emergency Contact Name</span>
            <span class="view-value">${c.emergencyContactName || patient.emergencyContact?.name || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Relationship</span>
            <span class="view-value">${c.emergencyContactRel || patient.emergencyContact?.relationship || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Contact Phone</span>
            <span class="view-value">${c.emergencyContactPhone || patient.emergencyContact?.phone || '—'}</span>
          </div>
        </div>
      </section>

      <!-- Step 4: Consent & Disclaimers -->
      <section class="form-section">
        <h3 class="form-section-title">Step 4: Consent and Disclaimers</h3>
        <div style="background-color: var(--mist); padding: 1rem; border-radius: var(--radius-md); font-size: 0.86rem; line-height: 1.6; color: var(--text-secondary); border: 1px solid var(--border-light);">
          <p style="margin-bottom: 0.5rem;">
            I understand that there are risks, foreseeable discomforts, and potential complications associated with any medical procedure and treatment, and that the Medical Provider has explained these risks, expected benefits, and reasonable alternatives to me in language I understand.
          </p>
          <p>
            I acknowledge that no guarantees or assurances have been made to me regarding the exact results or outcome of this treatment.
          </p>
        </div>
      </section>

      <!-- Step 5: Signatures -->
      <section class="form-section">
        <h3 class="form-section-title">Step 5: Signatures</h3>
        <div class="grid-3">
          <!-- Patient Signature -->
          <div class="signature-card">
            <span class="signature-label">Patient / Guardian Signature</span>
            <div style="height: 90px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color);">
              ${c.patientSignature ? `<img src="${c.patientSignature}" alt="Patient Signature" style="max-height: 80px; max-width: 100%;" />` : `<span style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--sage-dark);">${fullName} (Digital Ack)</span>`}
            </div>
            <span style="font-size: 0.78rem; color: var(--text-muted); text-align: center;">Date: ${formatDate(c.signedDate || patient.admissionDate, 'short')}</span>
          </div>

          <!-- Physician Signature -->
          <div class="signature-card">
            <span class="signature-label">Medical Provider Signature</span>
            <div style="height: 90px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color);">
              ${c.providerSignature ? `<img src="${c.providerSignature}" alt="Provider Signature" style="max-height: 80px; max-width: 100%;" />` : `<span style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--sage-dark);">${c.providerName || patient.attendingPhysician || 'Attending MD'}</span>`}
            </div>
            <span style="font-size: 0.78rem; color: var(--text-muted); text-align: center;">Date: ${formatDate(c.signedDate || patient.admissionDate, 'short')}</span>
          </div>

          <!-- Witness Signature -->
          <div class="signature-card">
            <span class="signature-label">Witness Signature</span>
            <div style="height: 90px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color);">
              ${c.witnessSignature ? `<img src="${c.witnessSignature}" alt="Witness Signature" style="max-height: 80px; max-width: 100%;" />` : `<span style="font-family: var(--font-serif); font-size: 1.15rem; color: var(--sage-dark);">${c.witnessName || 'Nurse on Duty, RN'}</span>`}
            </div>
            <span style="font-size: 0.78rem; color: var(--text-muted); text-align: center;">Date: ${formatDate(c.signedDate || patient.admissionDate, 'short')}</span>
          </div>
        </div>
      </section>
    `;
    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    const c = patient.forms?.consent || {};
    const fullName = `${patient.lastName}, ${patient.firstName} ${patient.middleName || ''}`.trim();
    const container = document.createElement('div');
    container.className = 'form-paper';

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Informed Consent Form (Edit Mode)', 'WW-CNS-03')}

      ${renderImmutableNotice("Informed Consent Record", "Previously executed informed consent details are legally binding and cannot be altered. Provider name can still be updated.")}

      <form id="consent-form">
        <!-- Step 1: Procedure Details -->
        <section class="form-section">
          <h3 class="form-section-title">Step 1: Patient Information & Procedure Details</h3>
          <div class="grid-2">
            <div class="form-group col-span-2">
              <label class="form-label" for="c-procName">Procedure / Treatment Name <span class="required">*</span></label>
              <input type="text" id="c-procName" class="form-control" value="${c.procedureName || 'Routine Inpatient Medical Care & IV Therapy'}" required />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="c-procDesc">Procedure Description & Clinical Purpose</label>
              <textarea id="c-procDesc" class="form-control" rows="2">${c.procedureDescription || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="c-procDate">Scheduled Date & Time</label>
              <input type="datetime-local" id="c-procDate" class="form-control" value="${c.procedureDateTime || patient.admissionDate || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="c-procLoc">Location / Ward</label>
              <input type="text" id="c-procLoc" class="form-control" value="${c.procedureLocation || patient.roomBed || ''}" />
            </div>
          </div>
        </section>

        <!-- Step 2: Medical Provider -->
        <section class="form-section">
          <h3 class="form-section-title">Step 2: Medical Provider Information</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="c-providerName">Medical Provider Name <span class="required">*</span></label>
              <input type="text" id="c-providerName" class="form-control" value="${c.providerName || patient.attendingPhysician || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="c-providerLicense">PRC License No.</label>
              <input type="text" id="c-providerLicense" class="form-control" value="${c.providerLicense || 'PRC-0089241'}" />
            </div>
          </div>
        </section>

        <!-- Step 3: Emergency Contact -->
        <section class="form-section">
          <h3 class="form-section-title">Step 3: Emergency Contact</h3>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label" for="c-ecName">Contact Name</label>
              <input type="text" id="c-ecName" class="form-control" value="${c.emergencyContactName || patient.emergencyContact?.name || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="c-ecRel">Relationship</label>
              <input type="text" id="c-ecRel" class="form-control" value="${c.emergencyContactRel || patient.emergencyContact?.relationship || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="c-ecPhone">Phone Number</label>
              <input type="tel" id="c-ecPhone" class="form-control" value="${c.emergencyContactPhone || patient.emergencyContact?.phone || ''}" />
            </div>
          </div>
        </section>

        <!-- Step 4: Disclaimers Checkbox -->
        <section class="form-section">
          <h3 class="form-section-title">Step 4: Consent & Disclaimers Acknowledgment</h3>
          <label class="checkbox-label" style="align-items: flex-start; gap: 0.75rem; background-color: var(--mist); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <input type="checkbox" id="c-ack" ${c.patientAcknowledged !== false ? 'checked' : ''} style="margin-top: 3px;" required />
            <span>I confirm that the procedure, potential risks, alternatives, and expected course of treatment have been discussed and explained thoroughly to the patient/guardian.</span>
          </label>
        </section>

        <!-- Step 5: Interactive Signature Pads -->
        <section class="form-section">
          <h3 class="form-section-title">Step 5: Digital Signature Pads</h3>
          <div class="grid-2">
            <!-- Patient Canvas Pad -->
            <div class="signature-card">
              <div class="signature-actions">
                <span class="signature-label">Patient / Guardian Signature <span class="required">*</span></span>
                <button type="button" class="btn btn-sm btn-ghost" id="clear-patient-sig">Clear</button>
              </div>
              <div class="signature-canvas-wrap">
                <canvas id="patient-sig-canvas" class="signature-canvas"></canvas>
                <div class="signature-line-guide"></div>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Sign with finger or mouse inside the box</span>
            </div>

            <!-- Provider Canvas Pad -->
            <div class="signature-card">
              <div class="signature-actions">
                <span class="signature-label">Medical Provider Signature <span class="required">*</span></span>
                <button type="button" class="btn btn-sm btn-ghost" id="clear-provider-sig">Clear</button>
              </div>
              <div class="signature-canvas-wrap">
                <canvas id="provider-sig-canvas" class="signature-canvas"></canvas>
                <div class="signature-line-guide"></div>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Sign with finger or mouse inside the box</span>
            </div>
          </div>
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label" for="c-witnessName">Witnessing Nurse Name</label>
            <input type="text" id="c-witnessName" class="form-control" value="${c.witnessName || 'Staff Nurse on Duty, RN'}" />
          </div>
        </section>

        <!-- Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" id="btn-cancel-consent">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-consent">Save Informed Consent</button>
        </div>
      </form>
    `;

    // Lock previously populated fields to preserve medical record immutability
    container.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.id === 'c-providerName') return; // Medical provider / doctor name can always be updated
      const val = el.type === 'checkbox' ? el.checked : el.value?.trim();
      if (val && val !== '') {
        el.setAttribute('disabled', 'true');
        el.setAttribute('title', 'Permanent record: Previously recorded consent entry cannot be altered.');
        el.classList.add('field-locked');
      }
    });

    // Instantiate signature pads after attached to DOM
    let patientPad = null;
    let providerPad = null;

    setTimeout(() => {
      const pCanvas = container.querySelector('#patient-sig-canvas');
      const docCanvas = container.querySelector('#provider-sig-canvas');
      if (pCanvas) {
        patientPad = new SignaturePad(pCanvas);
        if (c.patientSignature) patientPad.fromDataURL(c.patientSignature);
      }
      if (docCanvas) {
        providerPad = new SignaturePad(docCanvas);
        if (c.providerSignature) providerPad.fromDataURL(c.providerSignature);
      }
    }, 100);

    container.querySelector('#clear-patient-sig')?.addEventListener('click', () => patientPad?.clear());
    container.querySelector('#clear-provider-sig')?.addEventListener('click', () => providerPad?.clear());

    container.querySelector('#consent-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const pSigUrl = patientPad?.toDataURL() || c.patientSignature || '';
      const docSigUrl = providerPad?.toDataURL() || c.providerSignature || '';

      const updated = {
        procedureName: (container.querySelector('#c-procName')?.value || c.procedureName || '').trim(),
        procedureDescription: (container.querySelector('#c-procDesc')?.value || c.procedureDescription || '').trim(),
        procedureDateTime: container.querySelector('#c-procDate')?.value || c.procedureDateTime,
        procedureLocation: (container.querySelector('#c-procLoc')?.value || c.procedureLocation || '').trim(),
        providerName: (container.querySelector('#c-providerName')?.value || c.providerName || patient.attendingPhysician || '').trim(),
        providerLicense: (container.querySelector('#c-providerLicense')?.value || c.providerLicense || '').trim(),
        emergencyContactName: (container.querySelector('#c-ecName')?.value || c.emergencyContactName || '').trim(),
        emergencyContactRel: (container.querySelector('#c-ecRel')?.value || c.emergencyContactRel || '').trim(),
        emergencyContactPhone: (container.querySelector('#c-ecPhone')?.value || c.emergencyContactPhone || '').trim(),
        patientAcknowledged: container.querySelector('#c-ack') ? container.querySelector('#c-ack').checked : !!c.patientAcknowledged,
        witnessName: (container.querySelector('#c-witnessName')?.value || c.witnessName || '').trim(),
        patientSignature: pSigUrl,
        providerSignature: docSigUrl,
        signedDate: c.signedDate || getCurrentISODateTime()
      };

      onSave(updated);
    });

    container.querySelector('#btn-cancel-consent').addEventListener('click', onCancel);

    return container;
  }
};
