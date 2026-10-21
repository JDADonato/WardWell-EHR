// WardWell EHR - Toast Notification System
import { CONFIG } from '../config.js';

let container = null;

function ensureContainer() {
  if (!container || !document.body.contains(container)) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }
  return container;
}

const ICONS = {
  success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
};

export const Toast = {
  show({ title, message, type = 'info', duration = 4000, onUndo = null, undoText = 'Undo' }) {
    const cont = ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    let undoBtnHtml = '';
    if (typeof onUndo === 'function') {
      undoBtnHtml = `<button class="toast-undo-btn" type="button">${undoText}</button>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${ICONS[type] || ICONS.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-text">${message}${undoBtnHtml}</div>
      </div>
      <button class="toast-close" type="button" aria-label="Close notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    cont.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    let timeoutId = null;
    const dismiss = () => {
      clearTimeout(timeoutId);
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    if (duration > 0) {
      timeoutId = setTimeout(dismiss, duration);
    }

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);

    const undoBtn = toast.querySelector('.toast-undo-btn');
    if (undoBtn && onUndo) {
      undoBtn.addEventListener('click', () => {
        dismiss();
        onUndo();
      });
    }

    return { dismiss };
  },

  success(message, title = 'Success', duration = 3500) {
    return this.show({ title, message, type: 'success', duration });
  },

  error(message, title = 'Error', duration = 5000) {
    return this.show({ title, message, type: 'error', duration });
  },

  warning(message, title = 'Attention', duration = 4500) {
    return this.show({ title, message, type: 'warning', duration });
  },

  info(message, title = 'Notice', duration = 3500) {
    return this.show({ title, message, type: 'info', duration });
  },

  withUndo(message, onUndo, title = 'Action Completed', duration = 8000) {
    return this.show({ title, message, type: 'info', duration, onUndo, undoText: 'Undo (8s)' });
  }
};
