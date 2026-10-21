// Form 7: Nursing Care Plan (NCP)
import { renderFormStandardHeader } from './common.js';
import { generateId } from '../utils/id.js';
import { showConfirm } from '../ui/confirm.js';

export const CarePlanForm = {
  renderView(patient, onEdit, onPrint) {
    const plans = Array.isArray(patient.forms?.carePlan) ? patient.forms.carePlan : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    let rowsHtml = '';
    if (plans.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No nursing care plans created yet. Click "Edit" or "Add Care Plan" to begin.
          </td>
        </tr>
      `;
    } else {
      plans.forEach((p) => {
        rowsHtml += `
          <tr>
            <td style="vertical-align: top; font-size: 0.85rem; line-height: 1.5;">${p.assessment || '—'}</td>
            <td style="vertical-align: top; font-weight: 600; font-size: 0.88rem; color: var(--sage-darker); line-height: 1.4;">${p.diagnosis || '—'}</td>
            <td style="vertical-align: top; font-size: 0.85rem; line-height: 1.5;">${p.goals || '—'}</td>
            <td style="vertical-align: top; font-size: 0.85rem; line-height: 1.5;">${p.interventions || '—'}</td>
            <td style="vertical-align: top; font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary);">${p.rationale || '—'}</td>
            <td style="vertical-align: top; font-size: 0.85rem; line-height: 1.5;">${p.evaluation || '—'}</td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Nursing Care Plan (NCP)', 'WW-NCP-07')}

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 17%;">Assessment / Cues</th>
              <th style="width: 18%;">Nursing Diagnosis</th>
              <th style="width: 17%;">Planning / Goals</th>
              <th style="width: 18%;">Nursing Interventions</th>
              <th style="width: 15%;">Scientific Rationale</th>
              <th style="width: 15%;">Evaluation</th>
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
    let plans = Array.isArray(patient.forms?.carePlan) ? JSON.parse(JSON.stringify(patient.forms.carePlan)) : [];

    const container = document.createElement('div');
    container.className = 'form-paper';

    function renderRows() {
      const tbody = container.querySelector('#ncp-tbody');
      if (!tbody) return;

      if (plans.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
              No care plans yet. Click "+ Add Care Plan Diagnosis" below.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = plans.map((p, idx) => `
        <tr>
          <td><textarea class="form-control form-control-sm ass-val" data-idx="${idx}" rows="3" placeholder="Subjective & Objective cues">${p.assessment || ''}</textarea></td>
          <td><textarea class="form-control form-control-sm diag-val" data-idx="${idx}" rows="3" placeholder="NANDA Diagnosis">${p.diagnosis || ''}</textarea></td>
          <td><textarea class="form-control form-control-sm goal-val" data-idx="${idx}" rows="3" placeholder="Goals & Outcomes">${p.goals || ''}</textarea></td>
          <td><textarea class="form-control form-control-sm int-val" data-idx="${idx}" rows="3" placeholder="Nursing actions">${p.interventions || ''}</textarea></td>
          <td><textarea class="form-control form-control-sm rat-val" data-idx="${idx}" rows="3" placeholder="Scientific rationale">${p.rationale || ''}</textarea></td>
          <td><textarea class="form-control form-control-sm eva-val" data-idx="${idx}" rows="3" placeholder="Evaluation statement">${p.evaluation || ''}</textarea></td>
          <td style="text-align: center; vertical-align: middle;">
            <button type="button" class="btn btn-icon btn-sm btn-danger del-ncp-btn" data-idx="${idx}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.ass-val').forEach(el => el.addEventListener('input', e => { plans[parseInt(e.target.dataset.idx, 10)].assessment = e.target.value; }));
      tbody.querySelectorAll('.diag-val').forEach(el => el.addEventListener('input', e => { plans[parseInt(e.target.dataset.idx, 10)].diagnosis = e.target.value; }));
      tbody.querySelectorAll('.goal-val').forEach(el => el.addEventListener('input', e => { plans[parseInt(e.target.dataset.idx, 10)].goals = e.target.value; }));
      tbody.querySelectorAll('.int-val').forEach(el => el.addEventListener('input', e => { plans[parseInt(e.target.dataset.idx, 10)].interventions = e.target.value; }));
      tbody.querySelectorAll('.rat-val').forEach(el => el.addEventListener('input', e => { plans[parseInt(e.target.dataset.idx, 10)].rationale = e.target.value; }));
      tbody.querySelectorAll('.eva-val').forEach(el => el.addEventListener('input', e => { plans[parseInt(e.target.dataset.idx, 10)].evaluation = e.target.value; }));

      tbody.querySelectorAll('.del-ncp-btn').forEach(btn => btn.addEventListener('click', async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const ok = await showConfirm({
          title: 'Delete Care Plan',
          message: 'Are you sure you want to remove this nursing diagnosis care plan?',
          isDanger: true
        });
        if (ok) {
          plans.splice(idx, 1);
          renderRows();
        }
      }));
    }

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'Nursing Care Plan (Edit Mode)', 'WW-NCP-07')}

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div style="font-size: 0.84rem; color: var(--text-secondary);">
          Formulate nursing diagnoses, SMART goals, interventions, rationale, and outcome evaluations.
        </div>
        <button type="button" class="btn btn-sm btn-secondary" id="btn-add-ncp-row">
          + Add Care Plan Diagnosis
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 17%;">Assessment / Cues</th>
              <th style="width: 18%;">Nursing Diagnosis</th>
              <th style="width: 17%;">Planning / Goals</th>
              <th style="width: 18%;">Interventions</th>
              <th style="width: 14%;">Rationale</th>
              <th style="width: 12%;">Evaluation</th>
              <th style="width: 4%; text-align: center;">Act</th>
            </tr>
          </thead>
          <tbody id="ncp-tbody"></tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
        <button type="button" class="btn btn-outline" id="btn-cancel-ncp">Cancel</button>
        <button type="button" class="btn btn-primary" id="btn-save-ncp">Save Care Plans</button>
      </div>
    `;

    renderRows();

    container.querySelector('#btn-add-ncp-row').addEventListener('click', () => {
      plans.push({
        id: generateId('ncp'),
        assessment: 'Subjective: \nObjective: ',
        diagnosis: '',
        goals: '',
        interventions: '',
        rationale: '',
        evaluation: 'Goal Ongoing'
      });
      renderRows();
    });

    container.querySelector('#btn-save-ncp').addEventListener('click', () => {
      onSave(plans);
    });

    container.querySelector('#btn-cancel-ncp').addEventListener('click', onCancel);

    return container;
  }
};
