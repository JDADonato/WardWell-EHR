// Validation utilities for WardWell EHR
export function validateEmail(email) {
  if (!email) return true; // optional unless marked required
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
  if (!phone) return true;
  // allow common phone formats (e.g., 0917-123-4567, +639171234567, 02-8123-4567)
  return /^[\d\s+\-()]{7,20}$/.test(phone.trim());
}

export function isAbnormalVital(key, value) {
  if (value === undefined || value === null || value === '') return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;

  switch (key) {
    case 'temp': // Normal: 36.5 - 37.5 C
      return num < 36.0 || num > 37.8;
    case 'hr': // Normal: 60 - 100 bpm
    case 'pulse':
      return num < 60 || num > 100;
    case 'rr': // Normal: 12 - 20 cpm
      return num < 12 || num > 22;
    case 'spo2': // Normal: >= 95%
      return num < 95;
    case 'pain': // 0-10
      return num >= 7; // severe pain
    default:
      return false;
  }
}

export function isAbnormalBP(bpString) {
  if (!bpString) return false;
  const parts = bpString.split('/');
  if (parts.length !== 2) return false;
  const sys = parseInt(parts[0], 10);
  const dia = parseInt(parts[1], 10);
  if (isNaN(sys) || isNaN(dia)) return false;
  return sys >= 140 || sys < 90 || dia >= 90 || dia < 60;
}
