import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { CheckCircle2, Circle, Clock, XCircle, ChevronRight } from 'lucide-react';
import usePushSubscription from '../../hooks/usePushSubscription';
import { ROUTES } from '../../routes';

// "Pret a livrer" : ce qui conditionne la reception des missions, a partir des
// seules donnees de l'API (fiche Livreur §3, push §7.3). La disponibilite a sa
// propre carte (AvailabilitySwitch). La carte disparait quand tout est en ordre.
const KYC = {
  valide: { done: true, hint: 'Documents vérifiés' },
  en_attente: { done: false, hint: 'Vérification en cours', icon: Clock, tone: 'text-warning-600' },
  rejete: { done: false, hint: 'Documents rejetés, contactez TourShop', icon: XCircle, tone: 'text-danger-600' },
};

function Row({ done, label, hint, pendingIcon, pendingTone, action }) {
  const Icon = done ? CheckCircle2 : pendingIcon || Circle;
  return (
    <li className="flex min-h-14 items-center gap-3 py-2.5">
      <Icon size={22} className={`shrink-0 ${done ? 'text-success-600' : pendingTone || 'text-surface-300'}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? 'text-surface-500' : 'text-surface-900'}`}>
          {label}
          <span className="sr-only">{done ? ' : fait' : ' : à faire'}</span>
        </p>
        {hint && <p className="truncate text-xs text-surface-500">{hint}</p>}
      </div>
      {!done && action}
    </li>
  );
}

export default function ReadinessCard() {
  const livreur = useSelector((state) => state.auth.user?.livreur);
  const push = usePushSubscription();

  // Fiche Livreur pas encore chargee (GET /livreur/profil) : rien a afficher.
  if (!livreur || !push.ready) return null;

  const kyc = KYC[livreur.statut_validation] || KYC.en_attente;
  const vehicleDone = Boolean(livreur.type_vehicule && livreur.numero_vehicule);

  const items = [
    { key: 'kyc', done: kyc.done, label: 'Identité vérifiée', hint: kyc.hint, pendingIcon: kyc.icon, pendingTone: kyc.tone },
    {
      key: 'vehicle',
      done: vehicleDone,
      label: 'Véhicule renseigné',
      hint: vehicleDone ? livreur.numero_vehicule : 'Ajoutez votre immatriculation',
      action: (
        <Link to={`${ROUTES.PROFILE}?modifier=vehicule`} className="btn-secondary btn-sm shrink-0">
          Compléter <ChevronRight size={14} aria-hidden="true" />
        </Link>
      ),
    },
  ];

  if (push.supported) {
    const enablePush = async () => {
      const res = await push.toggle();
      if (res.ok) toast.success('Notifications push activées.');
      else toast.error(res.message || "Impossible d'activer les notifications.");
    };
    items.push({
      key: 'push',
      done: push.enabled,
      label: 'Notifications push',
      hint: push.enabled ? 'Activées sur cet appareil' : 'Soyez alerté même app fermée',
      action: (
        <button type="button" className="btn-secondary btn-sm shrink-0" onClick={enablePush} disabled={push.loading} aria-busy={push.loading}>
          Activer
        </button>
      ),
    });
  }

  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;

  return (
    <section className="card p-4" aria-labelledby="readiness-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="readiness-title" className="font-semibold text-surface-900">Prêt à livrer</h2>
        <span className="tabular text-xs font-semibold text-surface-500">{doneCount}/{items.length}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-100" aria-hidden="true">
        <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${(doneCount / items.length) * 100}%` }} />
      </div>
      <ul className="mt-2 divide-y divide-surface-100">
        {items.map(({ key, ...item }) => <Row key={key} {...item} />)}
      </ul>
    </section>
  );
}
