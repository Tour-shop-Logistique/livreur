import { useSelector } from 'react-redux';
import { AlertTriangle, Clock } from 'lucide-react';
import Callout from './Callout';
import { ROUTES } from '../../routes';
import { formatDate, formatPrice } from '../../utils/format';

// Bandeau d'abonnement marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §9.5) :
// affiche si l'echeance est `rappel_envoye` / `en_retard` ou si le livreur est bloque.
export default function AbonnementBanner() {
  const { bloque, echeance } = useSelector((state) => state.abonnement);
  const statut = echeance?.statut;
  if (!bloque && statut !== 'rappel_envoye' && statut !== 'en_retard') return null;

  const critical = bloque || statut === 'en_retard';

  return (
    <Callout
      to={ROUTES.ABONNEMENT}
      tone={critical ? 'danger' : 'warning'}
      icon={critical ? AlertTriangle : Clock}
      title={critical ? 'Marketplace suspendue' : 'Échéance d\'abonnement proche'}
    >
      {critical
        ? `Régularisez ${echeance ? formatPrice(echeance.montant) : 'votre abonnement'} pour réactiver les livraisons marketplace.`
        : `${formatPrice(echeance?.montant)} à régler avant le ${formatDate(echeance?.periode_fin)}.`}
    </Callout>
  );
}
