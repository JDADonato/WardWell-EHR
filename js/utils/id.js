// ID utilities for WardWell EHR
export function generateId(prefix = 'rec') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${rand}`;
}

export function generateHospitalNo() {
  const year = new Date().getFullYear().toString().slice(-2);
  const randNum = Math.floor(10000 + Math.random() * 90000);
  return `WW-${year}-${randNum}`;
}
