// WardWell EHR - Confirmation Dialog
import { Modal } from './modal.js';

export function showConfirm({
  title = 'Please Confirm',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false
}) {
  return new Promise((resolve) => {
    let resolved = false;

    const modal = Modal.create({
      title,
      content: `<p style="font-size: 0.95rem; color: var(--text-secondary);">${message}</p>`,
      size: 'md',
      footerButtons: [
        {
          label: cancelText,
          className: 'btn-outline',
          onClick: ({ close }) => {
            resolved = true;
            close();
            resolve(false);
          }
        },
        {
          label: confirmText,
          className: isDanger ? 'btn-danger' : 'btn-primary',
          onClick: ({ close }) => {
            resolved = true;
            close();
            resolve(true);
          }
        }
      ],
      onClose: () => {
        if (!resolved) resolve(false);
      }
    });

    modal.open();
  });
}
