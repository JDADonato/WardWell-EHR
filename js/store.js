// WardWell EHR - Store / Data Access Layer
import { CONFIG } from './config.js';
import { StorageService } from './storage.js';
import { Logger } from './utils/logger.js';
import { generateId, generateHospitalNo } from './utils/id.js';
import { calculateAge, getCurrentISODateTime } from './utils/dates.js';

let recentlyDeleted = null; // Staging for undo
let undoTimer = null;

export const Store = {
  // ==========================================
  // PATIENT CRUD
  // ==========================================
  getPatients() {
    return StorageService.get(CONFIG.STORAGE_KEYS.PATIENTS, []);
  },

  getPatientById(id) {
    if (!id) return null;
    const patients = this.getPatients();
    return patients.find(p => p.id === id) || null;
  },

  savePatient(patientData) {
    const patients = this.getPatients();
    const now = getCurrentISODateTime();

    if (patientData.id) {
      // Update existing
      const index = patients.findIndex(p => p.id === patientData.id);
      if (index === -1) {
        Logger.error('Store', 'savePatient', `Patient ${patientData.id} not found.`);
        return null;
      }

      // If dob changed, recalc age
      const age = patientData.dob ? calculateAge(patientData.dob) : (patientData.age || patients[index].age);

      const updated = {
        ...patients[index],
        ...patientData,
        age,
        updatedAt: now
      };

      patients[index] = updated;
      StorageService.set(CONFIG.STORAGE_KEYS.PATIENTS, patients);
      Logger.info('Store', 'savePatient', `Updated patient ${updated.id}`);
      window.dispatchEvent(new CustomEvent('ww:patient-updated', { detail: { patient: updated } }));
      return updated;
    } else {
      // Create new
      const id = generateId('pt');
      const hospitalNo = patientData.hospitalNo || generateHospitalNo();
      const age = patientData.dob ? calculateAge(patientData.dob) : (patientData.age || 0);

      const newPatient = {
        id,
        hospitalNo,
        firstName: patientData.firstName || '',
        middleName: patientData.middleName || '',
        lastName: patientData.lastName || '',
        dob: patientData.dob || '',
        age,
        sex: patientData.sex || 'Female',
        status: patientData.status || 'Admitted',
        civilStatus: patientData.civilStatus || 'Single',
        nationality: patientData.nationality || 'Filipino',
        religion: patientData.religion || 'Roman Catholic',
        address: patientData.address || '',
        cityStateZip: patientData.cityStateZip || 'Metro Manila',
        phone: patientData.phone || '',
        email: patientData.email || '',
        occupation: patientData.occupation || '',
        philhealthNo: patientData.philhealthNo || '',
        insuranceProvider: patientData.insuranceProvider || 'PhilHealth',
        paymentMethod: patientData.paymentMethod || 'Insurance',
        emergencyContact: patientData.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        admissionDate: patientData.admissionDate || now,
        roomBed: patientData.roomBed || 'Ward 2 - Bed 01',
        department: patientData.department || 'Internal Medicine',
        attendingPhysician: patientData.attendingPhysician || 'Dr. Alicia Ramos, MD',
        admittingDiagnosis: patientData.admittingDiagnosis || '',
        allergies: patientData.allergies || 'None Known',
        chiefComplaint: patientData.chiefComplaint || '',
        forms: {
          admission: null,
          nursingAssessment: null,
          consent: null,
          doctorsOrders: [],
          vitals: [],
          ivFlow: [],
          carePlan: [],
          mar: [],
          progressNotes: [],
          endorsement: null,
          discharge: null,
          ...patientData.forms
        },
        createdAt: now,
        updatedAt: now
      };

      patients.unshift(newPatient);
      StorageService.set(CONFIG.STORAGE_KEYS.PATIENTS, patients);
      Logger.info('Store', 'createPatient', `Created patient ${newPatient.id}`);
      window.dispatchEvent(new CustomEvent('ww:patient-created', { detail: { patient: newPatient } }));
      return newPatient;
    }
  },

  deletePatient(id) {
    const patients = this.getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) return false;

    const patientToDelete = patients[index];

    // Remove from active list
    patients.splice(index, 1);
    StorageService.set(CONFIG.STORAGE_KEYS.PATIENTS, patients);

    // Stage for undo
    recentlyDeleted = { patient: patientToDelete, index };
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      recentlyDeleted = null;
    }, CONFIG.UNDO_TIMEOUT_MS);

    Logger.info('Store', 'deletePatient', `Staged deletion for patient ${id}`);
    window.dispatchEvent(new CustomEvent('ww:patient-deleted', { detail: { id } }));
    return true;
  },

  undoDelete() {
    if (!recentlyDeleted) return null;
    clearTimeout(undoTimer);
    const { patient, index } = recentlyDeleted;
    const patients = this.getPatients();
    patients.splice(index, 0, patient);
    StorageService.set(CONFIG.STORAGE_KEYS.PATIENTS, patients);
    recentlyDeleted = null;
    Logger.info('Store', 'undoDelete', `Restored patient ${patient.id}`);
    window.dispatchEvent(new CustomEvent('ww:patient-created', { detail: { patient } }));
    return patient;
  },

  // ==========================================
  // FORM RECORD CRUD
  // ==========================================
  getFormData(patientId, formKey) {
    const patient = this.getPatientById(patientId);
    if (!patient || !patient.forms) return null;
    return patient.forms[formKey] || null;
  },

  saveFormData(patientId, formKey, formData) {
    const patient = this.getPatientById(patientId);
    if (!patient) {
      Logger.error('Store', 'saveFormData', `Patient ${patientId} not found.`);
      return false;
    }

    if (!patient.forms) patient.forms = {};
    patient.forms[formKey] = formData;
    patient.updatedAt = getCurrentISODateTime();

    // If saving admission form, sync demographic changes back to top-level patient
    if (formKey === 'admission' && formData) {
      if (formData.firstName) patient.firstName = formData.firstName;
      if (formData.lastName) patient.lastName = formData.lastName;
      if (formData.middleName) patient.middleName = formData.middleName;
      if (formData.dob) {
        patient.dob = formData.dob;
        patient.age = calculateAge(formData.dob);
      }
      if (formData.sex) patient.sex = formData.sex;
      if (formData.roomBed) patient.roomBed = formData.roomBed;
      if (formData.admittingDiagnosis) patient.admittingDiagnosis = formData.admittingDiagnosis;
      if (formData.attendingPhysician) patient.attendingPhysician = formData.attendingPhysician;
      if (formData.allergies) patient.allergies = formData.allergies;
    }

    // If saving doctorsOrders, support both array and { orders, attendingPhysician }
    if (formKey === 'doctorsOrders' && formData) {
      if (Array.isArray(formData)) {
        patient.forms.doctorsOrders = formData;
      } else if (formData.orders) {
        patient.forms.doctorsOrders = formData.orders;
        if (formData.attendingPhysician) {
          patient.attendingPhysician = formData.attendingPhysician;
        }
      }
      if (formData.attendingPhysician) {
        patient.attendingPhysician = formData.attendingPhysician;
      }
    }

    const patients = this.getPatients();
    const idx = patients.findIndex(p => p.id === patientId);
    if (idx !== -1) {
      patients[idx] = patient;
      StorageService.set(CONFIG.STORAGE_KEYS.PATIENTS, patients);
      this.clearDraft(patientId, formKey);
      Logger.info('Store', 'saveFormData', `Saved form "${formKey}" for patient ${patientId}`);
      window.dispatchEvent(new CustomEvent('ww:form-saved', { detail: { patientId, formKey } }));
      return true;
    }
    return false;
  },

  // ==========================================
  // DRAFTS (Auto-save in progress)
  // ==========================================
  saveDraft(patientId, formKey, data) {
    const drafts = StorageService.get(CONFIG.STORAGE_KEYS.DRAFTS, {});
    const draftKey = `${patientId}:${formKey}`;
    drafts[draftKey] = { data, savedAt: Date.now() };
    StorageService.set(CONFIG.STORAGE_KEYS.DRAFTS, drafts);
  },

  getDraft(patientId, formKey) {
    const drafts = StorageService.get(CONFIG.STORAGE_KEYS.DRAFTS, {});
    const draftKey = `${patientId}:${formKey}`;
    return drafts[draftKey]?.data || null;
  },

  clearDraft(patientId, formKey) {
    const drafts = StorageService.get(CONFIG.STORAGE_KEYS.DRAFTS, {});
    const draftKey = `${patientId}:${formKey}`;
    if (drafts[draftKey]) {
      delete drafts[draftKey];
      StorageService.set(CONFIG.STORAGE_KEYS.DRAFTS, drafts);
    }
  },

  // ==========================================
  // COMPLETION INDICATORS
  // ==========================================
  getFormCompletionMap(patient) {
    if (!patient || !patient.forms) return {};
    const f = patient.forms;
    return {
      'admission': !!(f.admission && Object.keys(f.admission).length > 2),
      'nursing-assessment': !!(f.nursingAssessment && Object.keys(f.nursingAssessment).length > 2),
      'consent': !!(f.consent && (f.consent.patientSignature || f.consent.providerSignature)),
      'doctors-order': Array.isArray(f.doctorsOrders) && f.doctorsOrders.length > 0,
      'vitals': Array.isArray(f.vitals) && f.vitals.length > 0,
      'iv-flow': Array.isArray(f.ivFlow) && f.ivFlow.length > 0,
      'care-plan': Array.isArray(f.carePlan) && f.carePlan.length > 0,
      'mar': Array.isArray(f.mar) && f.mar.length > 0,
      'progress-notes': Array.isArray(f.progressNotes) && f.progressNotes.length > 0,
      'endorsement': !!(f.endorsement && Object.keys(f.endorsement).length > 2),
      'discharge': !!(f.discharge && Object.keys(f.discharge).length > 2)
    };
  }
};
