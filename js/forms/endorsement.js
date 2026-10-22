// Form 10: Patient Endorsement Form (Handover / SBAR)
import { renderFormStandardHeader, renderImmutableNotice } from './common.js';
import { formatDate, getCurrentISODate } from '../utils/dates.js';

export const EndorsementForm = {
  renderView(patient, onEdit, onPrint) {
    const end = patient.forms?.endorsement || {};
    const container = document.createElement('div');
    container.className = 'form-paper';

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Patient Endorsement Sheet (Shift Handover)', 'WW-END-10')}

      <!-- Shift Handover Meta -->
      <section class="form-section">
        <h3 class="form-section-title">A. Shift & Staff Assignment</h3>
        <div class="grid-3">
          <div class="view-field">
            <span class="view-label">Handover Date</span>
            <span class="view-value">${formatDate(end.date || getCurrentISODate(), 'short')}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Shift Handover</span>
            <span class="view-value">${end.shift || '7-3 to 3-11'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Location / Ward Bed</span>
            <span class="view-value">${patient.roomBed || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Outgoing Nurse (NOD)</span>
            <span class="view-value">${end.outgoingNurse || 'Camille Anne Felias, RN'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Incoming Nurse</span>
            <span class="view-value">${end.incomingNurse || 'Jonathan Tan, RN'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Attending Physician / Resident</span>
            <span class="view-value">${patient.attendingPhysician || '—'}</span>
          </div>
        </div>
      </section>

      <!-- Primary Working Impression -->
      <section class="form-section">
        <h3 class="form-section-title">B. Primary Working Impression</h3>
        <div class="view-field">
          <span class="view-label">Admitting Diagnosis & Impression</span>
          <span class="view-value" style="font-weight: 600; font-size: 1.05rem; color: var(--sage-darker);">
            ${patient.admittingDiagnosis || '—'}
          </span>
        </div>
      </section>

      <!-- Pertinent Physical Exam & Vital Parameters -->
      <section class="form-section">
        <h3 class="form-section-title">C. Pertinent Physical Examination & Vitals</h3>
        <div class="table-responsive" style="margin-bottom: 1rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 25%;">System / Parameter</th>
                <th>Findings / Parameters</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>General Survey & Vitals</strong></td>
                <td>${end.vitalsSummary || 'Conscious, oriented x3. Latest VS: BP 120/80, HR 82, RR 18, T 36.8C, SpO2 98%'}</td>
              </tr>
              <tr>
                <td><strong>HEENT & Neurological</strong></td>
                <td>${end.neuro || 'GCS 15 (E4 V5 M6), pupils 3mm briskly reactive, no focal neurological deficits'}</td>
              </tr>
              <tr>
                <td><strong>Chest / Lungs</strong></td>
                <td>${end.chestLungs || 'Symmetrical chest expansion, clear breath sounds, no rales/wheezing'}</td>
              </tr>
              <tr>
                <td><strong>Cardiovascular</strong></td>
                <td>${end.cardiac || 'Normal rate, regular rhythm, dynamic precordium normal'}</td>
              </tr>
              <tr>
                <td><strong>Abdomen & GI</strong></td>
                <td>${end.abdomen || 'Soft, non-tender, active normoactive bowel sounds'}</td>
              </tr>
              <tr>
                <td><strong>Lines / Tubes / IV fluids</strong></td>
                <td>${end.lines || 'Gauge 20 IV cannula on left hand infusing PLR 1L @ 30 gtts/min'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Medications on Board -->
      <section class="form-section">
        <h3 class="form-section-title">D. Medications on Board</h3>
        <div class="view-field">
          <span class="view-label">Active Medications & Scheduled Doses</span>
          <span class="view-value" style="white-space: pre-line;">${end.medicationsOnBoard || 'Oral & IV medications administered as charted on MAR.'}</span>
        </div>
      </section>

      <!-- SBAR Endorsement -->
      <section class="form-section">
        <h3 class="form-section-title">E. SBAR Shift Handover Details</h3>
        <div class="grid-2">
          <div class="view-field col-span-2">
            <span class="view-label"><strong>S - Situation:</strong> Current problem, acute change, vital stability</span>
            <span class="view-value">${end.situation || 'Patient stable in bed, resting without acute distress.'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label"><strong>B - Background:</strong> Clinical history, code status, allergies</span>
            <span class="view-value">${end.background || `Code Status: Full Code. Known allergies: ${patient.allergies || 'None Known'}. Admitted for ${patient.admittingDiagnosis}.`}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label"><strong>A - Assessment:</strong> Nurse clinical findings, recent lab/test results</span>
            <span class="view-value">${end.assessment || 'Afebrile, vitals within normal parameters. Tolerance to prescribed diet and medications.'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label"><strong>R - Recommendation:</strong> Pending orders, lab draws, plan of care for incoming shift</span>
            <span class="view-value">${end.recommendation || 'Continue routine monitoring every 4 hours. Follow up morning lab results and maintain IV patency.'}</span>
          </div>
        </div>
      </section>
    `;

    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    const end = patient.forms?.endorsement || {};
    const container = document.createElement('div');
    container.className = 'form-paper';

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Patient Endorsement Sheet (Edit Mode)', 'WW-END-10')}

      ${renderImmutableNotice("Shift Endorsement Sheet", "Previously recorded shift endorsement entries are permanent legal handover records and cannot be altered. Empty fields can still be completed.")}

      <form id="endorsement-form">
        <!-- A. Shift Details -->
        <section class="form-section">
          <h3 class="form-section-title">A. Shift & Staff Assignment</h3>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label" for="end-date">Endorsement Date</label>
              <input type="date" id="end-date" class="form-control" value="${end.date || getCurrentISODate()}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="end-shift">Shift</label>
              <select id="end-shift" class="form-control">
                <option value="7-3 to 3-11" ${end.shift === '7-3 to 3-11' ? 'selected' : ''}>7-3 to 3-11 (Day &rarr; Eve)</option>
                <option value="3-11 to 11-7" ${end.shift === '3-11 to 11-7' ? 'selected' : ''}>3-11 to 11-7 (Eve &rarr; Night)</option>
                <option value="11-7 to 7-3" ${end.shift === '11-7 to 7-3' ? 'selected' : ''}>11-7 to 7-3 (Night &rarr; Day)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="end-outgoing">Outgoing Nurse</label>
              <input type="text" id="end-outgoing" class="form-control" value="${end.outgoingNurse || ''}" placeholder="Name, RN" />
            </div>
            <div class="form-group">
              <label class="form-label" for="end-incoming">Incoming Nurse</label>
              <input type="text" id="end-incoming" class="form-control" value="${end.incomingNurse || ''}" placeholder="Name, RN" />
            </div>
          </div>
        </section>

        <!-- B. Physical Exam & Vitals -->
        <section class="form-section">
          <h3 class="form-section-title">B. Pertinent Physical Examination & Vitals</h3>
          <div class="grid-2">
            <div class="form-group col-span-2">
              <label class="form-label" for="end-vs">General Survey & Latest Vitals</label>
              <input type="text" id="end-vs" class="form-control" value="${end.vitalsSummary || ''}" placeholder="BP, HR, RR, Temp, SpO2" />
            </div>
            <div class="form-group">
              <label class="form-label" for="end-neuro">HEENT & Neurological (GCS)</label>
              <input type="text" id="end-neuro" class="form-control" value="${end.neuro || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="end-chest">Chest & Lungs</label>
              <input type="text" id="end-chest" class="form-control" value="${end.chestLungs || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="end-cardiac">Cardiovascular</label>
              <input type="text" id="end-cardiac" class="form-control" value="${end.cardiac || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="end-abdomen">Abdomen & GI</label>
              <input type="text" id="end-abdomen" class="form-control" value="${end.abdomen || ''}" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="end-lines">IV Lines, Tubes & Fluid/s</label>
              <input type="text" id="end-lines" class="form-control" value="${end.lines || ''}" />
            </div>
          </div>
        </section>

        <!-- C. Medications On Board -->
        <section class="form-section">
          <h3 class="form-section-title">C. Medications on Board</h3>
          <div class="form-group">
            <label class="form-label" for="end-meds">Active Medications & Continuous Infusions</label>
            <textarea id="end-meds" class="form-control" rows="2">${end.medicationsOnBoard || ''}</textarea>
          </div>
        </section>

        <!-- D. SBAR Handover -->
        <section class="form-section">
          <h3 class="form-section-title">D. SBAR Structured Endorsement</h3>
          <div class="grid-2">
            <div class="form-group col-span-2">
              <label class="form-label" for="end-sit">S - Situation</label>
              <textarea id="end-sit" class="form-control" rows="2">${end.situation || ''}</textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="end-bg">B - Background</label>
              <textarea id="end-bg" class="form-control" rows="2">${end.background || ''}</textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="end-ass">A - Assessment</label>
              <textarea id="end-ass" class="form-control" rows="2">${end.assessment || ''}</textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="end-rec">R - Recommendation</label>
              <textarea id="end-rec" class="form-control" rows="2">${end.recommendation || ''}</textarea>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" id="btn-cancel-end">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-end">Save Endorsement</button>
        </div>
      </form>
    `;

    // Lock previously populated fields to preserve medical record immutability
    container.querySelectorAll('input, select, textarea').forEach(el => {
      const val = el.value?.trim();
      if (val && val !== '') {
        el.setAttribute('disabled', 'true');
        el.setAttribute('title', 'Permanent record: Previously recorded handover endorsement cannot be altered.');
        el.classList.add('field-locked');
      }
    });

    container.querySelector('#endorsement-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        date: container.querySelector('#end-date')?.value || end.date,
        shift: container.querySelector('#end-shift')?.value || end.shift,
        outgoingNurse: (container.querySelector('#end-outgoing')?.value || end.outgoingNurse || '').trim(),
        incomingNurse: (container.querySelector('#end-incoming')?.value || end.incomingNurse || '').trim(),
        vitalsSummary: (container.querySelector('#end-vs')?.value || end.vitalsSummary || '').trim(),
        neuro: (container.querySelector('#end-neuro')?.value || end.neuro || '').trim(),
        chestLungs: (container.querySelector('#end-chest')?.value || end.chestLungs || '').trim(),
        cardiac: (container.querySelector('#end-cardiac')?.value || end.cardiac || '').trim(),
        abdomen: (container.querySelector('#end-abdomen')?.value || end.abdomen || '').trim(),
        lines: (container.querySelector('#end-lines')?.value || end.lines || '').trim(),
        medicationsOnBoard: (container.querySelector('#end-meds')?.value || end.medicationsOnBoard || '').trim(),
        situation: (container.querySelector('#end-sit')?.value || end.situation || '').trim(),
        background: (container.querySelector('#end-bg')?.value || end.background || '').trim(),
        assessment: (container.querySelector('#end-ass')?.value || end.assessment || '').trim(),
        recommendation: (container.querySelector('#end-rec')?.value || end.recommendation || '').trim()
      };
      onSave(updated);
    });

    container.querySelector('#btn-cancel-end').addEventListener('click', onCancel);

    return container;
  }
};
