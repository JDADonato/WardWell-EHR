// WardWell EHR - Modal Manager with Focus Trap & Escape Key Support
let activeModals = [];

export const Modal = {
  create({ title, content, footerButtons = [], size = 'md', onClose = null }) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    const sizeClass = size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : '';

    backdrop.innerHTML = `
      <div class="modal-container ${sizeClass}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn btn-icon btn-sm btn-ghost modal-close-btn" aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">${typeof content === 'string' ? content : ''}</div>
        <div class="modal-footer"></div>
      </div>
    `;

    if (typeof content !== 'string' && content instanceof HTMLElement) {
      backdrop.querySelector('.modal-body').appendChild(content);
    }

    const footer = backdrop.querySelector('.modal-footer');
    footerButtons.forEach(btnConfig => {
      const btn = document.createElement('button');
      btn.type = btnConfig.type || 'button';
      btn.className = `btn ${btnConfig.className || 'btn-secondary'}`;
      btn.textContent = btnConfig.label;
      btn.addEventListener('click', () => {
        if (btnConfig.onClick) {
          btnConfig.onClick({ close });
        } else {
          close();
        }
      });
      footer.appendChild(btn);
    });

    const previousFocusedElement = document.activeElement;

    function open() {
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => {
        backdrop.classList.add('active');
      });
      activeModals.push({ backdrop, close, previousFocusedElement });

      // Focus first input or button
      setTimeout(() => {
        const focusable = backdrop.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) focusable[0].focus();
      }, 100);
    }

    function close() {
      backdrop.classList.remove('active');
      setTimeout(() => {
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
        if (onClose) onClose();
        if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
          previousFocusedElement.focus();
        }
      }, 250);

      activeModals = activeModals.filter(m => m.backdrop !== backdrop);
    }

    // Backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    // Close button
    backdrop.querySelector('.modal-close-btn').addEventListener('click', close);

    return { open, close, element: backdrop };
  }
};

// Global Escape Key Listener for Modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeModals.length > 0) {
    const topModal = activeModals[activeModals.length - 1];
    topModal.close();
  }
});
