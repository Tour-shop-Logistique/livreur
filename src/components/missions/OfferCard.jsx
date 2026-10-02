import { Zap, ShoppingBag, CheckCircle2 } from 'lucide-react';
import RouteLine from './RouteLine';
import { formatPrice } from '../../utils/format';

// Carte d'une demande ouverte aux offres (mission express OU livraison
// marketplace reseau). `myOffer` = montant deja propose (ou undefined).
export default function OfferCard({ kind = 'express', title, subtitle, route, meta, myOffer, onOffer, disabled, disabledReason }) {
  const Icon = kind === 'marketplace' ? ShoppingBag : Zap;
  const hasOffer = myOffer !== undefined && myOffer !== null;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`icon-tile h-10 w-10 ${kind === 'marketplace' ? 'bg-success-50 text-success-700' : 'bg-accent-50 text-accent-600'}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-surface-900">{title}</p>
            {subtitle && <p className="truncate text-xs text-surface-500">{subtitle}</p>}
          </div>
        </div>
        {hasOffer && (
          <span className="badge bg-success-50 text-success-700">
            <CheckCircle2 size={13} aria-hidden="true" /> Offre envoyée
          </span>
        )}
      </div>

      {route && (
        <div className="mt-4">
          <RouteLine from={route.from} to={route.to} compact />
        </div>
      )}

      {meta && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-500">{meta}</div>}

      <div className="divider mt-4 flex items-center justify-between gap-3 pt-3">
        {hasOffer ? (
          <div>
            <p className="eyebrow">Votre offre</p>
            <p className="tabular text-lead font-bold text-surface-900">{formatPrice(myOffer)}</p>
          </div>
        ) : (
          <p className="text-xs leading-snug text-surface-500">{disabled && disabledReason ? disabledReason : 'Proposez votre tarif pour cette course.'}</p>
        )}
        <button
          type="button"
          onClick={onOffer}
          disabled={disabled}
          className={`${hasOffer ? 'btn-secondary' : 'btn-accent'} btn-sm shrink-0`}
        >
          {hasOffer ? 'Modifier' : 'Proposer un tarif'}
        </button>
      </div>
    </div>
  );
}
