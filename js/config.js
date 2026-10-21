// WardWell EHR Configuration
export const CONFIG = {
  HOSPITAL_NAME: 'WardWell General Hospital',
  SYSTEM_NAME: 'WardWell EHR',
  HOSPITAL_ADDRESS: '144 St. Luke Way, Medical District, Metro Manila, Philippines',
  TAGLINE: 'Care, recorded with clarity.',
  APP_VERSION: '1.0.0',
  SCHEMA_VERSION: 1,

  // Password SHA-256 for 'Iloveward123'
  PASSWORD_HASH: 'a2c756af6d64e4c5e1b0cea5de06aa7ab77c8d6cc25c8aac0bac28518d3774c1',

  // Session & Security Settings
  MAX_FAILED_ATTEMPTS: 5,
  COOLDOWN_SECONDS: 30,
  INACTIVITY_TIMEOUT_MS: 15 * 60 * 1000, // 15 minutes
  INACTIVITY_WARN_MS: 14 * 60 * 1000,    // 14 minutes (1 min warning)
  UNDO_TIMEOUT_MS: 8000,                 // 8 seconds undo window

  // Storage Keys
  STORAGE_KEYS: {
    PATIENTS: 'wardwell:v1:patients',
    SETTINGS: 'wardwell:v1:settings',
    THEME: 'wardwell:v1:theme',
    SCHEMA: 'wardwell:v1:schema_version',
    DRAFTS: 'wardwell:v1:drafts'
  },

  // Logging
  LOG_LEVEL: 'debug', // 'debug' | 'info' | 'warn' | 'error'

  // Pagination
  PATIENTS_PER_PAGE: 10
};
