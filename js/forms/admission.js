// Form 1: Patient Information & Admission Form
import { renderFormStandardHeader } from './common.js';
import { formatDate, calculateAge, getCurrentISODate, getCurrentISOTime } from '../utils/dates.js';

export const AdmissionForm = {
  renderView(patient, onEdit, onPrint) {
    const f = patient.forms?.admission || {};
    const fullName = `${patient.lastName}, ${patient.firstName} ${patient.middleName || ''}`.trim();

    const container = document.createElement('div');
    container.className = 'form-paper';
    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'General Hospital Admission Form', 'WW-ADM-01')}

      <!-- 1. Patient Information -->
      <section class="form-section">
        <h3 class="form-section-title">1. Patient Information</h3>
        <div class="grid-2">
          <div class="view-field">
            <span class="view-label">Full Name</span>
            <span class="view-value">${fullName || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Date of Birth (Age)</span>
            <span class="view-value">${formatDate(patient.dob, 'short')} (${patient.age || '—'} yrs)</span>
          </div>
          <div class="view-field">
            <span class="view-label">Gender / Sex</span>
            <span class="view-value">${patient.sex || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Marital Status</span>
            <span class="view-value">${patient.civilStatus || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Nationality</span>
            <span class="view-value">${patient.nationality || 'Filipino'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Religion</span>
            <span class="view-value">${patient.religion || '—'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Home Address</span>
            <span class="view-value">${patient.address || '—'}, ${patient.cityStateZip || ''}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Contact Phone</span>
            <span class="view-value">${patient.phone || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Email Address</span>
            <span class="view-value">${patient.email || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Occupation</span>
            <span class="view-value">${patient.occupation || '—'}</span>
          </div>
        </div>
      </section>

      <!-- 2. Insurance & Payment Information -->
      <section class="form-section">
        <h3 class="form-section-title">2. Insurance & Payment Information</h3>
        <div class="grid-3">
          <div class="view-field">
            <span class="view-label">Insurance Provider</span>
            <span class="view-value">${patient.insuranceProvider || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Policy / PhilHealth No.</span>
            <span class="view-value">${patient.philhealthNo || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Payment Method</span>
            <span class="view-value">${patient.paymentMethod || 'Insurance'}</span>
          </div>
        </div>
      </section>

      <!-- 3. Emergency Contact -->
      <section class="form-section">
        <h3 class="form-section-title">3. Emergency Contact</h3>
        <div class="grid-3">
          <div class="view-field">
            <span class="view-label">Emergency Contact Name</span>
            <span class="view-value">${patient.emergencyContact?.name || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Relationship</span>
            <span class="view-value">${patient.emergencyContact?.relationship || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Contact Phone</span>
            <span class="view-value">${patient.emergencyContact?.phone || '—'}</span>
          </div>
        </div>
      </section>

      <!-- 4. Admission Details -->
      <section class="form-section">
        <h3 class="form-section-title">4. Admission Details</h3>
        <div class="grid-2">
          <div class="view-field">
            <span class="view-label">Date & Time of Admission</span>
            <span class="view-value">${formatDate(patient.admissionDate, 'datetime')}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Department / Ward</span>
            <span class="view-value">${patient.department || 'Internal Medicine'} (${patient.roomBed || '—'})</span>
          </div>
          <div class="view-field">
            <span class="view-label">Attending Physician</span>
            <span class="view-value">${patient.attendingPhysician || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Referred By</span>
            <span class="view-value">${f.referredBy || 'Direct Walk-in / ER'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Admitting Diagnosis / Reason for Admission</span>
            <span class="view-value">${patient.admittingDiagnosis || f.reasonForAdmission || '—'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Chief Complaint</span>
            <span class="view-value">${patient.chiefComplaint || '—'}</span>
          </div>
        </div>
      </section>

      <!-- 5. Medical Information -->
      <section class="form-section">
        <h3 class="form-section-title">5. Medical Information</h3>
        <div class="grid-2">
          <div class="view-field">
            <span class="view-label">Blood Group</span>
            <span class="view-value font-mono">${f.bloodGroup || '—'}</span>
          </div>
          <div class="view-field">
            <span class="view-label">Allergies</span>
            <span class="view-value ${patient.allergies && !patient.allergies.toLowerCase().includes('none') ? 'allergy-pill' : ''}">
              ${patient.allergies || 'None Known'}
            </span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Current Medications</span>
            <span class="view-value">${f.currentMedications || 'None reported'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Past Medical History</span>
            <span class="view-value">${f.pastMedicalHistory || 'Non-contributory'}</span>
          </div>
          <div class="view-field col-span-2">
            <span class="view-label">Previous Surgeries</span>
            <span class="view-value">${f.previousSurgeries || 'None'}</span>
          </div>
        </div>
      </section>

      <!-- 6. Consent & Declaration -->
      <section class="form-section">
        <h3 class="form-section-title">6. Consent & Declaration</h3>
        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem;">
          I, <u>${fullName || 'the undersigned'}</u>, consent to be admitted to <strong>WardWell General Hospital</strong> and agree to follow all hospital rules and regulations. I hereby authorize the hospital medical staff to provide necessary medical examination, nursing care, and treatment as per attending physician's clinical judgment.
        </p>
        <div class="grid-2">
          <div class="view-field">
            <span class="view-label">Patient / Guardian Signature</span>
            <span class="view-value" style="font-family: var(--font-serif); font-size: 1.1rem; color: var(--sage-dark);">
              ${f.patientSignature || fullName || 'Signed upon admission'}
            </span>
          </div>
          <div class="view-field">
            <span class="view-label">Admitting Clerk / Date</span>
            <span class="view-value">${f.admittingClerk || 'Admitting Officer on Duty'} — ${formatDate(patient.admissionDate, 'short')}</span>
          </div>
        </div>
      </section>
    `;

    return container;
  },

  renderEdit(patient, onSave, onCancel) {
    const f = patient.forms?.admission || {};
    const container = document.createElement('div');
    container.className = 'form-paper';

    const admDateIso = patient.admissionDate ? patient.admissionDate.split('T')[0] : getCurrentISODate();
    const admTimeIso = patient.admissionDate && patient.admissionDate.includes('T') ? patient.admissionDate.split('T')[1].substring(0, 5) : getCurrentISOTime();

    container.innerHTML = `
      ${renderFormStandardHeader(patient, 'General Hospital Admission Form (Edit Mode)', 'WW-ADM-01')}

      <form id="admission-form">
        <!-- 1. Patient Information -->
        <section class="form-section">
          <h3 class="form-section-title">1. Patient Information</h3>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label" for="adm-lastName">Last Name <span class="required">*</span></label>
              <input type="text" id="adm-lastName" class="form-control" value="${patient.lastName || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-firstName">First Name <span class="required">*</span></label>
              <input type="text" id="adm-firstName" class="form-control" value="${patient.firstName || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-middleName">Middle Name</label>
              <input type="text" id="adm-middleName" class="form-control" value="${patient.middleName || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="adm-dob">Date of Birth <span class="required">*</span></label>
              <input type="date" id="adm-dob" class="form-control" value="${patient.dob || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-sex">Sex / Gender <span class="required">*</span></label>
              <select id="adm-sex" class="form-control">
                <option value="Female" ${patient.sex === 'Female' ? 'selected' : ''}>Female</option>
                <option value="Male" ${patient.sex === 'Male' ? 'selected' : ''}>Male</option>
                <option value="Other" ${patient.sex === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-civilStatus">Civil Status</label>
              <select id="adm-civilStatus" class="form-control">
                <option value="Single" ${patient.civilStatus === 'Single' ? 'selected' : ''}>Single</option>
                <option value="Married" ${patient.civilStatus === 'Married' ? 'selected' : ''}>Married</option>
                <option value="Widowed" ${patient.civilStatus === 'Widowed' ? 'selected' : ''}>Widowed</option>
                <option value="Divorced" ${patient.civilStatus === 'Divorced' ? 'selected' : ''}>Divorced</option>
              </select>
            </div>

            <div class="form-group col-span-2">
              <label class="form-label" for="adm-address">Street Address</label>
              <input type="text" id="adm-address" class="form-control" value="${patient.address || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-cityStateZip">City / Province / Zip</label>
              <input type="text" id="adm-cityStateZip" class="form-control" value="${patient.cityStateZip || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="adm-phone">Contact Phone</label>
              <input type="tel" id="adm-phone" class="form-control" value="${patient.phone || ''}" placeholder="0917-000-0000" />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-email">Email Address</label>
              <input type="email" id="adm-email" class="form-control" value="${patient.email || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-occupation">Occupation</label>
              <input type="text" id="adm-occupation" class="form-control" value="${patient.occupation || ''}" />
            </div>
          </div>
        </section>

        <!-- 2. Insurance & Payment Information -->
        <section class="form-section">
          <h3 class="form-section-title">2. Insurance & Payment Information</h3>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label" for="adm-insuranceProvider">Insurance Provider</label>
              <input type="text" id="adm-insuranceProvider" class="form-control" value="${patient.insuranceProvider || 'PhilHealth'}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-philhealthNo">Policy / PhilHealth No.</label>
              <input type="text" id="adm-philhealthNo" class="form-control" value="${patient.philhealthNo || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-paymentMethod">Payment Method</label>
              <select id="adm-paymentMethod" class="form-control">
                <option value="Insurance" ${patient.paymentMethod === 'Insurance' ? 'selected' : ''}>Insurance / PhilHealth</option>
                <option value="Credit/Debit" ${patient.paymentMethod === 'Credit/Debit' ? 'selected' : ''}>Credit / Debit Card</option>
                <option value="Cash" ${patient.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
              </select>
            </div>
          </div>
        </section>

        <!-- 3. Emergency Contact -->
        <section class="form-section">
          <h3 class="form-section-title">3. Emergency Contact</h3>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label" for="adm-ecName">Contact Name</label>
              <input type="text" id="adm-ecName" class="form-control" value="${patient.emergencyContact?.name || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-ecRel">Relationship</label>
              <input type="text" id="adm-ecRel" class="form-control" value="${patient.emergencyContact?.relationship || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-ecPhone">Phone Number</label>
              <input type="tel" id="adm-ecPhone" class="form-control" value="${patient.emergencyContact?.phone || ''}" />
            </div>
          </div>
        </section>

        <!-- 4. Admission Details -->
        <section class="form-section">
          <h3 class="form-section-title">4. Admission Details</h3>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label" for="adm-date">Date of Admission</label>
              <input type="date" id="adm-date" class="form-control" value="${admDateIso}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-time">Time</label>
              <input type="time" id="adm-time" class="form-control" value="${admTimeIso}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-roomBed">Department / Room / Bed</label>
              <input type="text" id="adm-roomBed" class="form-control" value="${patient.roomBed || ''}" />
            </div>

            <div class="form-group col-span-2">
              <label class="form-label" for="adm-attendingPhysician">Attending Physician <span class="required">*</span></label>
              <input type="text" id="adm-attendingPhysician" class="form-control" value="${patient.attendingPhysician || ''}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-referredBy">Referred By</label>
              <input type="text" id="adm-referredBy" class="form-control" value="${f.referredBy || ''}" placeholder="Dr. / Clinic / ER" />
            </div>

            <div class="form-group col-span-3">
              <label class="form-label" for="adm-diagnosis">Admitting Diagnosis <span class="required">*</span></label>
              <input type="text" id="adm-diagnosis" class="form-control" value="${patient.admittingDiagnosis || ''}" required />
            </div>
            <div class="form-group col-span-3">
              <label class="form-label" for="adm-chiefComplaint">Chief Complaint</label>
              <textarea id="adm-chiefComplaint" class="form-control" rows="2">${patient.chiefComplaint || ''}</textarea>
            </div>
          </div>
        </section>

        <!-- 5. Medical Information -->
        <section class="form-section">
          <h3 class="form-section-title">5. Medical Information</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="adm-bloodGroup">Blood Group</label>
              <select id="adm-bloodGroup" class="form-control">
                <option value="O+" ${f.bloodGroup === 'O+' ? 'selected' : ''}>O+</option>
                <option value="O-" ${f.bloodGroup === 'O-' ? 'selected' : ''}>O-</option>
                <option value="A+" ${f.bloodGroup === 'A+' ? 'selected' : ''}>A+</option>
                <option value="A-" ${f.bloodGroup === 'A-' ? 'selected' : ''}>A-</option>
                <option value="B+" ${f.bloodGroup === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B-" ${f.bloodGroup === 'B-' ? 'selected' : ''}>B-</option>
                <option value="AB+" ${f.bloodGroup === 'AB+' ? 'selected' : ''}>AB+</option>
                <option value="AB-" ${f.bloodGroup === 'AB-' ? 'selected' : ''}>AB-</option>
                <option value="Unknown" ${!f.bloodGroup || f.bloodGroup === 'Unknown' ? 'selected' : ''}>Unknown</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="adm-allergies">Allergies (Highlight if present)</label>
              <input type="text" id="adm-allergies" class="form-control" value="${patient.allergies || 'None Known'}" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="adm-currentMeds">Current Medications</label>
              <textarea id="adm-currentMeds" class="form-control" rows="2">${f.currentMedications || ''}</textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="adm-pastMedicalHistory">Past Medical History</label>
              <textarea id="adm-pastMedicalHistory" class="form-control" rows="2">${f.pastMedicalHistory || ''}</textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label" for="adm-previousSurgeries">Previous Surgeries</label>
              <textarea id="adm-previousSurgeries" class="form-control" rows="2">${f.previousSurgeries || ''}</textarea>
            </div>
          </div>
        </section>

        <!-- Actions -->
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-outline" id="btn-cancel-edit">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btn-save-edit">Save Admission Form</button>
        </div>
      </form>
    `;

    // Event binding
    const form = container.querySelector('#admission-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const updatedData = {
        lastName: container.querySelector('#adm-lastName').value.trim(),
        firstName: container.querySelector('#adm-firstName').value.trim(),
        middleName: container.querySelector('#adm-middleName').value.trim(),
        dob: container.querySelector('#adm-dob').value,
        sex: container.querySelector('#adm-sex').value,
        civilStatus: container.querySelector('#adm-civilStatus').value,
        address: container.querySelector('#adm-address').value.trim(),
        cityStateZip: container.querySelector('#adm-cityStateZip').value.trim(),
        phone: container.querySelector('#adm-phone').value.trim(),
        email: container.querySelector('#adm-email').value.trim(),
        occupation: container.querySelector('#adm-occupation').value.trim(),
        insuranceProvider: container.querySelector('#adm-insuranceProvider').value.trim(),
        philhealthNo: container.querySelector('#adm-philhealthNo').value.trim(),
        paymentMethod: container.querySelector('#adm-paymentMethod').value,
        emergencyContact: {
          name: container.querySelector('#adm-ecName').value.trim(),
          relationship: container.querySelector('#adm-ecRel').value.trim(),
          phone: container.querySelector('#adm-ecPhone').value.trim()
        },
        admissionDate: `${container.querySelector('#adm-date').value}T${container.querySelector('#adm-time').value}`,
        roomBed: container.querySelector('#adm-roomBed').value.trim(),
        attendingPhysician: container.querySelector('#adm-attendingPhysician').value.trim(),
        admittingDiagnosis: container.querySelector('#adm-diagnosis').value.trim(),
        chiefComplaint: container.querySelector('#adm-chiefComplaint').value.trim(),
        allergies: container.querySelector('#adm-allergies').value.trim(),
        bloodGroup: container.querySelector('#adm-bloodGroup').value,
        currentMedications: container.querySelector('#adm-currentMeds').value.trim(),
        pastMedicalHistory: container.querySelector('#adm-pastMedicalHistory').value.trim(),
        previousSurgeries: container.querySelector('#adm-previousSurgeries').value.trim(),
        referredBy: container.querySelector('#adm-referredBy').value.trim()
      };

      onSave(updatedData);
    });

    container.querySelector('#btn-cancel-edit').addEventListener('click', onCancel);

    return container;
  }
};
