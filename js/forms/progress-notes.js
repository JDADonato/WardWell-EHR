// Form 9: Nurse's Progress Notes
import { renderFormStandardHeader } from './common.js';
import { formatDate, getCurrentISODateTime } from '../utils/dates.js';
import { generateId } from '../utils/id.js';
import { showConfirm } from '../ui/confirm.js';

export const ProgressNotesForm = {
  renderView(patient, onEdit, onPrint) {
    let notes = Array.isArray(patient.forms?.progressNotes) ? [...patient.forms.progressNotes] : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    let newestFirst = true;

    function buildNotesHtml() {
      const sorted = [...notes].sort((a, b) => {
        const da = new Date(a.dateTime || 0);
        const db = new Date(b.dateTime || 0);
        return newestFirst ? db - da : da - db;
      });

      if (sorted.length === 0) {
        return `
          <tr>
            <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No progress notes recorded yet.
            </td>
          </tr>
        `;
      }

      return sorted.map((n) => `
        <tr>
          <td style="white-space: nowrap; vertical-align: top; width: 140px;">
            <div style="font-weight: 600;">${formatDate(n.dateTime, 'short')}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${formatDate(n.dateTime, 'time')} [${n.shift || '7-3'}]</div>
          </td>
          <td style="vertical-align: top; width: 180px; font-weight: 600; color: var(--sage-darker);">
            ${n.focus || 'Routine Inpatient Care'}
          </td>
          <td style="vertical-align: top; white-space: pre-wrap; font-size: 0.88rem; line-height: 1.6;">${n.note || '—'}</td>
          <td style="white-space: nowrap; vertical-align: top; width: 160px; font-size: 0.82rem;">
            <div style="font-weight: 600; font-family: var(--font-serif); color: var(--sage-dark);">${n.signature || 'Staff Nurse, RN'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">License Verified</div>
          </td>
        </tr>
      `).join('');
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, "Nurse's Progress Notes (Focus / DAR Format)", 'WW-NPN-09')}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div style="font-size: 0.84rem; color: var(--text-secondary);">
          Structured chronological clinical notes following Data &bull; Action &bull; Response (DAR).
        </div>
        <button type="button" class="btn btn-sm btn-outline no-print" id="btn-toggle-sort">
          Sort: Newest First &darr;
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date / Time / Shift</th>
              <th>Focus</th>
              <th>D - DATA &bull; A - ACTION &bull; R - RESPONSE</th>
              <th>Nurse Signature</th>
            </tr>
          </thead>
          <tbody id="notes-tbody">
            ${buildNotesHtml()}
          </tbody>
        </table>
      </div>
    `;

    const sortBtn = container.querySelector('#btn-toggle-sort');
    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        newestFirst = !newestFirst;
        sortBtn.textContent = `Sort: ${newestFirst ? 'Newest First ↓' : 'Oldest First ↑'}`;
        container.querySelector('#notes-tbody').innerHTML = buildNotesHtml();
      });
    }

    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    let notes = Array.isArray(patient.forms?.progressNotes) ? JSON.parse(JSON.stringify(patient.forms.progressNotes)) : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    function renderRows() {
      const tbody = container.querySelector('#notes-edit-tbody');
      if (!tbody) return;

      if (notes.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No progress note entries. Click "+ Add DAR Note" below.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = notes.map((n, idx) => `
        <tr>
          <td>
            <input type="datetime-local" class="form-control form-control-sm dt-val" data-idx="${idx}" value="${n.dateTime ? n.dateTime.substring(0, 16) : ''}" style="min-width: 150px;" />
            <select class="form-control form-control-sm shift-val" data-idx="${idx}" style="margin-top: 4px;">
              <option value="7-3" ${n.shift === '7-3' ? 'selected' : ''}>7-3 (Day)</option>
              <option value="3-11" ${n.shift === '3-11' ? 'selected' : ''}>3-11 (Eve)</option>
              <option value="11-7" ${n.shift === '11-7' ? 'selected' : ''}>11-7 (Night)</option>
            </select>
          </td>
          <td>
            <input type="text" class="form-control form-control-sm focus-val" data-idx="${idx}" value="${n.focus || ''}" placeholder="e.g. Pain Management, Respiratory" style="min-width: 140px;" />
          </td>
          <td>
            <textarea class="form-control form-control-sm note-val" data-idx="${idx}" rows="4" placeholder="D > (Data)\nA > (Action)\nR > (Response)">${n.note || ''}</textarea>
          </td>
          <td>
            <input type="text" class="form-control form-control-sm sig-val" data-idx="${idx}" value="${n.signature || 'Staff Nurse, RN'}" placeholder="Nurse Signature" style="min-width: 130px;" />
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn btn-icon btn-sm btn-danger del-note-btn" data-idx="${idx}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.dt-val').forEach(el => el.addEventListener('change', e => { notes[parseInt(e.target.dataset.idx, 10)].dateTime = e.target.value; }));
      tbody.querySelectorAll('.shift-val').forEach(el => el.addEventListener('change', e => { notes[parseInt(e.target.dataset.idx, 10)].shift = e.target.value; }));
      tbody.querySelectorAll('.focus-val').forEach(el => el.addEventListener('input', e => { notes[parseInt(e.target.dataset.idx, 10)].focus = e.target.value; }));
      tbody.querySelectorAll('.note-val').forEach(el => el.addEventListener('input', e => { notes[parseInt(e.target.dataset.idx, 10)].note = e.target.value; }));
      tbody.querySelectorAll('.sig-val').forEach(el => el.addEventListener('input', e => { notes[parseInt(e.target.dataset.idx, 10)].signature = e.target.value; }));

      tbody.querySelectorAll('.del-note-btn').forEach(btn => btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const ok = await showConfirm({
          title: 'Delete Progress Note',
          message: 'Are you sure you want to remove this progress note entry?',
          isDanger: true
        });
        if (ok) {
          notes.splice(idx, 1);
          renderRows();
        }
      }));
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, "Nurse's Progress Notes (Edit Mode)", 'WW-NPN-09')}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div style="font-size: 0.84rem; color: var(--text-secondary);">
          Add or edit DAR (Data, Action, Response) clinical notes.
        </div>
        <button type="button" class="btn btn-sm btn-secondary" id="btn-add-note-row">
          + Add DAR Note
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 160px;">Date & Shift</th>
              <th style="width: 160px;">Focus</th>
              <th>D &bull; A &bull; R Note Text</th>
              <th style="width: 150px;">Nurse Signature</th>
              <th style="width: 50px; text-align: center;">Act</th>
            </tr>
          </thead>
          <tbody id="notes-edit-tbody"></tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-outline" id="btn-cancel-notes">Cancel</button>
        <button type="button" class="btn btn-primary" id="btn-save-notes">Save Notes</button>
      </div>
    `;

    renderRows();

    container.querySelector('#btn-add-note-row').addEventListener('click', () => {
      notes.push({
        id: generateId('pn'),
        dateTime: getCurrentISODateTime(),
        shift: '7-3',
        focus: '',
        note: 'D > \nA > \nR > ',
        signature: 'Staff Nurse, RN'
      });
      renderRows();
    });

    container.querySelector('#btn-save-notes').addEventListener('click', () => {
      onSave(notes);
    });

    container.querySelector('#btn-cancel-notes').addEventListener('click', onCancel);

    return container;
  }
};
