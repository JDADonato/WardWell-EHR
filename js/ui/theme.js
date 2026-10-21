// WardWell EHR - Light Mode Enforcement
export const ThemeManager = {
  init() {
    document.documentElement.removeAttribute('data-theme');
    try {
      localStorage.removeItem('wardwell:v1:theme');
    } catch {}
  },
  getTheme() {
    return 'light';
  }
};
