import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import { ROUTES } from '../../routes';
import { formatDate, formatPrice } from '../../utils/format';

// Bandeau d'abonnement marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §9.5) :
// affiche si l'echeance est `rappel_envoye` / `en_retard` ou si le livreur est bloque.
export default function AbonnementBanner() {
  const { bloque, echeance } = useSelector((state) => state.abonnement);
  const statut = echeance?.statut;
  if (!bloque && statut !== 'rappel_envoye' && statut !== 'en_retard') return null;

  const critical = bloque || statut === 'en_retard';
  const Icon = critical ? AlertTriangle : Clock;

  return (
    <Link
      to={ROUTES.ABONNEMENT}
      className={`flex items-center gap-3 rounded-2xl border p-3.5 transition active:scale-[0.99] ${
        critical ? 'border-danger-200 bg-danger-50' : 'border-warning-200 bg-warning-50'
      }`}
    >
      <span className={`icon-tile h-9 w-9 ${critical ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700'}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${critical ? 'text-danger-800' : 'text-warning-800'}`}>
          {critical ? 'Marketplace suspendue' : 'Échéance d\'abonnement proche'}
        </p>
        <p className={`text-xs ${critical ? 'text-danger-700' : 'text-warning-700'}`}>
          {critical
            ? `Régularisez ${echeance ? formatPrice(echeance.montant) : 'votre abonnement'} pour réactiver les livraisons marketplace.`
            : `${formatPrice(echeance?.montant)} à régler avant le ${formatDate(echeance?.periode_fin)}.`}
        </p>
      </div>
      <ChevronRight size={18} className={critical ? 'text-danger-600' : 'text-warning-700'} aria-hidden="true" />
    </Link>
  );
}
