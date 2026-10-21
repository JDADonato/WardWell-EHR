// Date and Time Utilities for WardWell EHR
export function formatDate(dateStr, format = 'short') {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (format === 'short') {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (format === 'datetime') {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (format === 'time') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (format === 'isoDate') {
      return d.toISOString().split('T')[0];
    }
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

export function getCurrentISODate() {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentISOTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function getCurrentISODateTime() {
  const d = new Date();
  const date = d.toISOString().split('T')[0];
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date}T${time}`;
}

export function calculateAge(birthdateStr) {
  if (!birthdateStr) return '';
  try {
    const dob = new Date(birthdateStr);
    if (isNaN(dob.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : '';
  } catch {
    return '';
  }
}
