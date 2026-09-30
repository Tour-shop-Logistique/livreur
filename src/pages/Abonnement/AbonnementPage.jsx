import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  ShieldCheck, AlertTriangle, Clock, Hourglass, Receipt, RefreshCw, Smartphone, Banknote, Landmark, CreditCard, Wallet, XCircle,
} from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import BottomSheet from '../../components/common/BottomSheet';
import FormField from '../../components/common/FormField';
import FilePicker from '../../components/common/FilePicker';
import StatusBadge from '../../components/missions/StatusBadge';
import StickyActionBar from '../../components/common/StickyActionBar';
import {
  fetchAbonnementStatus, fetchAbonnementHistory, declareAbonnementPayment,
} from '../../store/slices/abonnementSlice';
import { formatDate, formatPrice } from '../../utils/format';

// Abonnement marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §9). Declarer un
// paiement ne debloque PAS : seule la validation backoffice le fait.

const METHODES = [
  { value: 'mobile_money', label: 'Mobile money', icon: Smartphone },
  { value: 'cash', label: 'Espèces', icon: Banknote },
  { value: 'bank_transfer', label: 'Virement', icon: Landmark },
  { value: 'card', label: 'Carte', icon: CreditCard },
  { value: 'other', label: 'Autre', icon: Wallet },
];

const ECHEANCE_STATUT = {
  a_payer: { label: 'À payer', tone: 'info' },
  rappel_envoye: { label: 'Échéance proche', tone: 'waiting' },
  en_retard: { label: 'En retard', tone: 'danger' },
  payee: { label: 'Payée', tone: 'success' },
};

const PAIEMENT_STATUT = {
  en_attente: { label: 'En validation', tone: 'waiting' },
  valide: { label: 'Validé', tone: 'success' },
  rejete: { label: 'Rejeté', tone: 'danger' },
};

