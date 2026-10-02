import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  ShieldCheck, AlertTriangle, Clock, Hourglass, Receipt, RefreshCw, Smartphone, Banknote, Landmark, CreditCard, Wallet, XCircle, Info,
} from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import IconButton from '../../components/common/IconButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import BottomSheet from '../../components/common/BottomSheet';
import FormField from '../../components/common/FormField';
import Callout from '../../components/common/Callout';
import FilePicker from '../../components/common/FilePicker';
import ChoiceGroup from '../../components/common/ChoiceGroup';
import StatusBadge from '../../components/missions/StatusBadge';
import StickyActionBar from '../../components/common/StickyActionBar';
import {
  fetchAbonnementStatus, fetchAbonnementHistory, declareAbonnementPayment,
} from '../../store/slices/abonnementSlice';
import { formatDate, formatPrice } from '../../utils/format';
import ButtonLabel from '../../components/common/ButtonLabel';

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
        <button type="submit" aria-busy={loading} form="declare-form" className="btn-primary btn-lg w-full" disabled={loading}>
          <ButtonLabel loading={loading} loadingLabel="Envoi…">Envoyer la déclaration</ButtonLabel>
        </button>
      )}
    >
      <form
        id="declare-form"
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); onSubmit({ methode, referenceTransaction: reference.trim(), preuve }); }}
      >
        <FormField label="Moyen de paiement utilisé">
          <ChoiceGroup label="Moyen de paiement utilisé" options={METHODES} value={methode} onChange={setMethode} columns={3} />
        </FormField>
        <FormField label="Référence de la transaction" htmlFor="ref" optional>
          <input id="ref" maxLength={255} className="input-field" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ex. MP240930.1234.A56789" />
        </FormField>
        <FormField label="Capture de la transaction" optional>
          <FilePicker id="preuve-abonnement" value={preuve} onChange={setPreuve} label="Ajouter une capture d'écran" />
        </FormField>
        <Callout tone="neutral" size="sm" icon={Info}>
          Votre accès marketplace sera rétabli après vérification par votre backoffice de rattachement.
        </Callout>
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

  const refreshButton = <IconButton icon={RefreshCw} size={19} label="Actualiser" onClick={load} spinning={status === 'loading'} />;

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
            {hero && <Callout tone={hero.tone} icon={hero.icon} title={hero.title}>{hero.text}</Callout>}

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
                <Callout tone="warning" size="sm" icon={Hourglass} className="mt-3">
                  Paiement déclaré, en attente de validation par le backoffice.
                </Callout>
              )}
              {rejete && (
                <Callout tone="danger" size="sm" icon={XCircle} className="mt-3">
                  Déclaration rejetée{paiement.commentaire_backoffice ? ` : « ${paiement.commentaire_backoffice} »` : '.'} Vous pouvez déclarer à nouveau.
                </Callout>
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
                          <StatusBadge {...(ECHEANCE_STATUT[e.statut] || { label: e.statut })} size="sm" />
                          {p && e.statut !== 'payee' && <StatusBadge {...(PAIEMENT_STATUT[p.statut] || { label: p.statut })} size="sm" />}
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
