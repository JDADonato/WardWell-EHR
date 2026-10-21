// Form 8: Medication Administration Record (MAR)
import { renderFormStandardHeader } from './common.js';
import { formatDate, getCurrentISODate } from '../utils/dates.js';
import { generateId } from '../utils/id.js';
import { showConfirm } from '../ui/confirm.js';

const STATUS_CYCLE = ['Not yet', 'Given', 'Held', 'Refused'];

export const MarForm = {
  renderView(patient, onEdit, onPrint) {
    const meds = Array.isArray(patient.forms?.mar) ? patient.forms.mar : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    const categories = ['PARENTERAL', 'ORAL', 'OTHER'];
    const catLabels = {
      PARENTERAL: 'PARENTERAL (IV / IM / SC / ID)',
      ORAL: 'ORAL / SUBLINGUAL',
      OTHER: 'NEBULIZATION / TOPICAL / SUPPOSITORY / EYE / EAR / IRRIGATION'
    };

    let tablesHtml = '';
    categories.forEach(cat => {
      const catMeds = meds.filter(m => (m.category || 'ORAL').toUpperCase().includes(cat));

      let rows = '';
      if (catMeds.length === 0) {
        rows = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1rem; font-style: italic;">
              No medications listed under this category.
            </td>
          </tr>
        `;
      } else {
        catMeds.forEach(m => {
          const s7 = m.slots?.slot_7_3 || m.slots?.slot_08 || 'Not yet';
          const s3 = m.slots?.slot_3_11 || m.slots?.slot_16 || 'Not yet';
          const s11 = m.slots?.slot_11_7 || m.slots?.slot_00 || 'Not yet';

          rows += `
            <tr>
              <td>
                <div style="font-weight: 700; font-size: 0.92rem;">${m.medication || '—'}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Ordered by: ${m.orderedBy || patient.attendingPhysician || 'Attending MD'}</div>
              </td>
              <td>${m.dose || '—'}</td>
              <td>${m.route || '—'}</td>
              <td>${m.frequency || '—'}</td>
              <td style="white-space: nowrap;">${formatDate(m.startDate, 'short')}</td>
              <td>
                <div style="display: flex; gap: 0.35rem; justify-content: center;">
                  <span class="mar-slot-btn ${s7 === 'Given' ? 'mar-slot-given' : s7 === 'Held' ? 'mar-slot-held' : s7 === 'Refused' ? 'mar-slot-refused' : 'mar-slot-notyet'}" title="7am-3pm: ${s7}">7-3</span>
                  <span class="mar-slot-btn ${s3 === 'Given' ? 'mar-slot-given' : s3 === 'Held' ? 'mar-slot-held' : s3 === 'Refused' ? 'mar-slot-refused' : 'mar-slot-notyet'}" title="3pm-11pm: ${s3}">3-11</span>
                  <span class="mar-slot-btn ${s11 === 'Given' ? 'mar-slot-given' : s11 === 'Held' ? 'mar-slot-held' : s11 === 'Refused' ? 'mar-slot-refused' : 'mar-slot-notyet'}" title="11pm-7am: ${s11}">11-7</span>
                </div>
              </td>
              <td style="text-align: center; font-weight: 600; font-family: var(--font-mono);">${m.nurseInitials || 'RN'}</td>
            </tr>
          `;
        });
      }

      tablesHtml += `
        <div style="margin-bottom: 1.75rem;">
          <h4 style="font-family: var(--font-sans); font-size: 0.88rem; font-weight: 700; color: var(--sage-dark); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.04em;">
            ${catLabels[cat]}
          </h4>
          <div class="table-responsive">
            <table class="data-table mar-table">
              <thead>
                <tr>
                  <th style="width: 28%;">Medication & Prescriber</th>
                  <th style="width: 12%;">Dose</th>
                  <th style="width: 10%;">Route</th>
                  <th style="width: 14%;">Frequency</th>
                  <th style="width: 12%;">Start Date</th>
                  <th style="width: 16%; text-align: center;">Shift Slots (7-3 / 3-11 / 11-7)</th>
                  <th style="width: 8%; text-align: center;">Initials</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Medication Administration Record (MAR)', 'WW-MAR-08')}

      <!-- Prominent Allergy Warning Banner -->
      <div style="display: flex; align-items: center; gap: 0.75rem; background-color: var(--status-critical-bg); border: 1.5px solid var(--status-critical-border); padding: 0.75rem 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--status-critical-text); flex-shrink: 0;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        <div>
          <span style="font-weight: 700; color: var(--status-critical-text); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em;">Known Patient Allergies:</span>
          <span style="font-weight: 700; color: var(--ink); margin-left: 0.5rem; font-size: 0.95rem;">${patient.allergies || 'NONE KNOWN (NKDA)'}</span>
        </div>
      </div>

      <!-- Legend -->
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; font-size: 0.78rem;">
        <span style="font-weight: 600; color: var(--text-secondary);">SLOT STATUS:</span>
        <span style="display: inline-flex; align-items: center; gap: 0.25rem;"><span class="mar-slot-btn mar-slot-given" style="width: 20px; height: 20px; font-size: 0.65rem;">G</span> Given</span>
        <span style="display: inline-flex; align-items: center; gap: 0.25rem;"><span class="mar-slot-btn mar-slot-held" style="width: 20px; height: 20px; font-size: 0.65rem;">H</span> Held</span>
        <span style="display: inline-flex; align-items: center; gap: 0.25rem;"><span class="mar-slot-btn mar-slot-refused" style="width: 20px; height: 20px; font-size: 0.65rem;">R</span> Refused</span>
        <span style="display: inline-flex; align-items: center; gap: 0.25rem;"><span class="mar-slot-btn mar-slot-notyet" style="width: 20px; height: 20px; font-size: 0.65rem;">—</span> Not yet</span>
      </div>

      ${tablesHtml}

      <!-- Specimen Signature Section -->
      <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1.5rem; display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
        <div><strong>Specimen Signatures:</strong> CAF - Camille Anne Felias, RN | JT - Jonathan Tan, RN | MB - M. Bautista, RN</div>
        <div>Verify 10 Rights of Medication Administration prior to giving.</div>
      </div>
    `;

    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    let meds = Array.isArray(patient.forms?.mar) ? JSON.parse(JSON.stringify(patient.forms.mar)) : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    function renderRows() {
      const tbody = container.querySelector('#mar-tbody');
      if (!tbody) return;

      if (meds.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No medications listed. Click "+ Add Medication" below.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = meds.map((m, idx) => {
        const s7 = m.slots?.slot_7_3 || 'Not yet';
        const s3 = m.slots?.slot_3_11 || 'Not yet';
        const s11 = m.slots?.slot_11_7 || 'Not yet';

        return `
          <tr>
            <td>
              <select class="form-control form-control-sm cat-val" data-idx="${idx}" style="margin-bottom: 4px;">
                <option value="PARENTERAL" ${m.category === 'PARENTERAL' ? 'selected' : ''}>Parenteral (IV/IM/SC)</option>
                <option value="ORAL" ${m.category === 'ORAL' ? 'selected' : ''}>Oral / Sublingual</option>
                <option value="OTHER" ${m.category === 'OTHER' ? 'selected' : ''}>Other / Topical / Neb</option>
              </select>
              <input type="text" class="form-control form-control-sm med-val" data-idx="${idx}" value="${m.medication || ''}" placeholder="Drug name & strength" />
            </td>
            <td><input type="text" class="form-control form-control-sm dose-val" data-idx="${idx}" value="${m.dose || ''}" placeholder="e.g. 500mg" style="width: 80px;" /></td>
            <td><input type="text" class="form-control form-control-sm route-val" data-idx="${idx}" value="${m.route || 'Oral'}" style="width: 70px;" /></td>
            <td><input type="text" class="form-control form-control-sm freq-val" data-idx="${idx}" value="${m.frequency || 'OD'}" placeholder="e.g. q8h" style="width: 90px;" /></td>
            <td><input type="date" class="form-control form-control-sm date-val" data-idx="${idx}" value="${m.startDate || getCurrentISODate()}" style="width: 130px;" /></td>
            <td>
              <div style="display: flex; gap: 0.25rem;">
                <button type="button" class="mar-slot-btn slot-toggle ${s7 === 'Given' ? 'mar-slot-given' : s7 === 'Held' ? 'mar-slot-held' : s7 === 'Refused' ? 'mar-slot-refused' : 'mar-slot-notyet'}" data-idx="${idx}" data-slot="slot_7_3" title="Click to cycle status">${s7[0]}</button>
                <button type="button" class="mar-slot-btn slot-toggle ${s3 === 'Given' ? 'mar-slot-given' : s3 === 'Held' ? 'mar-slot-held' : s3 === 'Refused' ? 'mar-slot-refused' : 'mar-slot-notyet'}" data-idx="${idx}" data-slot="slot_3_11" title="Click to cycle status">${s3[0]}</button>
                <button type="button" class="mar-slot-btn slot-toggle ${s11 === 'Given' ? 'mar-slot-given' : s11 === 'Held' ? 'mar-slot-held' : s11 === 'Refused' ? 'mar-slot-refused' : 'mar-slot-notyet'}" data-idx="${idx}" data-slot="slot_11_7" title="Click to cycle status">${s11[0]}</button>
              </div>
            </td>
            <td><input type="text" class="form-control form-control-sm init-val" data-idx="${idx}" value="${m.nurseInitials || 'RN'}" style="width: 55px;" /></td>
            <td style="text-align: center;">
              <button type="button" class="btn btn-icon btn-sm btn-danger del-mar-btn" data-idx="${idx}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.cat-val').forEach(el => el.addEventListener('change', e => { meds[parseInt(e.target.dataset.idx, 10)].category = e.target.value; }));
      tbody.querySelectorAll('.med-val').forEach(el => el.addEventListener('input', e => { meds[parseInt(e.target.dataset.idx, 10)].medication = e.target.value; }));
      tbody.querySelectorAll('.dose-val').forEach(el => el.addEventListener('input', e => { meds[parseInt(e.target.dataset.idx, 10)].dose = e.target.value; }));
      tbody.querySelectorAll('.route-val').forEach(el => el.addEventListener('input', e => { meds[parseInt(e.target.dataset.idx, 10)].route = e.target.value; }));
      tbody.querySelectorAll('.freq-val').forEach(el => el.addEventListener('input', e => { meds[parseInt(e.target.dataset.idx, 10)].frequency = e.target.value; }));
      tbody.querySelectorAll('.date-val').forEach(el => el.addEventListener('change', e => { meds[parseInt(e.target.dataset.idx, 10)].startDate = e.target.value; }));
      tbody.querySelectorAll('.init-val').forEach(el => el.addEventListener('input', e => { meds[parseInt(e.target.dataset.idx, 10)].nurseInitials = e.target.value; }));

      // Slot cycle buttons
      tbody.querySelectorAll('.slot-toggle').forEach(btn => btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.idx, 10);
        const slotKey = btn.dataset.slot;
        if (!meds[idx].slots) meds[idx].slots = {};
        const current = meds[idx].slots[slotKey] || 'Not yet';
        const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
        meds[idx].slots[slotKey] = STATUS_CYCLE[nextIdx];
        renderRows();
      }));

      tbody.querySelectorAll('.del-mar-btn').forEach(btn => btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const ok = await showConfirm({
          title: 'Delete Medication',
          message: 'Are you sure you want to remove this medication from the MAR?',
          isDanger: true
        });
        if (ok) {
          meds.splice(idx, 1);
          renderRows();
        }
      }));
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Medication Administration Record (Edit Mode)', 'WW-MAR-08')}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div style="font-size: 0.84rem; color: var(--text-secondary);">
          Click shift slot buttons (7-3, 3-11, 11-7) to cycle between Not Yet &rarr; Given &rarr; Held &rarr; Refused.
        </div>
        <button type="button" class="btn btn-sm btn-secondary" id="btn-add-mar-row">
          + Add Medication
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 25%;">Category & Medication</th>
              <th>Dose</th>
              <th>Route</th>
              <th>Frequency</th>
              <th>Start Date</th>
              <th style="width: 120px;">Slots (Click to Cycle)</th>
              <th>Initials</th>
              <th>Act</th>
            </tr>
          </thead>
          <tbody id="mar-tbody"></tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-outline" id="btn-cancel-mar">Cancel</button>
        <button type="button" class="btn btn-primary" id="btn-save-mar">Save MAR Entries</button>
      </div>
    `;

    renderRows();

    container.querySelector('#btn-add-mar-row').addEventListener('click', () => {
      meds.push({
        id: generateId('mar'),
        category: 'ORAL',
        medication: '',
        dose: '',
        route: 'Oral',
        frequency: 'OD',
        orderedBy: patient.attendingPhysician || 'Attending MD',
        startDate: getCurrentISODate(),
        slots: { slot_7_3: 'Not yet', slot_3_11: 'Not yet', slot_11_7: 'Not yet' },
        nurseInitials: 'RN'
      });
      renderRows();
    });

    container.querySelector('#btn-save-mar').addEventListener('click', () => {
      onSave(meds);
    });

    container.querySelector('#btn-cancel-mar').addEventListener('click', onCancel);

    return container;
  }
};