function DeclareSheet({ open, onClose, echeance, loading, onSubmit }) {
  const [methode, setMethode] = useState('mobile_money');
  const [reference, setReference] = useState('');
  const [preuve, setPreuve] = useState(null);

  useEffect(() => {
    if (open) { setMethode('mobile_money'); setReference(''); setPreuve(null); }
  }, [open]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Déclarer mon paiement"
      description={echeance ? `Échéance de ${formatPrice(echeance.montant)} au ${formatDate(echeance.periode_fin)}` : undefined}
      footer={(
        <button type="submit" form="declare-form" className="btn-primary btn-lg w-full" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer la déclaration'}
        </button>
      )}
    >
      <form
        id="declare-form"
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); onSubmit({ methode, referenceTransaction: reference.trim(), preuve }); }}
      >
        <FormField label="Moyen de paiement utilisé">
          <div className="grid grid-cols-3 gap-2">
            {METHODES.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-pressed={methode === m.value}
                onClick={() => setMethode(m.value)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-semibold transition ${
                  methode === m.value ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-surface-200 bg-white text-surface-600'
                }`}
              >
                <m.icon size={18} aria-hidden="true" /> {m.label}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Référence de la transaction" htmlFor="ref" optional>
          <input id="ref" maxLength={255} className="input-field" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex. MP240930.1234.A56789" />
        </FormField>
        <FormField label="Capture de la transaction" optional>
          <FilePicker id="preuve-abonnement" value={preuve} onChange={setPreuve} label="Ajouter une capture d'écran" />
        </FormField>
        <p className="rounded-xl bg-surface-50 p-3 text-xs leading-relaxed text-surface-600">
          Votre accès marketplace sera rétabli après vérification par votre backoffice de rattachement.
        </p>
      </form>
    </BottomSheet>
  );
}

export default function AbonnementPage() {
  const dispatch = useDispatch();
  const { abonnement, echeance, bloque, status, loaded, history, declaration } = useSelector((state) => state.abonnement);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = () => {
    dispatch(fetchAbonnementStatus());
    dispatch(fetchAbonnementHistory());
  };

  useEffect(() => {
    dispatch(fetchAbonnementStatus());
    dispatch(fetchAbonnementHistory());
  }, [dispatch]);

  // Paiement declare sur l'echeance courante (via l'historique, seul a charger `paiement`).
  const echeanceHistory = history.items.find((e) => e.id === echeance?.id);
  const paiement = echeance?.paiement || echeanceHistory?.paiement;
  const enValidation = paiement?.statut === 'en_attente';
  const rejete = paiement?.statut === 'rejete';
  const canDeclare = echeance && echeance.statut !== 'payee' && !enValidation;

  const submit = async (payload) => {
    const result = await dispatch(declareAbonnementPayment({ echeanceId: echeance.id, ...payload }));
    if (declareAbonnementPayment.fulfilled.match(result)) {
      toast.success('Paiement déclaré', { description: 'En attente de validation par le backoffice.' });
      setSheetOpen(false);
      dispatch(fetchAbonnementHistory());
    } else {
      toast.error(result.payload);
    }
  };

  const refreshButton = (
    <button type="button" onClick={load} className="flex h-11 w-11 items-center justify-center rounded-full text-surface-600 hover:bg-surface-100" aria-label="Actualiser">
      <RefreshCw size={19} className={status === 'loading' ? 'animate-spin' : ''} />
    </button>
  );

  if (!loaded) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Abonnement marketplace" back />
        <LoadingSpinner />
      </div>
    );
  }

  let hero;
  if (bloque) {
    hero = { tone: 'danger', icon: AlertTriangle, title: 'Accès marketplace suspendu', text: 'Votre échéance est dépassée. Réglez-la puis déclarez votre paiement pour réactiver les livraisons marketplace. Vos missions d\'expédition ne sont pas concernées.' };
  } else if (echeance?.statut === 'rappel_envoye' || echeance?.statut === 'en_retard') {
    hero = { tone: 'warning', icon: Clock, title: 'Échéance proche', text: `Réglez ${formatPrice(echeance.montant)} avant le ${formatDate(echeance.periode_fin)} pour éviter une suspension.` };
  } else if (abonnement) {
    hero = { tone: 'success', icon: ShieldCheck, title: 'Abonnement à jour', text: 'Vous pouvez livrer sur la marketplace sans restriction.' };
  }

  const heroStyles = {
    danger: 'border-danger-200 bg-danger-50 text-danger-800',
    warning: 'border-warning-200 bg-warning-50 text-warning-800',
    success: 'border-success-200 bg-success-50 text-success-800',
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Abonnement marketplace" back right={refreshButton} />

      <div className="page-container flex-1 space-y-4 py-4">
        {!abonnement ? (
          <EmptyState
            icon={ShieldCheck}
            tone="success"
            title="Aucun abonnement actif"
            description="L'abonnement démarre automatiquement à votre première livraison marketplace (offre acceptée ou assignation directe). Les missions d'expédition n'y sont jamais soumises."
          />
        ) : (
          <>
            {hero && (
              <div className={`flex items-start gap-3 rounded-2xl border p-4 ${heroStyles[hero.tone]}`}>
                <hero.icon size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{hero.title}</p>
                  <p className="mt-0.5 text-sm opacity-90">{hero.text}</p>
                </div>
              </div>
            )}

            <section className="card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-surface-900">Échéance en cours</h2>
                {echeance && <StatusBadge {...(ECHEANCE_STATUT[echeance.statut] || { label: echeance.statut })} />}
              </div>
              {echeance ? (
                <dl className="mt-3 divide-y divide-surface-100 text-sm">
                  <div className="flex justify-between py-2.5"><dt className="text-surface-500">Montant</dt><dd className="tabular font-bold text-surface-900">{formatPrice(echeance.montant)}</dd></div>
                  <div className="flex justify-between py-2.5"><dt className="text-surface-500">Période</dt><dd className="font-medium text-surface-800">{formatDate(echeance.periode_debut)} → {formatDate(echeance.periode_fin)}</dd></div>
                  <div className="flex justify-between py-2.5"><dt className="text-surface-500">Périodicité</dt><dd className="font-medium text-surface-800">{abonnement.periodicite_jours} jours</dd></div>
                </dl>
              ) : (
                <p className="mt-2 text-sm text-surface-500">Aucune échéance à régler.</p>
              )}

              {enValidation && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-warning-50 p-3 text-sm text-warning-800">
                  <Hourglass size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                  Paiement déclaré, en attente de validation par le backoffice.
                </div>
              )}
              {rejete && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-danger-50 p-3 text-sm text-danger-700">
                  <XCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    Déclaration rejetée{paiement.commentaire_backoffice ? ` : « ${paiement.commentaire_backoffice} »` : '.'} Vous pouvez déclarer à nouveau.
                  </span>
                </div>
              )}
            </section>

            <section>
              <h2 className="section-title">Historique des échéances</h2>
              {history.items.length === 0 ? (
                <EmptyState compact icon={Receipt} title="Aucune échéance passée" />
              ) : (
                <ul className="card divide-y divide-surface-100">
                  {history.items.map((e) => {
                    const p = e.paiement;
                    return (
                      <li key={e.id} className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-surface-900">{formatDate(e.periode_debut)} → {formatDate(e.periode_fin)}</p>
                          <p className="tabular text-xs text-surface-500">
                            {formatPrice(e.montant)}{p ? ` · déclaré (${METHODES.find((m) => m.value === p.methode)?.label || p.methode})` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge {...(ECHEANCE_STATUT[e.statut] || { label: e.statut })} className="py-0.5 text-[11px]" />
                          {p && e.statut !== 'payee' && <StatusBadge {...(PAIEMENT_STATUT[p.statut] || { label: p.statut })} className="py-0.5 text-[11px]" />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {canDeclare && (
        <StickyActionBar hint="Payez hors application vers le compte communiqué par votre backoffice, puis déclarez-le ici.">
          <button type="button" className="btn-primary btn-lg w-full" onClick={() => setSheetOpen(true)}>
            {rejete ? 'Déclarer à nouveau' : "J'ai payé, déclarer mon paiement"}
          </button>
        </StickyActionBar>
      )}

      <DeclareSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        echeance={echeance}
        loading={declaration.status === 'loading'}
        onSubmit={submit}
      />
    </div>
  );
}
