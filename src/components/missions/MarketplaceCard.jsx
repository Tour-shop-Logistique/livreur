import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { MarketplaceStatusBadge } from './StatusBadge';
import { marketplaceDetailPath } from '../../routes';
import { formatPrice, formatDateTime } from '../../utils/format';

// Carte d'une livraison marketplace qui m'est assignee.
export default function MarketplaceCard({ livraison }) {
  const commande = livraison.commande || {};
  const closed = livraison.statut === 'terminee' || livraison.statut === 'livree' || livraison.statut === 'annulee';

  return (
    <Link to={marketplaceDetailPath(livraison.id)} className="card block p-4 transition hover:shadow-raised active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-tile h-10 w-10 bg-success-50 text-success-700">
            <ShoppingBag size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-surface-900">
              Livraison marketplace
              <span className="font-normal text-surface-500"> · {livraison.mode === 'direct' ? 'Direct' : 'Réseau'}</span>
            </p>
            <p className="truncate font-mono text-xs text-surface-500">Cde #{String(commande.id || livraison.commande_marketplace_id || '').slice(0, 8)}</p>
          </div>
        </div>
        <MarketplaceStatusBadge statut={livraison.statut} />
      </div>

      <div className="divider mt-4 flex items-center justify-between pt-3">
        <div>
          <p className="tabular text-lead font-bold text-surface-900">{formatPrice(livraison.montant_final)}</p>
          <p className="text-caption text-surface-500">
            {commande.montant_articles != null ? `Articles : ${formatPrice(commande.montant_articles)}` : ''}
            {livraison.assignee_le ? ` · ${formatDateTime(livraison.assignee_le)}` : ''}
          </p>
        </div>
        <span className="flex items-center gap-0.5 text-label font-semibold text-primary-600">
          {closed ? 'Détails' : 'Continuer'} <ChevronRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
