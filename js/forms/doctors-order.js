// Form 4: Doctor's Orders / Nurses Compliance Sheet
import { renderFormStandardHeader } from './common.js';
import { formatDate, getCurrentISODateTime, getCurrentISODate, getCurrentISOTime } from '../utils/dates.js';
import { generateId } from '../utils/id.js';
import { showConfirm } from '../ui/confirm.js';
import { Modal } from '../ui/modal.js';

export const DoctorsOrderForm = {
  renderView(patient, onEdit, onPrint) {
    const orders = Array.isArray(patient.forms?.doctorsOrders) ? patient.forms.doctorsOrders : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    let rowsHtml = '';
    if (orders.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No doctor's orders recorded yet. Click "Edit" or "Add Order" to begin recording orders.
          </td>
        </tr>
      `;
    } else {
      orders.forEach((ord) => {
        const comp = ord.compliance || 'C';
        rowsHtml += `
          <tr>
            <td style="white-space: nowrap;">
              <div>${formatDate(ord.dateTime, 'short')}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${formatDate(ord.dateTime, 'time')} [${ord.shift || '7-3'}]</div>
            </td>
            <td>${ord.progressNotes || '—'}</td>
            <td>
              <div style="font-weight: 500;">${ord.orderText || '—'}</div>
              <div style="margin-top: 0.25rem;">
                <span class="badge-tag">${ord.type || 'medication'}</span>
                <span class="badge ${ord.status === 'Active' ? 'badge-admitted' : ord.status === 'Discontinued' ? 'badge-discharged' : 'badge-fordischarge'}" style="font-size: 0.7rem; padding: 0.15rem 0.45rem;">
                  ${ord.status || 'Active'}
                </span>
              </div>
            </td>
            <td style="text-align: center;">
              <span class="badge ${comp === 'C' ? 'badge-admitted' : comp === 'A' ? 'badge-tag' : comp === 'D' ? 'badge-discharged' : 'badge-fordischarge'}" style="font-weight: 700;">
                ${comp}
              </span>
            </td>
            <td>
              <div>${ord.notedBy || 'Nurse on Duty, RN'}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${ord.timePosted || '—'}</div>
            </td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, "Doctor's Orders / Nurses Compliance Sheet", 'WW-ORD-04')}

      <!-- Compliance Legend as seen in reference -->
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; background-color: var(--mist); padding: 0.65rem 1rem; border-radius: var(--radius-md); font-size: 0.8rem; margin-bottom: 1.25rem; border: 1px solid var(--border-light);">
        <span><strong>COMPLIANCE LEGEND:</strong></span>
        <span><strong>C</strong> - Carried</span>
        <span><strong>A</strong> - Administered</span>
        <span><strong>R</strong> - Requested</span>
        <span><strong>E</strong> - Endorsed</span>
        <span><strong>D</strong> - Discontinued</span>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 130px;">Date / Time / Shift</th>
              <th style="width: 140px;">Progress Notes</th>
              <th>Doctor's Order</th>
              <th style="width: 90px; text-align: center;">Compliance</th>
              <th style="width: 140px;">Time Posted / Signature</th>
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
    let orders = Array.isArray(patient.forms?.doctorsOrders) ? JSON.parse(JSON.stringify(patient.forms.doctorsOrders)) : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    function renderOrderRows() {
      const tbody = container.querySelector('#orders-tbody');
      if (!tbody) return;

      if (orders.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No doctor's orders yet. Click "+ Add Doctor's Order" below.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = orders.map((ord, idx) => `
        <tr>
          <td>
            <input type="datetime-local" class="form-control form-control-sm dt-input" data-idx="${idx}" value="${ord.dateTime ? ord.dateTime.substring(0, 16) : ''}" style="min-width: 160px;" />
            <select class="form-control form-control-sm shift-input" data-idx="${idx}" style="margin-top: 4px;">
              <option value="7-3" ${ord.shift === '7-3' ? 'selected' : ''}>7am - 3pm</option>
              <option value="3-11" ${ord.shift === '3-11' ? 'selected' : ''}>3pm - 11pm</option>
              <option value="11-7" ${ord.shift === '11-7' ? 'selected' : ''}>11pm - 7am</option>
            </select>
          </td>
          <td>
            <input type="text" class="form-control form-control-sm prog-input" data-idx="${idx}" value="${ord.progressNotes || ''}" placeholder="e.g. For Labs, NPO" />
          </td>
          <td>
            <textarea class="form-control form-control-sm text-input" data-idx="${idx}" rows="2">${ord.orderText || ''}</textarea>
            <div style="display: flex; gap: 0.5rem; margin-top: 4px;">
              <select class="form-control form-control-sm type-input" data-idx="${idx}">
                <option value="medication" ${ord.type === 'medication' ? 'selected' : ''}>Medication</option>
                <option value="IV" ${ord.type === 'IV' ? 'selected' : ''}>IV Solution</option>
                <option value="labs" ${ord.type === 'labs' ? 'selected' : ''}>Laboratory</option>
                <option value="imaging" ${ord.type === 'imaging' ? 'selected' : ''}>Imaging / Diagnostic</option>
                <option value="diet" ${ord.type === 'diet' ? 'selected' : ''}>Diet</option>
                <option value="monitoring" ${ord.type === 'monitoring' ? 'selected' : ''}>Monitoring / Vitals</option>
              </select>
              <select class="form-control form-control-sm status-input" data-idx="${idx}">
                <option value="Active" ${ord.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Done" ${ord.status === 'Done' ? 'selected' : ''}>Done</option>
                <option value="Discontinued" ${ord.status === 'Discontinued' ? 'selected' : ''}>Discontinued</option>
              </select>
            </div>
          </td>
          <td>
            <select class="form-control form-control-sm comp-input" data-idx="${idx}">
              <option value="C" ${ord.compliance === 'C' ? 'selected' : ''}>C (Carried)</option>
              <option value="A" ${ord.compliance === 'A' ? 'selected' : ''}>A (Administered)</option>
              <option value="R" ${ord.compliance === 'R' ? 'selected' : ''}>R (Requested)</option>
              <option value="E" ${ord.compliance === 'E' ? 'selected' : ''}>E (Endorsed)</option>
              <option value="D" ${ord.compliance === 'D' ? 'selected' : ''}>D (Discontinued)</option>
            </select>
          </td>
          <td>
            <input type="text" class="form-control form-control-sm nurse-input" data-idx="${idx}" value="${ord.notedBy || 'Staff Nurse, RN'}" placeholder="Nurse Signature" />
            <input type="text" class="form-control form-control-sm time-input" data-idx="${idx}" value="${ord.timePosted || getCurrentISOTime()}" placeholder="Time Posted" style="margin-top: 4px;" />
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn btn-icon btn-sm btn-danger del-btn" data-idx="${idx}" title="Delete Row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `).join('');

      // Attach row change listeners
      tbody.querySelectorAll('.dt-input').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].dateTime = e.target.value;
      }));
      tbody.querySelectorAll('.shift-input').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].shift = e.target.value;
      }));
      tbody.querySelectorAll('.prog-input').forEach(el => el.addEventListener('input', e => {
        orders[parseInt(e.target.dataset.idx, 10)].progressNotes = e.target.value;
      }));
      tbody.querySelectorAll('.text-input').forEach(el => el.addEventListener('input', e => {
        orders[parseInt(e.target.dataset.idx, 10)].orderText = e.target.value;
      }));
      tbody.querySelectorAll('.type-input').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].type = e.target.value;
      }));
      tbody.querySelectorAll('.status-input').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].status = e.target.value;
      }));
      tbody.querySelectorAll('.comp-input').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].compliance = e.target.value;
      }));
      tbody.querySelectorAll('.nurse-input').forEach(el => el.addEventListener('input', e => {
        orders[parseInt(e.target.dataset.idx, 10)].notedBy = e.target.value;
      }));
      tbody.querySelectorAll('.time-input').forEach(el => el.addEventListener('input', e => {
        orders[parseInt(e.target.dataset.idx, 10)].timePosted = e.target.value;
      }));
      tbody.querySelectorAll('.del-btn').forEach(btn => btn.addEventListener('click', async (e) => {
        const idx = parseInt(btn.dataset.idx, 10);
        const confirmDel = await showConfirm({
          title: 'Delete Order',
          message: 'Are you sure you want to remove this doctor\'s order row?',
          confirmText: 'Delete Row',
          isDanger: true
        });
        if (confirmDel) {
          orders.splice(idx, 1);
          renderOrderRows();
        }
      }));
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, "Doctor's Orders / Nurses Compliance Sheet (Edit Mode)", 'WW-ORD-04')}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div style="font-size: 0.84rem; color: var(--text-secondary);">
          Add, modify, or update compliance status for physician orders.
        </div>
        <button type="button" class="btn btn-sm btn-secondary" id="btn-add-order-row">
          + Add Doctor's Order
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 170px;">Date/Time & Shift</th>
              <th style="width: 140px;">Progress Notes</th>
              <th>Doctor's Order & Tag</th>
              <th style="width: 130px;">Compliance</th>
              <th style="width: 140px;">Nurse & Time</th>
              <th style="width: 50px; text-align: center;">Act</th>
            </tr>
          </thead>
          <tbody id="orders-tbody">
          </tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-outline" id="btn-cancel-orders">Cancel</button>
        <button type="button" class="btn btn-primary" id="btn-save-orders">Save All Orders</button>
      </div>
    `;

    renderOrderRows();

    container.querySelector('#btn-add-order-row').addEventListener('click', () => {
      orders.push({
        id: generateId('ord'),
        dateTime: getCurrentISODateTime(),
        shift: '7-3',
        progressNotes: '',
        orderText: '',
        type: 'medication',
        status: 'Active',
        compliance: 'C',
        notedBy: 'Staff Nurse, RN',
        timePosted: getCurrentISOTime()
      });
      renderOrderRows();
    });

    container.querySelector('#btn-save-orders').addEventListener('click', () => {
      onSave(orders);
    });

    container.querySelector('#btn-cancel-orders').addEventListener('click', onCancel);

    return container;
  }
};
