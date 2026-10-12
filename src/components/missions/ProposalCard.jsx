import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import RouteLine from './RouteLine';
import { ProposalTimer } from './ProposalPanel';
import { formatPrice } from '../../utils/format';

// Proposition en attente de ma reponse (mission groupage ou livraison
// marketplace directe) : delai restant, montant, lien vers le detail.
export default function ProposalCard({ to, icon, title, subtitle, montant, expireLe, route }) {
  const Icon = icon;
  return (
    <Link to={to} className="card block p-4 ring-2 ring-accent-200 transition hover:shadow-raised active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile h-10 w-10 bg-accent-50 text-accent-600">
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-surface-900">{title}</p>
            {subtitle && <p className="truncate text-xs text-surface-500">{subtitle}</p>}
          </div>
        </div>
        <ProposalTimer expireLe={expireLe} />
      </div>

      {route && (
        <div className="mt-4">
          <RouteLine from={route.from} to={route.to} compact />
        </div>
      )}

      <div className="divider mt-4 flex items-center justify-between pt-3">
        <p className="tabular text-lead font-bold text-surface-900">{formatPrice(montant)}</p>
        <span className="flex items-center gap-0.5 text-label font-semibold text-accent-600">
          Répondre <ChevronRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
