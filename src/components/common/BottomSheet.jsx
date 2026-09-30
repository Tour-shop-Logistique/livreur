import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Feuille modale ancree en bas (usage une main). Fermeture : bouton, fond, Echap.
export default function BottomSheet({ open, onClose, title, description, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0 animate-fade-in bg-surface-900/50" onClick={onClose} aria-label="Fermer" tabIndex={-1} />
      <div className="relative flex max-h-[92dvh] w-full max-w-md animate-sheet-up flex-col rounded-t-3xl bg-white shadow-raised sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-surface-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-surface-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-surface-500 transition hover:bg-surface-100"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="safe-bottom border-t border-surface-100 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
