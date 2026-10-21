// Form 11: Discharge Planning Form
import { renderFormStandardHeader } from './common.js';
import { formatDate, getCurrentISODate } from '../utils/dates.js';

export const DischargeForm = {
  renderView(patient, onEdit, onPrint) {
    const d = patient.forms?.discharge || {};
    const container = document.createElement('div');
    container.className = 'form-paper';

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Discharge Planning & Instructions Form', 'WW-DIS-11')}

      <!-- 1. Dates & Destination -->
      <section class="form-section">
        <h3 class="form-section-title">1. Discharge Timeline & Destination</h3>
        <div class="grid-3">
          <div class="view-field">
            <span class="view-label">Anticipated Date of Discharge</span>
            <span class="view-value">${formatDate(d.anticipatedDate, 'short')}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Confirmed Date of Discharge</span>
            <span class="view-value font-mono"><strong>${formatDate(d.confirmedDate, 'short')}</strong></span>
          </div>
          <div class="view-field">
            <span class="view-label">Destination Post Discharge</span>
            <span class="view-value">${d.destination || 'Home'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Discharge Status</span>
            <span class="view-value">${d.dischargeStatus || 'Self Care'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Family / Facility Contact Notified</span>
            <span class="view-value">${d.personNotified || patient.emergencyContact?.name || 'Spouse / Family notified'}</span>
          </div>
        </div>
      </section>

      <!-- 2. Special Needs & Functional Assistance -->
      <section class="form-section">
        <h3 class="form-section-title">2. Special Needs Assistance Assessment</h3>
        <div class="view-field" style="margin-bottom: 0.75rem;">
          <span class="view-label">Assistance Required in ADLs</span>
          <div class="view-tag-list">
            ${(d.specialNeedsList && d.specialNeedsList.length > 0)
              ? d.specialNeedsList.map(item => `<span class="view-tag">${item}</span>`).join('')
              : '<span class="view-tag">Independent in Basic ADLs</span>'
            }
          </div>
        </div>
        <div class="view-field">
          <span class="view-label">Special Functional Instructions</span>
          <span class="view-value">${d.specialNeedsNotes || 'Encouraged gradual return to daily activities; avoid heavy lifting > 10 lbs for 2 weeks.'}</span>
        </div>
      </section>

      <!-- 3. Nutritional Plan -->
      <section class="form-section">
        <h3 class="form-section-title">3. Nutritional & Diet Plan</h3>
        <div class="grid-2">
          <div class="view-field">
            <span class="view-label">Diet Prescribed</span>
            <span class="view-value font-mono"><strong>${d.dietPrescribed || 'Regular Diet / Low Sodium as tolerated'}</strong></span>
          </div>
          <div class="view-field">
            <span class="view-label">Dietary Supplements Recommended</span>
            <span class="view-value">${d.dietarySupplements || 'Multivitamins / Oral rehydration as needed'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Dietary Instructions Discussed With</span>
            <span class="view-value">${d.dietDiscussedWith || 'Patient & Family Member'}</span>
          </div>
        </div>
      </section>

      <!-- 4. Take-Home Medications & Instructions -->
      <section class="form-section">
        <h3 class="form-section-title">4. Take-Home Medications & Home Care</h3>
        <div class="grid-2">
          <div class="view-field col-span-2">
            <span class="view-label">Medications to Take Home (Name, Dose, Frequency, Duration)</span>
            <span class="view-value" style="white-space: pre-line; font-family: var(--font-mono); font-size: 0.88rem;">
              ${d.takeHomeMeds || 'Prescription medications as outlined on physician discharge summary.'}
            </span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Wound Care / Catheter / Device Instructions</span>
            <span class="view-value">${d.woundCare || 'Keep dressing clean and dry. Change dressing every other day or if soiled.'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Warning Signs / When to Return to Emergency</span>
            <span class="view-value" style="color: var(--status-critical-text); font-weight: 500;">
              ${d.warningSigns || 'High grade fever (> 38.5C), severe difficulty breathing, sudden chest pain, excessive wound drainage, or bleeding.'}
            </span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Follow-Up Appointment</span>
            <span class="view-value font-mono"><strong>${d.followUpDate || '1 week post-discharge at WardWell Outpatient Clinic'}</strong></span>
          </div>
        </div>
      </section>

      <!-- 5. Nurse Signatures -->
      <section class="form-section">
        <h3 class="form-section-title">5. Clinical Nurse Accountability Signatures</h3>
        <div class="grid-2">
          <div class="signature-card">
            <span class="signature-label">Assigned Nurse (Admission)</span>
            <div style="font-family: var(--font-serif); font-size: 1.1rem; color: var(--sage-dark); margin: 0.5rem 0;">
              ${d.nurseAdmission || 'Staff Nurse on Duty, RN'}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">
              ID: ${d.nurseAdmissionId || 'WW-RN-4819'} | Signed upon admission initiation
            </div>
          </div>
          <div class="signature-card">
            <span class="signature-label">Assigned Nurse (Discharge)</span>
            <div style="font-family: var(--font-serif); font-size: 1.1rem; color: var(--sage-dark); margin: 0.5rem 0;">
              ${d.nurseDischarge || 'Discharge Coordinator, RN'}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">
              ID: ${d.nurseDischargeId || 'WW-RN-3920'} | Confirmed at discharge
            </div>
          </div>
        </div>
      </section>
    `;

    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    const d = patient.forms?.discharge || {};
    const container = document.createElement('div');
    container.className = 'form-paper';

    const selectedNeeds = d.specialNeedsList || [];

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Discharge Planning Form (Edit Mode)', 'WW-DIS-11')}

      <form id="discharge-form">
        <!-- 1. Dates & Destination -->
        <section class="form-section">
          <h3 class="form-section-title">1. Discharge Timeline & Destination</h3>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label" for="dis-anticDate">Anticipated Date of Discharge</label>
              <input type="date" id="dis-anticDate" class="form-control" value="${d.anticipatedDate || getCurrentISODate()}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="dis-confDate">Confirmed Date of Discharge</label>
              <input type="date" id="dis-confDate" class="form-control" value="${d.confirmedDate || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="dis-dest">Destination Post Discharge</label>
              <select id="dis-dest" class="form-control">
                <option value="Home" ${d.destination === 'Home' ? 'selected' : ''}>Home</option>
                <option value="Transfer to Other Hospital" ${d.destination === 'Transfer to Other Hospital' ? 'selected' : ''}>Transfer to Other Hospital</option>
                <option value="Rehabilitation Facility" ${d.destination === 'Rehabilitation Facility' ? 'selected' : ''}>Rehabilitation Facility</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="dis-status">Discharge Status</label>
              <select id="dis-status" class="form-control">
                <option value="Self Care" ${d.dischargeStatus === 'Self Care' ? 'selected' : ''}>Self Care</option>
                <option value="Family Home Care" ${d.dischargeStatus === 'Family Home Care' ? 'selected' : ''}>Family Home Care</option>
                <option value="Professional Home Assistance" ${d.dischargeStatus === 'Professional Home Assistance' ? 'selected' : ''}>Professional Home Assistance</option>
              </select>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="dis-notified">Person / Facility Contact Notified</label>
              <input type="text" id="dis-notified" class="form-control" value="${d.personNotified || ''}" placeholder="Name and relationship" />
            </div>
          </div>
        </section>

        <!-- 2. Special Needs Checklist -->
        <section class="form-section">
          <h3 class="form-section-title">2. Special Needs Assistance Checklist</h3>
          <div class="grid-3" style="margin-bottom: 0.75rem;">
            <label class="checkbox-label"><input type="checkbox" name="dis-needs" value="Medication Assistance" ${selectedNeeds.includes('Medication Assistance') ? 'checked' : ''} /> Medication Assistance</label>
            <label class="checkbox-label"><input type="checkbox" name="dis-needs" value="Bathing Assistance" ${selectedNeeds.includes('Bathing Assistance') ? 'checked' : ''} /> Bathing Assistance</label>
            <label class="checkbox-label"><input type="checkbox" name="dis-needs" value="Eating Assistance" ${selectedNeeds.includes('Eating Assistance') ? 'checked' : ''} /> Eating Assistance</label>
            <label class="checkbox-label"><input type="checkbox" name="dis-needs" value="Walking / Ambulation" ${selectedNeeds.includes('Walking / Ambulation') ? 'checked' : ''} /> Walking / Ambulation</label>
            <label class="checkbox-label"><input type="checkbox" name="dis-needs" value="Dressing Assistance" ${selectedNeeds.includes('Dressing Assistance') ? 'checked' : ''} /> Dressing Assistance</label>
            <label class="checkbox-label"><input type="checkbox" name="dis-needs" value="Toileting Assistance" ${selectedNeeds.includes('Toileting Assistance') ? 'checked' : ''} /> Toileting Assistance</label>
          </div>
          <div class="form-group">
            <label class="form-label" for="dis-needsNotes">Functional Notes / Precautions</label>
            <textarea id="dis-needsNotes" class="form-control" rows="2">${d.specialNeedsNotes || ''}</textarea>
          </div>
        </section>

        <!-- 3. Nutritional Plan -->
        <section class="form-section">
          <h3 class="form-section-title">3. Nutritional Plan</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="dis-diet">Diet Prescribed</label>
              <input type="text" id="dis-diet" class="form-control" value="${d.dietPrescribed || 'Regular Diet'}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="dis-supp">Dietary Supplement Recommended</label>
              <input type="text" id="dis-supp" class="form-control" value="${d.dietarySupplements || ''}" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="dis-dietDisc">Diet Discussed With</label>
              <select id="dis-dietDisc" class="form-control">
                <option value="Patient & Family Member" ${d.dietDiscussedWith === 'Patient & Family Member' ? 'selected' : ''}>Patient & Family Member</option>
                <option value="Patient Only" ${d.dietDiscussedWith === 'Patient Only' ? 'selected' : ''}>Patient Only</option>
                <option value="Family Member / Caregiver" ${d.dietDiscussedWith === 'Family Member / Caregiver' ? 'selected' : ''}>Family Member / Caregiver</option>
              </select>
            </div>
          </div>
        </section>

        <!-- 4. Home Meds & Care -->
        <section class="form-section">
          <h3 class="form-section-title">4. Take-Home Medications & Instructions</h3>
          <div class="grid-2">
            <div class="form-group col-span-2">
              <label class="form-label" for="dis-meds">Medications to Take Home</label>
              <textarea id="dis-meds" class="form-control" rows="3" placeholder="Drug name, dose, frequency, duration">${d.takeHomeMeds || ''}</textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="dis-wound">Wound / Device Care</label>
              <input type="text" id="dis-wound" class="form-control" value="${d.woundCare || ''}" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="dis-warning">Warning Signs (Red Flags)</label>
              <input type="text" id="dis-warning" class="form-control" value="${d.warningSigns || ''}" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="dis-fu">Follow-Up Appointment Details</label>
              <input type="text" id="dis-fu" class="form-control" value="${d.followUpDate || ''}" placeholder="e.g. Oct 28 at Outpatient Clinic Room 304" />
            </div>
          </div>
        </section>

        <!-- 5. Nurse Signatures -->
        <section class="form-section">
          <h3 class="form-section-title">5. Assigned Nurse Signatures</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="dis-nurseAdm">Assigned Nurse (Admission)</label>
              <input type="text" id="dis-nurseAdm" class="form-control" value="${d.nurseAdmission || 'Staff Nurse, RN'}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="dis-nurseDis">Assigned Nurse (Discharge)</label>
              <input type="text" id="dis-nurseDis" class="form-control" value="${d.nurseDischarge || 'Discharge Nurse, RN'}" />
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" id="btn-cancel-dis">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-dis">Save Discharge Plan</button>
        </div>
      </form>
    `;

    container.querySelector('#discharge-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const checkedNeeds = Array.from(container.querySelectorAll('input[name="dis-needs"]:checked')).map(el => el.value);

      const updated = {
        anticipatedDate: container.querySelector('#dis-anticDate').value,
        confirmedDate: container.querySelector('#dis-confDate').value,
        destination: container.querySelector('#dis-dest').value,
        dischargeStatus: container.querySelector('#dis-status').value,
        personNotified: container.querySelector('#dis-notified').value.trim(),
        specialNeedsList: checkedNeeds,
        specialNeedsNotes: container.querySelector('#dis-needsNotes').value.trim(),
        dietPrescribed: container.querySelector('#dis-diet').value.trim(),
        dietarySupplements: container.querySelector('#dis-supp').value.trim(),
        dietDiscussedWith: container.querySelector('#dis-dietDisc').value,
        takeHomeMeds: container.querySelector('#dis-meds').value.trim(),
        woundCare: container.querySelector('#dis-wound').value.trim(),
        warningSigns: container.querySelector('#dis-warning').value.trim(),
        followUpDate: container.querySelector('#dis-fu').value.trim(),
        nurseAdmission: container.querySelector('#dis-nurseAdm').value.trim(),
        nurseDischarge: container.querySelector('#dis-nurseDis').value.trim()
      };

      onSave(updated);
    });

    container.querySelector('#btn-cancel-dis').addEventListener('click', onCancel);

    return container;
  }
};
