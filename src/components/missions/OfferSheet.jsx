import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import BottomSheet from '../common/BottomSheet';
import { formatPrice } from '../../utils/format';

// Proposer / modifier / retirer une offre de prix. L'API est idempotente :
// reproposer remplace le montant precedent (une seule offre active par mission).
export default function OfferSheet({ open, onClose, title, description, currentOffer, onSubmit, onWithdraw, loading, note }) {
  const [montant, setMontant] = useState('');

  useEffect(() => {
    if (open) setMontant(currentOffer != null ? String(currentOffer) : '');
  }, [open, currentOffer]);

  const value = Number(montant);
  const valid = montant !== '' && !Number.isNaN(value) && value >= 0;

  const submit = (e) => {
    e.preventDefault();
    if (valid) onSubmit(value);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="offer-amount" className="label">Votre tarif</label>
          <div className="relative">
            <input
              id="offer-amount"
              type="number"
              min="0"
              step="50"
              inputMode="numeric"
              placeholder="0"
              className="input-field tabular pr-16 text-xl font-semibold"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              autoFocus
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-surface-400">FCFA</span>
          </div>
          {currentOffer != null && (
            <p className="mt-1.5 text-xs text-surface-500">Offre actuelle : <span className="font-semibold text-surface-700">{formatPrice(currentOffer)}</span></p>
          )}
        </div>

        {note && (
          <p className="flex gap-2 rounded-xl bg-surface-50 p-3 text-xs leading-relaxed text-surface-600">
            <Info size={15} className="mt-0.5 shrink-0 text-primary-600" aria-hidden="true" />
            {note}
          </p>
        )}

        <button type="submit" className="btn-accent btn-lg w-full" disabled={!valid || loading}>
          {loading ? 'Envoi…' : currentOffer != null ? "Mettre à jour l'offre" : "Envoyer l'offre"}
        </button>
        {currentOffer != null && onWithdraw && (
          <button type="button" className="btn-danger w-full" onClick={onWithdraw} disabled={loading}>
            Retirer mon offre
          </button>
        )}
      </form>
    </BottomSheet>
  );
}
