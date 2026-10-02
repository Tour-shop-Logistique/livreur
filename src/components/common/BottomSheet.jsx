import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import IconButton from './IconButton';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Feuille modale ancree en bas (usage une main). Fermeture : bouton, fond, Echap.
// Le focus reste dans la feuille tant qu'elle est ouverte et revient a
// l'element declencheur a la fermeture.
export default function BottomSheet({ open, onClose, title, description, children, footer }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  // Les appelants passent souvent une fonction inline : la garder en ref evite
  // de relancer l'effet (et de perdre le focus) a chaque rendu.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    const previous = document.activeElement;

    // Un champ en autoFocus a deja pris le focus : on le respecte.
    if (panel && !panel.contains(document.activeElement)) panel.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current?.(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = panel.querySelectorAll(FOCUSABLE);
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <button type="button" className="absolute inset-0 animate-fade-in bg-surface-900/50" onClick={onClose} aria-label="Fermer" tabIndex={-1} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-md animate-sheet-up flex-col rounded-t-2xl bg-white shadow-raised outline-none focus-visible:ring-0 sm:rounded-2xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-surface-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
          <div className="min-w-0 pt-2">
            <h2 id={titleId} className="text-lg font-semibold text-surface-900">{title}</h2>
            {description && <p id={descriptionId} className="mt-0.5 text-sm text-surface-500">{description}</p>}
          </div>
          <IconButton icon={X} label="Fermer" onClick={onClose} className="-mr-2.5 text-surface-500" />
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="safe-bottom border-t border-surface-100 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
