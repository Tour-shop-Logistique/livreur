import { Loader2 } from 'lucide-react';
import BottomSheet from '../common/BottomSheet';

// Confirmation simple d'une etape declarative (demarrer, depot agence…).
export default function ConfirmSheet({ open, onClose, onConfirm, loading, title, description, confirmLabel, children, error }) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description}>
      {children}
      {error && <p className="field-error mb-3" role="alert">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>Annuler</button>
        <button type="button" className="btn-accent flex-[2]" onClick={onConfirm} disabled={loading}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Envoi…</> : confirmLabel}
        </button>
      </div>
    </BottomSheet>
  );
}
