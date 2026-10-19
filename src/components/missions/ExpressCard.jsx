import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import RouteLine from './RouteLine';
import ButtonLabel from '../common/ButtonLabel';
import { formatPrice, currencyLabel } from '../../utils/format';

// Course express ouverte au reseau, a prix impose par le backend
// (`montant_fixe`). Plus de negociation : le premier livreur qui accepte
// l'emporte (CHANGEMENTS_APPS_CLIENT_LIVREUR §2). Design "Plume" : prix en
// grand, action "Accepter" en lime.
export default function ExpressCard({
  title, subtitle, to, route, meta, price, onAccept, loading, disabled, disabledReason,
}) {
  return (
    <article className="card-raised overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="badge self-start bg-accent-50 px-2.5 py-1 text-xs text-accent-700">{title}</span>
          {subtitle && <span className="truncate text-[0.8125rem] text-surface-500">{subtitle}</span>}
        </div>
        <div className="shrink-0 text-right">
          <span className="tabular block font-heading text-[1.625rem] font-extrabold leading-none tracking-tight text-navy-950">
            {formatPrice(price, '')}
          </span>
          <span className="text-xs font-bold text-surface-500">{currencyLabel()}</span>
        </div>
      </div>

      {route && (
        <div className="px-4 pt-3.5">
          <RouteLine from={route.from} to={route.to} compact />
        </div>
      )}

      {meta && <div className="mx-4 mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] font-medium text-navy-700">{meta}</div>}

      <div className="flex gap-2.5 p-4">
        {to && <Link to={to} className="btn-secondary px-4">Détails</Link>}
        <button
          type="button"
          onClick={onAccept}
          disabled={disabled || loading}
          aria-busy={loading}
          className="btn-accent flex-1 text-base"
        >
          <ButtonLabel loading={loading} loadingLabel="Acceptation…">
            <Check size={19} strokeWidth={2.8} aria-hidden="true" /> Accepter la course
          </ButtonLabel>
        </button>
      </div>
      {disabled && disabledReason && (
        <p className="-mt-2 px-4 pb-3.5 text-center text-xs text-surface-500">{disabledReason}</p>
      )}
    </article>
  );
}
