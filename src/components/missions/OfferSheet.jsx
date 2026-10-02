import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import BottomSheet from '../common/BottomSheet';
import Callout from '../common/Callout';
import { formatPrice } from '../../utils/format';
import ButtonLabel from '../common/ButtonLabel';

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
          <Callout tone="neutral" size="sm" icon={Info}>{note}</Callout>
        )}

        <button type="submit" aria-busy={loading} className="btn-accent btn-lg w-full" disabled={!valid || loading}>
          <ButtonLabel loading={loading} loadingLabel="Envoi…">{currentOffer != null ? "Mettre à jour l'offre" : "Envoyer l'offre"}</ButtonLabel>
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
