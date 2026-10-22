// Form 4: Doctor's Orders / Nurses Compliance Sheet
import { renderFormStandardHeader, renderImmutableNotice } from './common.js';
import { formatDate, getCurrentISODateTime, getCurrentISODate, getCurrentISOTime } from '../utils/dates.js';
import { generateId } from '../utils/id.js';
import { showConfirm } from '../ui/confirm.js';
import { Modal } from '../ui/modal.js';
import { Store } from '../store.js';
import { Toast } from '../ui/toast.js';

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

    const phys = patient.attendingPhysician || '—';
    const physicianSlot = `
      <div class="strip-item strip-item-physician" id="doc-order-physician-box">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
          <span class="strip-label" style="margin-bottom: 0;">Attending Physician</span>
          <button type="button" class="btn-text-action no-print" id="btn-edit-doctor-inline" title="Click to change doctor's name" style="font-size: 0.72rem; color: var(--sage-dark); font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; display: inline-flex; align-items: center; gap: 0.25rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Change</span>
          </button>
        </div>
        <div id="doc-order-physician-view" class="strip-value" title="${phys}" style="cursor: pointer;">
          ${phys}
        </div>
        <div id="doc-order-physician-edit" class="no-print" style="display: none; margin-top: 0.35rem;">
          <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
            <input type="text" id="input-inline-doctor-name" class="form-control form-control-sm" value="${patient.attendingPhysician || ''}" placeholder="Dr. Full Name, MD (Specialty)" style="flex: 1; min-width: 160px; height: 32px; font-size: 0.82rem;" />
            <button type="button" class="btn btn-primary btn-sm" id="btn-save-inline-doctor" style="height: 32px; padding: 0 0.65rem; font-size: 0.78rem; font-weight: 600;">Save</button>
            <button type="button" class="btn btn-outline btn-sm" id="btn-cancel-inline-doctor" style="height: 32px; padding: 0 0.5rem; font-size: 0.78rem;">✕</button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = `
      ${renderFormStandardHeader(patient, "Doctor's Orders / Nurses Compliance Sheet", 'WW-ORD-04', { physicianSlot })}

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

    // Wire up inline doctor's name change
    const btnEditDoc = container.querySelector('#btn-edit-doctor-inline');
    const viewDoc = container.querySelector('#doc-order-physician-view');
    const editDoc = container.querySelector('#doc-order-physician-edit');
    const inputDoc = container.querySelector('#input-inline-doctor-name');
    const btnSaveDoc = container.querySelector('#btn-save-inline-doctor');
    const btnCancelDoc = container.querySelector('#btn-cancel-inline-doctor');

    function openDocEdit() {
      if (!editDoc || !viewDoc) return;
      viewDoc.style.display = 'none';
      if (btnEditDoc) btnEditDoc.style.display = 'none';
      editDoc.style.display = 'block';
      inputDoc?.focus();
      inputDoc?.select();
    }

    function closeDocEdit() {
      if (!editDoc || !viewDoc) return;
      editDoc.style.display = 'none';
      viewDoc.style.display = 'block';
      if (btnEditDoc) btnEditDoc.style.display = 'inline-flex';
    }

    function saveDocEdit() {
      const newDoc = inputDoc?.value.trim();
      if (!newDoc) return;
      patient.attendingPhysician = newDoc;
      Store.savePatient(patient);
      Toast.success(`Attending physician updated to "${newDoc}".`, 'Doctor Updated');
      if (viewDoc) {
        viewDoc.textContent = newDoc;
        viewDoc.title = newDoc;
      }
      const bannerDoc = document.getElementById('banner-doctor-val');
      if (bannerDoc) bannerDoc.textContent = newDoc;
      closeDocEdit();
    }

    btnEditDoc?.addEventListener('click', openDocEdit);
    viewDoc?.addEventListener('click', openDocEdit);
    btnCancelDoc?.addEventListener('click', closeDocEdit);
    btnSaveDoc?.addEventListener('click', saveDocEdit);
    inputDoc?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveDocEdit();
      } else if (e.key === 'Escape') {
        closeDocEdit();
      }
    });

    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    let orders = Array.isArray(patient.forms?.doctorsOrders) ? JSON.parse(JSON.stringify(patient.forms.doctorsOrders)) : [];
    const initialOrdersCount = orders.length;

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

      tbody.innerHTML = orders.map((ord, idx) => {
        const isLocked = idx < initialOrdersCount;
        const lockAttr = isLocked ? 'disabled' : '';
        const lockRowClass = isLocked ? 'locked-record-row' : '';

        return `
          <tr class="${lockRowClass}">
            <td>
              <input type="datetime-local" class="form-control form-control-sm dt-input" data-idx="${idx}" value="${ord.dateTime ? ord.dateTime.substring(0, 16) : ''}" style="min-width: 160px;" ${lockAttr} />
              <select class="form-control form-control-sm shift-input" data-idx="${idx}" style="margin-top: 4px;" ${lockAttr}>
                <option value="7-3" ${ord.shift === '7-3' ? 'selected' : ''}>7am - 3pm</option>
                <option value="3-11" ${ord.shift === '3-11' ? 'selected' : ''}>3pm - 11pm</option>
                <option value="11-7" ${ord.shift === '11-7' ? 'selected' : ''}>11pm - 7am</option>
              </select>
            </td>
            <td>
              <input type="text" class="form-control form-control-sm prog-input" data-idx="${idx}" value="${ord.progressNotes || ''}" placeholder="e.g. For Labs, NPO" ${lockAttr} />
            </td>
            <td>
              <textarea class="form-control form-control-sm text-input" data-idx="${idx}" rows="2" ${lockAttr}>${ord.orderText || ''}</textarea>
              <div style="display: flex; gap: 0.5rem; margin-top: 4px;">
                <select class="form-control form-control-sm type-input" data-idx="${idx}" ${lockAttr}>
                  <option value="medication" ${ord.type === 'medication' ? 'selected' : ''}>Medication</option>
                  <option value="IV" ${ord.type === 'IV' ? 'selected' : ''}>IV Solution</option>
                  <option value="labs" ${ord.type === 'labs' ? 'selected' : ''}>Laboratory</option>
                  <option value="imaging" ${ord.type === 'imaging' ? 'selected' : ''}>Imaging / Diagnostic</option>
                  <option value="diet" ${ord.type === 'diet' ? 'selected' : ''}>Diet</option>
                  <option value="monitoring" ${ord.type === 'monitoring' ? 'selected' : ''}>Monitoring / Vitals</option>
                </select>
                <select class="form-control form-control-sm status-input" data-idx="${idx}" ${lockAttr}>
                  <option value="Active" ${ord.status === 'Active' ? 'selected' : ''}>Active</option>
                  <option value="Done" ${ord.status === 'Done' ? 'selected' : ''}>Done</option>
                  <option value="Discontinued" ${ord.status === 'Discontinued' ? 'selected' : ''}>Discontinued</option>
                </select>
              </div>
            </td>
            <td>
              <select class="form-control form-control-sm comp-input" data-idx="${idx}" ${lockAttr}>
                <option value="C" ${ord.compliance === 'C' ? 'selected' : ''}>C (Carried)</option>
                <option value="A" ${ord.compliance === 'A' ? 'selected' : ''}>A (Administered)</option>
                <option value="R" ${ord.compliance === 'R' ? 'selected' : ''}>R (Requested)</option>
                <option value="E" ${ord.compliance === 'E' ? 'selected' : ''}>E (Endorsed)</option>
                <option value="D" ${ord.compliance === 'D' ? 'selected' : ''}>D (Discontinued)</option>
              </select>
            </td>
            <td>
              <input type="text" class="form-control form-control-sm nurse-input" data-idx="${idx}" value="${ord.notedBy || 'Staff Nurse, RN'}" placeholder="Nurse Signature" ${lockAttr} />
              <input type="text" class="form-control form-control-sm time-input" data-idx="${idx}" value="${ord.timePosted || getCurrentISOTime()}" placeholder="Time Posted" style="margin-top: 4px;" ${lockAttr} />
            </td>
            <td style="text-align: center;">
              ${isLocked ? `
                <span class="locked-badge-pill" title="Locked clinical record (Permanent medical entry)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  Locked
                </span>
              ` : `
                <button type="button" class="btn btn-icon btn-sm btn-danger del-btn" data-idx="${idx}" title="Delete Row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              `}
            </td>
          </tr>
        `;
      }).join('');

      // Attach row change listeners for editable rows
      tbody.querySelectorAll('.dt-input:not([disabled])').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].dateTime = e.target.value;
      }));
      tbody.querySelectorAll('.shift-input:not([disabled])').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].shift = e.target.value;
      }));
      tbody.querySelectorAll('.prog-input:not([disabled])').forEach(el => el.addEventListener('input', e => {
        orders[parseInt(e.target.dataset.idx, 10)].progressNotes = e.target.value;
      }));
      tbody.querySelectorAll('.text-input:not([disabled])').forEach(el => el.addEventListener('input', e => {
        orders[parseInt(e.target.dataset.idx, 10)].orderText = e.target.value;
      }));
      tbody.querySelectorAll('.type-input:not([disabled])').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].type = e.target.value;
      }));
      tbody.querySelectorAll('.status-input:not([disabled])').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].status = e.target.value;
      }));
      tbody.querySelectorAll('.comp-input:not([disabled])').forEach(el => el.addEventListener('change', e => {
        orders[parseInt(e.target.dataset.idx, 10)].compliance = e.target.value;
      }));
      tbody.querySelectorAll('.nurse-input:not([disabled])').forEach(el => el.addEventListener('input', e => {
        orders[parseInt(e.target.dataset.idx, 10)].notedBy = e.target.value;
      }));
      tbody.querySelectorAll('.time-input:not([disabled])').forEach(el => el.addEventListener('input', e => {
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

    const editPhysicianSlot = `
      <div class="strip-item strip-item-physician" style="background-color: var(--mist); border-radius: var(--radius-sm); padding: 0.35rem 0.55rem; border: 1px solid var(--border-color);">
        <label class="strip-label" for="edit-order-physician" style="display: block; margin-bottom: 0.2rem; font-weight: 700; color: var(--sage-dark);">Attending Physician</label>
        <input type="text" id="edit-order-physician" class="form-control form-control-sm" value="${patient.attendingPhysician || ''}" placeholder="Dr. Full Name, MD (Specialty)" style="height: 32px; font-size: 0.85rem; font-weight: 600; background-color: var(--bg-surface);" />
      </div>
    `;

    container.innerHTML = `
      ${renderFormStandardHeader(patient, "Doctor's Orders / Nurses Compliance Sheet (Edit Mode)", 'WW-ORD-04', { physicianSlot: editPhysicianSlot })}

      ${renderImmutableNotice("Doctor's Orders", "Previously recorded physician orders are permanent legal entries and cannot be altered or removed. New orders can be added below. Attending Physician can still be updated above.")}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div style="font-size: 0.84rem; color: var(--text-secondary);">
          Add new orders and manage current physician directives.
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
              <th style="width: 75px; text-align: center;">Status</th>
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
      const docInput = container.querySelector('#edit-order-physician');
      const attendingPhysician = docInput ? docInput.value.trim() : patient.attendingPhysician;
      onSave({ orders, attendingPhysician });
    });

    container.querySelector('#btn-cancel-orders').addEventListener('click', onCancel);

    return container;
  }
};
