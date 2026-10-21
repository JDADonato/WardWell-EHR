// Form 6: IV Flow Record
import { renderFormStandardHeader } from './common.js';
import { formatDate, getCurrentISODateTime } from '../utils/dates.js';
import { generateId } from '../utils/id.js';
import { showConfirm } from '../ui/confirm.js';

export const IvFlowForm = {
  renderView(patient, onEdit, onPrint) {
    const ivs = Array.isArray(patient.forms?.ivFlow) ? patient.forms.ivFlow : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    let rowsHtml = '';
    if (ivs.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No IV flow records entered yet.
          </td>
        </tr>
      `;
    } else {
      ivs.forEach((iv) => {
        rowsHtml += `
          <tr>
            <td style="white-space: nowrap;">
              <div>${formatDate(iv.dateTimeStarted, 'short')}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${formatDate(iv.dateTimeStarted, 'time')} [${iv.shift || '7-3'}]</div>
            </td>
            <td><strong>${iv.botNo || 'IVF #1'}</strong></td>
            <td>
              <div style="font-weight: 500;">${iv.solution || '—'}</div>
              <span class="badge ${iv.status === 'Completed' ? 'badge-discharged' : iv.status === 'Discontinued' ? 'badge-fordischarge' : 'badge-admitted'}" style="font-size: 0.7rem;">
                ${iv.status || 'Infusing'}
              </span>
            </td>
            <td>${iv.rate || '30 gtts/min'}</td>
            <td>${iv.site || 'LH (Gauge 20)'}</td>
            <td>${iv.receivedAmount ? `${iv.receivedAmount} mL` : '—'}</td>
            <td>${iv.infusedAmount ? `${iv.infusedAmount} mL` : '—'}</td>
            <td style="font-size: 0.8rem;">${iv.consumedTime ? formatDate(iv.consumedTime, 'datetime') : 'In progress'}</td>
            <td style="font-size: 0.82rem;">${iv.remarks || '—'}</td>
            <td style="white-space: nowrap; font-size: 0.82rem;">${iv.nodSignature || 'NOD, RN'}</td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Intravenous Fluid Flow Record', 'WW-IVF-06')}

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date/Shift Started</th>
              <th>Bot # / Unit</th>
              <th>IV Solution & Status</th>
              <th>Flow Rate</th>
              <th>IV Site & Gauge</th>
              <th>Level Recv'd</th>
              <th>Amt Infused</th>
              <th>Time Consumed</th>
              <th>Remarks</th>
              <th>NOD Signature</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    let ivs = Array.isArray(patient.forms?.ivFlow) ? JSON.parse(JSON.stringify(patient.forms.ivFlow)) : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    function renderRows() {
      const tbody = container.querySelector('#iv-tbody');
      if (!tbody) return;

      if (ivs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="11" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No IV flow entries. Click "+ Add IV Flow Record" below.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = ivs.map((iv, idx) => `
        <tr>
          <td>
            <input type="datetime-local" class="form-control form-control-sm dt-val" data-idx="${idx}" value="${iv.dateTimeStarted ? iv.dateTimeStarted.substring(0, 16) : ''}" style="min-width: 145px;" />
            <select class="form-control form-control-sm shift-val" data-idx="${idx}" style="margin-top: 4px;">
              <option value="7-3" ${iv.shift === '7-3' ? 'selected' : ''}>7-3</option>
              <option value="3-11" ${iv.shift === '3-11' ? 'selected' : ''}>3-11</option>
              <option value="11-7" ${iv.shift === '11-7' ? 'selected' : ''}>11-7</option>
            </select>
          </td>
          <td><input type="text" class="form-control form-control-sm bot-val" data-idx="${idx}" value="${iv.botNo || ''}" placeholder="IVF #1" style="width: 75px;" /></td>
          <td>
            <input type="text" class="form-control form-control-sm sol-val" data-idx="${idx}" value="${iv.solution || ''}" placeholder="PLR 1000mL" style="min-width: 120px;" />
            <select class="form-control form-control-sm stat-val" data-idx="${idx}" style="margin-top: 4px;">
              <option value="Infusing" ${iv.status === 'Infusing' ? 'selected' : ''}>Infusing</option>
              <option value="Completed" ${iv.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Discontinued" ${iv.status === 'Discontinued' ? 'selected' : ''}>Discontinued</option>
            </select>
          </td>
          <td><input type="text" class="form-control form-control-sm rate-val" data-idx="${idx}" value="${iv.rate || '30 gtts/min'}" style="width: 90px;" /></td>
          <td><input type="text" class="form-control form-control-sm site-val" data-idx="${idx}" value="${iv.site || 'LH (Gauge 20)'}" style="width: 110px;" /></td>
          <td><input type="number" class="form-control form-control-sm rec-val" data-idx="${idx}" value="${iv.receivedAmount || '1000'}" style="width: 75px;" /></td>
          <td><input type="number" class="form-control form-control-sm inf-val" data-idx="${idx}" value="${iv.infusedAmount || '0'}" style="width: 75px;" /></td>
          <td><input type="datetime-local" class="form-control form-control-sm con-val" data-idx="${idx}" value="${iv.consumedTime ? iv.consumedTime.substring(0, 16) : ''}" style="min-width: 145px;" /></td>
          <td><input type="text" class="form-control form-control-sm rem-val" data-idx="${idx}" value="${iv.remarks || ''}" placeholder="Remarks" style="min-width: 110px;" /></td>
          <td><input type="text" class="form-control form-control-sm nod-val" data-idx="${idx}" value="${iv.nodSignature || 'Nurse, RN'}" style="min-width: 100px;" /></td>
          <td style="text-align: center;">
            <button type="button" class="btn btn-icon btn-sm btn-danger del-iv-btn" data-idx="${idx}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.dt-val').forEach(el => el.addEventListener('change', e => { ivs[parseInt(e.target.dataset.idx, 10)].dateTimeStarted = e.target.value; }));
      tbody.querySelectorAll('.shift-val').forEach(el => el.addEventListener('change', e => { ivs[parseInt(e.target.dataset.idx, 10)].shift = e.target.value; }));
      tbody.querySelectorAll('.bot-val').forEach(el => el.addEventListener('input', e => { ivs[parseInt(e.target.dataset.idx, 10)].botNo = e.target.value; }));
      tbody.querySelectorAll('.sol-val').forEach(el => el.addEventListener('input', e => { ivs[parseInt(e.target.dataset.idx, 10)].solution = e.target.value; }));
      tbody.querySelectorAll('.stat-val').forEach(el => el.addEventListener('change', e => { ivs[parseInt(e.target.dataset.idx, 10)].status = e.target.value; }));
      tbody.querySelectorAll('.rate-val').forEach(el => el.addEventListener('input', e => { ivs[parseInt(e.target.dataset.idx, 10)].rate = e.target.value; }));
      tbody.querySelectorAll('.site-val').forEach(el => el.addEventListener('input', e => { ivs[parseInt(e.target.dataset.idx, 10)].site = e.target.value; }));
      tbody.querySelectorAll('.rec-val').forEach(el => el.addEventListener('input', e => { ivs[parseInt(e.target.dataset.idx, 10)].receivedAmount = e.target.value; }));
      tbody.querySelectorAll('.inf-val').forEach(el => el.addEventListener('input', e => { ivs[parseInt(e.target.dataset.idx, 10)].infusedAmount = e.target.value; }));
      tbody.querySelectorAll('.con-val').forEach(el => el.addEventListener('change', e => { ivs[parseInt(e.target.dataset.idx, 10)].consumedTime = e.target.value; }));
      tbody.querySelectorAll('.rem-val').forEach(el => el.addEventListener('input', e => { ivs[parseInt(e.target.dataset.idx, 10)].remarks = e.target.value; }));
      tbody.querySelectorAll('.nod-val').forEach(el => el.addEventListener('input', e => { ivs[parseInt(e.target.dataset.idx, 10)].nodSignature = e.target.value; }));

      tbody.querySelectorAll('.del-iv-btn').forEach(btn => btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const ok = await showConfirm({
          title: 'Delete IV Entry',
          message: 'Are you sure you want to remove this IV flow record?',
          isDanger: true
        });
        if (ok) {
          ivs.splice(idx, 1);
          renderRows();
        }
      }));
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Intravenous Fluid Flow Record (Edit Mode)', 'WW-IVF-06')}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div style="font-size: 0.84rem; color: var(--text-secondary);">
          Track IV bottles, infusion rates, sites, levels, and consumption status.
        </div>
        <button type="button" class="btn btn-sm btn-secondary" id="btn-add-iv-row">
          + Add IV Flow Record
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date/Shift</th>
              <th>Bot #</th>
              <th>Solution & Status</th>
              <th>Rate</th>
              <th>Site & Gauge</th>
              <th>Recv'd</th>
              <th>Infused</th>
              <th>Consumed</th>
              <th>Remarks</th>
              <th>NOD Sig</th>
              <th>Act</th>
            </tr>
          </thead>
          <tbody id="iv-tbody"></tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-outline" id="btn-cancel-iv">Cancel</button>
        <button type="button" class="btn btn-primary" id="btn-save-iv">Save IV Records</button>
      </div>
    `;

    renderRows();

    container.querySelector('#btn-add-iv-row').addEventListener('click', () => {
      const nextNum = ivs.length + 1;
      ivs.push({
        id: generateId('iv'),
        dateTimeStarted: getCurrentISODateTime(),
        shift: '7-3',
        botNo: `IVF #${nextNum}`,
        solution: 'PLR 1000mL',
        rate: '30 gtts/min',
        site: 'LH (Gauge 20)',
        receivedAmount: '1000',
        infusedAmount: '0',
        consumedTime: '',
        remarks: 'Infusing safely',
        status: 'Infusing',
        nodSignature: 'Nurse, RN'
      });
      renderRows();
    });

    container.querySelector('#btn-save-iv').addEventListener('click', () => {
      onSave(ivs);
    });

    container.querySelector('#btn-cancel-iv').addEventListener('click', onCancel);

    return container;
  }
};
