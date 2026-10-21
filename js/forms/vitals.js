// Form 5: Vital Signs Monitoring
import { renderFormStandardHeader } from './common.js';
import { formatDate, getCurrentISODateTime, getCurrentISODate, getCurrentISOTime } from '../utils/dates.js';
import { generateId } from '../utils/id.js';
import { isAbnormalVital, isAbnormalBP } from '../utils/validate.js';
import { renderVitalsChart } from '../ui/vitals-chart.js';
import { showConfirm } from '../ui/confirm.js';

export const VitalsForm = {
  renderView(patient, onEdit, onPrint) {
    const vitals = Array.isArray(patient.forms?.vitals) ? patient.forms.vitals : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    let rowsHtml = '';
    if (vitals.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="12" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No vital signs recorded yet.
          </td>
        </tr>
      `;
    } else {
      vitals.forEach((v) => {
        const bpAbn = isAbnormalBP(v.bp);
        const hrAbn = isAbnormalVital('hr', v.pulse || v.hr);
        const rrAbn = isAbnormalVital('rr', v.rr);
        const tempAbn = isAbnormalVital('temp', v.temp);
        const o2Abn = isAbnormalVital('spo2', v.spo2);
        const painAbn = isAbnormalVital('pain', v.pain);

        rowsHtml += `
          <tr>
            <td style="white-space: nowrap;">
              <div>${formatDate(v.dateTime, 'short')}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${formatDate(v.dateTime, 'time')} [${v.shift || '7-3'}]</div>
            </td>
            <td>
              <span class="${bpAbn ? 'badge badge-abnormal' : ''}">${v.bp || '—'}</span>
            </td>
            <td>
              <span class="${hrAbn ? 'badge badge-abnormal' : ''}">${v.pulse || v.hr || '—'}</span>
            </td>
            <td>
              <span class="${rrAbn ? 'badge badge-abnormal' : ''}">${v.rr || '—'}</span>
            </td>
            <td>
              <span class="${tempAbn ? 'badge badge-abnormal' : ''}">${v.temp ? `${v.temp} °C` : '—'}</span>
            </td>
            <td>
              <span class="${o2Abn ? 'badge badge-abnormal' : ''}">${v.spo2 ? `${v.spo2}%` : '—'}</span>
            </td>
            <td>${v.cough || 'w/o'}</td>
            <td>
              <span class="${painAbn ? 'badge badge-abnormal' : ''}">${v.pain ? `${v.pain}/10` : '0/10'}</span>
            </td>
            <td>${v.intake ? `${v.intake} cc` : '—'}</td>
            <td>
              <div>U: ${v.urine ? `${v.urine} cc` : '—'}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">S: ${v.stool || '0'}</div>
            </td>
            <td style="font-size: 0.82rem;">${v.remarks || '—'}</td>
            <td style="white-space: nowrap; font-size: 0.82rem;">${v.takenBy || 'Nurse on Duty, RN'}</td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Vital Signs & Clinical Monitoring Sheet', 'WW-VIT-05')}

      <!-- Animated Vitals Trend Chart -->
      <div class="vitals-chart-card">
        <div class="vitals-chart-header">
          <h4 style="font-family: var(--font-sans); font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">
            Hemodynamic & Temperature Trends
          </h4>
          <div class="vitals-legend">
            <span class="legend-item"><span class="legend-dot" style="background-color: #3f603d;"></span> BP Systolic</span>
            <span class="legend-item"><span class="legend-dot" style="background-color: #60805e;"></span> BP Diastolic</span>
            <span class="legend-item"><span class="legend-dot" style="background-color: #d32f2f;"></span> Pulse (bpm)</span>
            <span class="legend-item"><span class="legend-dot" style="background-color: #000000;"></span> Temp (°C)</span>
            <span class="legend-item"><span class="legend-dot" style="background-color: #1976d2;"></span> RR (bpm)</span>
          </div>
        </div>
        <div id="vitals-chart-stage" class="chart-svg-container"></div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date/Shift/Time</th>
              <th>BP</th>
              <th>HR (bpm)</th>
              <th>RR (bpm)</th>
              <th>Temp</th>
              <th>SpO2</th>
              <th>Cough</th>
              <th>Pain</th>
              <th>Intake</th>
              <th>Output (U / S)</th>
              <th>Remarks</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    setTimeout(() => {
      const stage = container.querySelector('#vitals-chart-stage');
      if (stage) renderVitalsChart(stage, vitals);
    }, 50);

    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    let vitals = Array.isArray(patient.forms?.vitals) ? JSON.parse(JSON.stringify(patient.forms.vitals)) : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    function renderRows() {
      const tbody = container.querySelector('#vitals-tbody');
      if (!tbody) return;

      if (vitals.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="12" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No vital rows recorded. Click "+ Add Vitals Entry" below.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = vitals.map((v, idx) => `
        <tr>
          <td>
            <input type="datetime-local" class="form-control form-control-sm dt-val" data-idx="${idx}" value="${v.dateTime ? v.dateTime.substring(0, 16) : ''}" style="min-width: 150px;" />
            <select class="form-control form-control-sm shift-val" data-idx="${idx}" style="margin-top: 4px;">
              <option value="7-3" ${v.shift === '7-3' ? 'selected' : ''}>7-3</option>
              <option value="3-11" ${v.shift === '3-11' ? 'selected' : ''}>3-11</option>
              <option value="11-7" ${v.shift === '11-7' ? 'selected' : ''}>11-7</option>
            </select>
          </td>
          <td><input type="text" class="form-control form-control-sm bp-val" data-idx="${idx}" value="${v.bp || ''}" placeholder="120/80" style="width: 75px;" /></td>
          <td><input type="number" class="form-control form-control-sm hr-val" data-idx="${idx}" value="${v.pulse || v.hr || ''}" placeholder="80" style="width: 65px;" /></td>
          <td><input type="number" class="form-control form-control-sm rr-val" data-idx="${idx}" value="${v.rr || ''}" placeholder="18" style="width: 60px;" /></td>
          <td><input type="number" step="0.1" class="form-control form-control-sm temp-val" data-idx="${idx}" value="${v.temp || ''}" placeholder="36.5" style="width: 70px;" /></td>
          <td><input type="number" class="form-control form-control-sm spo2-val" data-idx="${idx}" value="${v.spo2 || ''}" placeholder="98" style="width: 65px;" /></td>
          <td>
            <select class="form-control form-control-sm cough-val" data-idx="${idx}" style="width: 75px;">
              <option value="w/o" ${v.cough === 'w/o' ? 'selected' : ''}>w/o</option>
              <option value="w" ${v.cough === 'w' ? 'selected' : ''}>w/</option>
            </select>
          </td>
          <td><input type="number" min="0" max="10" class="form-control form-control-sm pain-val" data-idx="${idx}" value="${v.pain || '0'}" style="width: 55px;" /></td>
          <td><input type="number" class="form-control form-control-sm intake-val" data-idx="${idx}" value="${v.intake || ''}" placeholder="cc" style="width: 70px;" /></td>
          <td>
            <input type="text" class="form-control form-control-sm urine-val" data-idx="${idx}" value="${v.urine || ''}" placeholder="Urine cc" style="width: 75px;" />
            <input type="text" class="form-control form-control-sm stool-val" data-idx="${idx}" value="${v.stool || ''}" placeholder="Stool" style="width: 75px; margin-top: 4px;" />
          </td>
          <td><input type="text" class="form-control form-control-sm rem-val" data-idx="${idx}" value="${v.remarks || ''}" placeholder="Remarks" style="min-width: 120px;" /></td>
          <td><input type="text" class="form-control form-control-sm nurse-val" data-idx="${idx}" value="${v.takenBy || 'Nurse, RN'}" style="min-width: 110px;" /></td>
          <td style="text-align: center;">
            <button type="button" class="btn btn-icon btn-sm btn-danger del-vit-btn" data-idx="${idx}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.dt-val').forEach(el => el.addEventListener('change', e => { vitals[parseInt(e.target.dataset.idx, 10)].dateTime = e.target.value; }));
      tbody.querySelectorAll('.shift-val').forEach(el => el.addEventListener('change', e => { vitals[parseInt(e.target.dataset.idx, 10)].shift = e.target.value; }));
      tbody.querySelectorAll('.bp-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].bp = e.target.value; }));
      tbody.querySelectorAll('.hr-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].pulse = e.target.value; }));
      tbody.querySelectorAll('.rr-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].rr = e.target.value; }));
      tbody.querySelectorAll('.temp-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].temp = e.target.value; }));
      tbody.querySelectorAll('.spo2-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].spo2 = e.target.value; }));
      tbody.querySelectorAll('.cough-val').forEach(el => el.addEventListener('change', e => { vitals[parseInt(e.target.dataset.idx, 10)].cough = e.target.value; }));
      tbody.querySelectorAll('.pain-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].pain = e.target.value; }));
      tbody.querySelectorAll('.intake-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].intake = e.target.value; }));
      tbody.querySelectorAll('.urine-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].urine = e.target.value; }));
      tbody.querySelectorAll('.stool-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].stool = e.target.value; }));
      tbody.querySelectorAll('.rem-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].remarks = e.target.value; }));
      tbody.querySelectorAll('.nurse-val').forEach(el => el.addEventListener('input', e => { vitals[parseInt(e.target.dataset.idx, 10)].takenBy = e.target.value; }));

      tbody.querySelectorAll('.del-vit-btn').forEach(btn => btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const confirmed = await showConfirm({
          title: 'Delete Vitals Entry',
          message: 'Are you sure you want to remove this vitals entry?',
          isDanger: true
        });
        if (confirmed) {
          vitals.splice(idx, 1);
          renderRows();
        }
      }));
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Vital Signs Monitoring (Edit Mode)', 'WW-VIT-05')}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div style="font-size: 0.84rem; color: var(--text-secondary);">
          Record patient vitals, oxygen saturation, pain scale, and intake/output balance.
        </div>
        <button type="button" class="btn btn-sm btn-secondary" id="btn-add-vit-row">
          + Add Vitals Entry
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date/Shift</th>
              <th>BP</th>
              <th>HR</th>
              <th>RR</th>
              <th>Temp</th>
              <th>SpO2</th>
              <th>Cough</th>
              <th>Pain</th>
              <th>Intake</th>
              <th>Output</th>
              <th>Remarks</th>
              <th>Nurse</th>
              <th>Act</th>
            </tr>
          </thead>
          <tbody id="vitals-tbody"></tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-outline" id="btn-cancel-vit">Cancel</button>
        <button type="button" class="btn btn-primary" id="btn-save-vit">Save All Vitals</button>
      </div>
    `;

    renderRows();

    container.querySelector('#btn-add-vit-row').addEventListener('click', () => {
      vitals.push({
        id: generateId('vit'),
        dateTime: getCurrentISODateTime(),
        shift: '7-3',
        bp: '120/80',
        pulse: '80',
        rr: '18',
        temp: '36.5',
        spo2: '98',
        cough: 'w/o',
        pain: '0',
        intake: '',
        urine: '',
        stool: '0',
        remarks: '',
        takenBy: 'Nurse on Duty, RN'
      });
      renderRows();
    });

    container.querySelector('#btn-save-vit').addEventListener('click', () => {
      onSave(vitals);
    });

    container.querySelector('#btn-cancel-vit').addEventListener('click', onCancel);

    return container;
  }
};
