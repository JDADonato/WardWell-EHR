// Form 2: Nursing Assessment Form
import { renderFormStandardHeader, renderImmutableNotice } from './common.js';
import { formatDate } from '../utils/dates.js';

export const NursingAssessmentForm = {
  renderView(patient, onEdit, onPrint) {
    const na = patient.forms?.nursingAssessment || {};

    const container = document.createElement('div');
    container.className = 'form-paper';
    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Nursing Assessment Form', 'WW-NUR-02')}

      <!-- 1. Social History -->
      <section class="form-section">
        <h3 class="form-section-title">A. Social History</h3>
        <div class="grid-2">
          <div class="view-field">
            <span class="view-label">Smoking Status</span>
            <span class="view-value">${na.smokingStatus || 'Never'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Alcohol Use</span>
            <span class="view-value">${na.alcoholUse || 'None'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Substance Use</span>
            <span class="view-value">${na.substanceUse || 'Denies'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Living Arrangements</span>
            <span class="view-value">${na.livingArrangements || 'Lives with family'}</span>
          </div>
        </div>
      </section>

      <!-- 2. Physical Assessment: General Appearance -->
      <section class="form-section">
        <h3 class="form-section-title">B. General Appearance & Survey</h3>
        <div class="grid-4">
          <div class="view-field">
            <span class="view-label">Conscious State</span>
            <span class="view-value"><strong>${na.consciousState || 'Alert'}</strong></span>
          </div>
          <div class="view-field">
            <span class="view-label">Mobility</span>
            <span class="view-value">${na.mobility || 'Independent'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Nutritional Status</span>
            <span class="view-value">${na.nutritionalStatus || 'Well-nourished'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Hygiene</span>
            <span class="view-value">${na.hygiene || 'Clean'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Glasgow Coma Scale (GCS)</span>
            <span class="view-value">${na.gcs || '15 / 15 (E4 V5 M6)'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Allergies Noted</span>
            <span class="view-value ${patient.allergies && !patient.allergies.toLowerCase().includes('none') ? 'allergy-pill' : ''}">
              ${patient.allergies || 'None Known'}
            </span>
          </div>
        </div>
      </section>

      <!-- 3. System-Specific Examination -->
      <section class="form-section">
        <h3 class="form-section-title">C. System-Specific Examination</h3>
        <div class="grid-2">
          <div class="view-field col-span-2">
            <span class="view-label">Cardiovascular (Heart sounds, rhythm, murmurs)</span>
            <span class="view-value">${na.cardiovascular || 'Normal S1/S2, regular rate and rhythm, no murmurs'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Respiratory (Breath sounds, respiratory effort, accessory muscle use)</span>
            <span class="view-value">${na.respiratory || 'Clear breath sounds bilateral, non-labored, no wheezing or stridor'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Gastrointestinal (Bowel sounds, tenderness, distention)</span>
            <span class="view-value">${na.gastrointestinal || 'Normoactive bowel sounds, abdomen soft, non-tender, non-distended'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">HEENT & Neurological</span>
            <span class="view-value">${na.heent || 'Pupils equal, round and reactive to light (PERRLA), speech coherent'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Genitourinary & Elimination</span>
            <span class="view-value">${na.genitourinary || 'Voiding spontaneously, clear yellow urine, no dysuria'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Integumentary & Musculoskeletal (Skin integrity, turgor, edema, ROM)</span>
            <span class="view-value">${na.integumentary || 'Warm and dry, good skin turgor, no pressure injuries, full range of motion'}</span>
          </div>
        </div>
      </section>

      <!-- 4. Pain Assessment & Risk Screening -->
      <section class="form-section">
        <h3 class="form-section-title">D. Pain Assessment & Risk Screening</h3>
        <div class="grid-3">
          <div class="view-field">
            <span class="view-label">Pain Location</span>
            <span class="view-value">${na.painLocation || 'None'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Pain Scale (0 - 10)</span>
            <span class="view-value">${na.painScale ? `${na.painScale} / 10` : '0 / 10 (No pain)'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Pain Character</span>
            <span class="view-value">${na.painCharacter || 'N/A'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Morse Fall Risk Assessment</span>
            <span class="view-value">${na.fallRisk || 'Low Risk (Score < 25)'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Braden Pressure Injury Risk</span>
            <span class="view-value">${na.pressureRisk || 'No Risk (Score 19-23)'}</span>
          </div>
        </div>
      </section>

      <!-- 5. Nurse Summary & Signature -->
      <section class="form-section">
        <h3 class="form-section-title">E. Clinical Summary & Endorsement</h3>
        <div class="view-field" style="margin-bottom: 1.25rem;">
          <span class="view-label">Admission Nursing Summary</span>
          <span class="view-value">${na.nurseSummary || 'Patient admitted safely to ward. Baseline vitals recorded, safety precautions and call light explained.'}</span>
        </div>
        <div class="grid-2">
          <div class="view-field">
            <span class="view-label">Assessing Nurse Signature / Printed Name</span>
            <span class="view-value" style="font-family: var(--font-serif); font-size: 1.05rem; color: var(--sage-dark);">
              ${na.nurseSignature || 'Staff Nurse on Duty, RN'}
            </span>
          </div>
          <div class="view-field">
            <span class="view-label">Assessment Date / Time</span>
            <span class="view-value">${formatDate(patient.admissionDate, 'datetime')}</span>
          </div>
        </div>
      </section>
    `;
    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    const na = patient.forms?.nursingAssessment || {};
    const container = document.createElement('div');
    container.className = 'form-paper';

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Nursing Assessment Form (Edit Mode)', 'WW-NUR-02')}

      ${renderImmutableNotice("Nursing Assessment", "Previously recorded nursing physical assessments and surveys cannot be altered. Empty fields can still be completed.")}

      <form id="nursing-assessment-form">
        <!-- 1. Social History -->
        <section class="form-section">
          <h3 class="form-section-title">A. Social History</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="na-smoking">Smoking Status</label>
              <select id="na-smoking" class="form-control">
                <option value="Never" ${na.smokingStatus === 'Never' ? 'selected' : ''}>Never</option>
                <option value="Former" ${na.smokingStatus === 'Former' ? 'selected' : ''}>Former</option>
                <option value="Current" ${na.smokingStatus === 'Current' ? 'selected' : ''}>Current</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="na-alcohol">Alcohol Use</label>
              <input type="text" id="na-alcohol" class="form-control" value="${na.alcoholUse || ''}" placeholder="e.g. Occasional social wine, Denies" />
            </div>
            <div class="form-group">
              <label class="form-label" for="na-substance">Substance Use</label>
              <input type="text" id="na-substance" class="form-control" value="${na.substanceUse || 'Denies'}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="na-living">Living Arrangements</label>
              <input type="text" id="na-living" class="form-control" value="${na.livingArrangements || ''}" placeholder="e.g. Lives with spouse and children" />
            </div>
          </div>
        </section>

        <!-- 2. General Appearance -->
        <section class="form-section">
          <h3 class="form-section-title">B. General Appearance & Survey</h3>
          <div class="grid-4">
            <div class="form-group">
              <label class="form-label" for="na-conscious">Conscious State</label>
              <select id="na-conscious" class="form-control">
                <option value="Alert" ${na.consciousState === 'Alert' ? 'selected' : ''}>Alert</option>
                <option value="Drowsy" ${na.consciousState === 'Drowsy' ? 'selected' : ''}>Drowsy</option>
                <option value="Confused" ${na.consciousState === 'Confused' ? 'selected' : ''}>Confused</option>
                <option value="Unresponsive" ${na.consciousState === 'Unresponsive' ? 'selected' : ''}>Unresponsive</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="na-mobility">Mobility</label>
              <select id="na-mobility" class="form-control">
                <option value="Independent" ${na.mobility === 'Independent' ? 'selected' : ''}>Independent</option>
                <option value="Assisted" ${na.mobility === 'Assisted' ? 'selected' : ''}>Assisted</option>
                <option value="Immobile" ${na.mobility === 'Immobile' ? 'selected' : ''}>Immobile / Bedridden</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="na-nutritional">Nutritional Status</label>
              <select id="na-nutritional" class="form-control">
                <option value="Well-nourished" ${na.nutritionalStatus === 'Well-nourished' ? 'selected' : ''}>Well-nourished</option>
                <option value="Malnourished" ${na.nutritionalStatus === 'Malnourished' ? 'selected' : ''}>Malnourished</option>
                <option value="Obese" ${na.nutritionalStatus === 'Obese' ? 'selected' : ''}>Obese</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="na-hygiene">Hygiene</label>
              <select id="na-hygiene" class="form-control">
                <option value="Clean" ${na.hygiene === 'Clean' ? 'selected' : ''}>Clean</option>
                <option value="Needs Assistance" ${na.hygiene === 'Needs Assistance' ? 'selected' : ''}>Needs Assistance</option>
                <option value="Unclean" ${na.hygiene === 'Unclean' ? 'selected' : ''}>Unclean</option>
              </select>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="na-gcs">Glasgow Coma Scale (GCS)</label>
              <input type="text" id="na-gcs" class="form-control" value="${na.gcs || '15 (E4 V5 M6)'}" />
            </div>
          </div>
        </section>

        <!-- 3. System-Specific Examination -->
        <section class="form-section">
          <h3 class="form-section-title">C. System-Specific Examination</h3>
          <div class="grid-2">
            <div class="form-group col-span-2">
              <label class="form-label" for="na-cardio">Cardiovascular [Heart sounds, rhythm, murmurs]</label>
              <textarea id="na-cardio" class="form-control" rows="2">${na.cardiovascular || ''}</textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="na-resp">Respiratory [Breath sounds, effort, accessory muscles]</label>
              <textarea id="na-resp" class="form-control" rows="2">${na.respiratory || ''}</textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="na-gi">Gastrointestinal [Bowel sounds, tenderness, distention]</label>
              <textarea id="na-gi" class="form-control" rows="2">${na.gastrointestinal || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="na-heent">HEENT & Neuro</label>
              <input type="text" id="na-heent" class="form-control" value="${na.heent || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="na-gu">Genitourinary</label>
              <input type="text" id="na-gu" class="form-control" value="${na.genitourinary || ''}" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="na-integ">Integumentary & Musculoskeletal</label>
              <input type="text" id="na-integ" class="form-control" value="${na.integumentary || ''}" />
            </div>
          </div>
        </section>

        <!-- 4. Pain & Risk Screening -->
        <section class="form-section">
          <h3 class="form-section-title">D. Pain Assessment & Risk Screening</h3>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label" for="na-painLoc">Pain Location</label>
              <input type="text" id="na-painLoc" class="form-control" value="${na.painLocation || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="na-painScale">Pain Scale (0-10)</label>
              <input type="number" id="na-painScale" class="form-control" min="0" max="10" value="${na.painScale || '0'}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="na-painChar">Pain Character</label>
              <input type="text" id="na-painChar" class="form-control" value="${na.painCharacter || ''}" placeholder="Aching, sharp, burning..." />
            </div>
            <div class="form-group">
              <label class="form-label" for="na-fallRisk">Fall Risk Screening</label>
              <select id="na-fallRisk" class="form-control">
                <option value="Low Risk (Score < 25)" ${na.fallRisk?.includes('Low') ? 'selected' : ''}>Low Risk (Score &lt; 25)</option>
                <option value="Moderate Risk (Score 25-45)" ${na.fallRisk?.includes('Moderate') ? 'selected' : ''}>Moderate Risk (25-45)</option>
                <option value="High Risk (Score > 45)" ${na.fallRisk?.includes('High') ? 'selected' : ''}>High Risk (&gt; 45)</option>
              </select>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="na-pressureRisk">Pressure Injury Risk (Braden)</label>
              <select id="na-pressureRisk" class="form-control">
                <option value="No Risk (Score 19-23)" ${na.pressureRisk?.includes('No') ? 'selected' : ''}>No Risk (Score 19-23)</option>
                <option value="Mild Risk (Score 15-18)" ${na.pressureRisk?.includes('Mild') ? 'selected' : ''}>Mild Risk (Score 15-18)</option>
                <option value="Moderate Risk (Score 13-14)" ${na.pressureRisk?.includes('Moderate') ? 'selected' : ''}>Moderate Risk (Score 13-14)</option>
                <option value="High Risk (Score <= 12)" ${na.pressureRisk?.includes('High') ? 'selected' : ''}>High Risk (Score &le; 12)</option>
              </select>
            </div>
          </div>
        </section>

        <!-- 5. Summary & Signature -->
        <section class="form-section">
          <h3 class="form-section-title">E. Clinical Summary & Nurse Signature</h3>
          <div class="form-group">
            <label class="form-label" for="na-summary">Nursing Summary & Initial Interventions</label>
            <textarea id="na-summary" class="form-control" rows="2">${na.nurseSummary || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="na-signature">Assessing Nurse Name / Credentials <span class="required">*</span></label>
            <input type="text" id="na-signature" class="form-control" value="${na.nurseSignature || ''}" required placeholder="Name, RN" />
          </div>
        </section>

        <!-- Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" id="btn-cancel-na">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-na">Save Nursing Assessment</button>
        </div>
      </form>
    `;

    // Lock previously populated fields to preserve medical record immutability
    container.querySelectorAll('input, select, textarea').forEach(el => {
      const val = el.value?.trim();
      if (val && val !== '') {
        el.setAttribute('disabled', 'true');
        el.setAttribute('title', 'Permanent record: Previously recorded assessment cannot be altered.');
        el.classList.add('field-locked');
      }
    });

    container.querySelector('#nursing-assessment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        smokingStatus: container.querySelector('#na-smoking')?.value || na.smokingStatus,
        alcoholUse: (container.querySelector('#na-alcohol')?.value || na.alcoholUse || '').trim(),
        substanceUse: (container.querySelector('#na-substance')?.value || na.substanceUse || '').trim(),
        livingArrangements: (container.querySelector('#na-living')?.value || na.livingArrangements || '').trim(),
        consciousState: container.querySelector('#na-conscious')?.value || na.consciousState,
        mobility: container.querySelector('#na-mobility')?.value || na.mobility,
        nutritionalStatus: container.querySelector('#na-nutritional')?.value || na.nutritionalStatus,
        hygiene: container.querySelector('#na-hygiene')?.value || na.hygiene,
        gcs: (container.querySelector('#na-gcs')?.value || na.gcs || '').trim(),
        cardiovascular: (container.querySelector('#na-cardio')?.value || na.cardiovascular || '').trim(),
        respiratory: (container.querySelector('#na-resp')?.value || na.respiratory || '').trim(),
        gastrointestinal: (container.querySelector('#na-gi')?.value || na.gastrointestinal || '').trim(),
        heent: (container.querySelector('#na-heent')?.value || na.heent || '').trim(),
        genitourinary: (container.querySelector('#na-gu')?.value || na.genitourinary || '').trim(),
        integumentary: (container.querySelector('#na-integ')?.value || na.integumentary || '').trim(),
        painLocation: (container.querySelector('#na-painLoc')?.value || na.painLocation || '').trim(),
        painScale: container.querySelector('#na-painScale')?.value || na.painScale,
        painCharacter: (container.querySelector('#na-painChar')?.value || na.painCharacter || '').trim(),
        fallRisk: container.querySelector('#na-fallRisk')?.value || na.fallRisk,
        pressureRisk: container.querySelector('#na-pressureRisk')?.value || na.pressureRisk,
        nurseSummary: (container.querySelector('#na-summary')?.value || na.nurseSummary || '').trim(),
        nurseSignature: (container.querySelector('#na-signature')?.value || na.nurseSignature || '').trim()
      };
      onSave(updated);
    });

    container.querySelector('#btn-cancel-na').addEventListener('click', onCancel);

    return container;
  }
};
