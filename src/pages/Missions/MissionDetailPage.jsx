import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchX, CircleCheckBig, Ban, Package, Banknote, KeyRound } from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StickyActionBar from '../../components/common/StickyActionBar';
import { ExpeditionStatusBadge } from '../../components/missions/StatusBadge';
import MissionStepper from '../../components/missions/MissionStepper';
import ContactCard from '../../components/missions/ContactCard';
import MapRoutePreview from '../../components/missions/MapRoutePreview';
import ProofCaptureModal from '../../components/missions/ProofCaptureModal';
import ConfirmSheet from '../../components/missions/ConfirmSheet';
import { expeditionRoute } from '../../components/missions/missionRoute';
import {
  fetchActiveMissions, fetchMissionHistory, runMissionAction, selectMissionById,
} from '../../store/slices/missionsSlice';
import { fetchBalance } from '../../store/slices/earningsSlice';
import {
  expeditionPhase, expeditionAction, expeditionStepIndex, EXPEDITION_STEPS,
  MISSION_TYPE_LABEL, MISSION_MODE_LABEL,
} from '../../utils/missionFlow';
import { formatPrice, formatDateTime } from '../../utils/format';
import { ROUTES } from '../../routes';

// Actions qui passent par une capture de preuve (sinon simple confirmation).
const PROOF_ACTIONS = ['confirmPickup', 'validateDelivery'];

const CONFIRM_COPY = {
  startPickup: {
    title: "Démarrer l'enlèvement ?",
    description: "L'expéditeur et l'agence verront que vous êtes en route.",
    confirmLabel: "Je pars chez l'expéditeur",
  },
  startDelivery: {
    title: 'Démarrer la livraison ?',
    description: 'Le destinataire verra que le colis est en cours de livraison.',
    confirmLabel: 'Je pars livrer',
  },
  confirmAgencyDrop: {
    title: "Confirmer le dépôt à l'agence ?",
    description: "Le colis est remis à l'agence de départ. La mission sera clôturée et votre solde crédité.",
    confirmLabel: 'Confirmer le dépôt',
  },
};

const SUCCESS_COPY = {
  startPickup: 'Enlèvement démarré. Bonne route !',
  confirmPickup: 'Récupération du colis confirmée.',
  confirmAgencyDrop: 'Mission terminée. Votre solde a été crédité.',
  startDelivery: 'Livraison démarrée. Bonne route !',
  validateDelivery: 'Colis livré. Votre solde a été crédité.',
};

function InfoRow({ icon, label, value }) {
  const Icon = icon;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-surface-500">
        <Icon size={16} className="text-surface-400" aria-hidden="true" /> {label}
      </span>
      <span className="text-right text-sm font-semibold text-surface-800">{value}</span>
    </div>
  );
}

export default function MissionDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const mission = useSelector((state) => selectMissionById(state, id));
  const { active, history, pendingAction } = useSelector((state) => state.missions);
  const [sheet, setSheet] = useState(null); // action key en cours de confirmation
  const [actionError, setActionError] = useState(null);

  // Pas d'endpoint de detail : la mission est retrouvee dans les listes chargees.
  useEffect(() => {
    if (mission) return;
    if (!active.loaded) dispatch(fetchActiveMissions());
    if (!history.loaded) dispatch(fetchMissionHistory({ statut: '', page: 1 }));
  }, [dispatch, mission, active.loaded, history.loaded]);

  if (!mission) {
    const loading = !active.loaded || !history.loaded || active.status === 'loading' || history.status === 'loading';
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Mission" back />
        {loading ? <LoadingSpinner label="Chargement de la mission…" /> : (
          <div className="page-container py-8">
            <EmptyState
              icon={SearchX}
              tone="error"
              title="Mission introuvable"
              description="Cette mission n'existe plus ou ne vous est pas assignée."
              action={<Link to={ROUTES.MISSIONS} className="btn-secondary btn-sm">Retour aux missions</Link>}
            />
          </div>
        )}
      </div>
    );
  }

  const phase = expeditionPhase(mission);
  const action = expeditionAction(mission);
  const route = expeditionRoute(mission);
  const exp = mission.expedition || {};
  const isPickup = mission.type === 'enlevement';
  const busy = pendingAction === mission.id;
  const colis = Array.isArray(exp.colis) ? exp.colis : [];

  // Contact prioritaire selon l'etape.
  const agencyContact = route.agence ? { ...route.agence, nom: route.agence.nom } : null;
  const primary = isPickup && phase === 'deposit'
    ? { role: "Agence de dépôt", contact: agencyContact, isAgency: true }
    : { role: route.contact.role, contact: route.contact, isAgency: false };
  const secondary = isPickup && phase === 'deposit'
    ? { role: 'Expéditeur', contact: route.contact, isAgency: false }
    : agencyContact ? { role: isPickup ? 'Agence de dépôt' : "Agence d'origine", contact: agencyContact, isAgency: true } : null;

  const mapOrigin = isPickup ? route.contact : route.agence;
  const mapDestination = isPickup ? route.agence : route.contact;

  const openAction = () => {
    setActionError(null);
    setSheet(action.key);
  };

  const run = async (proof) => {
    setActionError(null);
    const result = await dispatch(runMissionAction({ mission, actionKey: sheet, proof }));
    if (runMissionAction.fulfilled.match(result)) {
      toast.success(SUCCESS_COPY[sheet]);
      if (sheet === 'confirmAgencyDrop' || sheet === 'validateDelivery') dispatch(fetchBalance());
      setSheet(null);
      dispatch(fetchActiveMissions());
    } else {
      setActionError(result.payload);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={exp.reference || 'Mission'}
        subtitle={`${MISSION_TYPE_LABEL[mission.type] || 'Mission'} · ${MISSION_MODE_LABEL[mission.mode] || mission.mode || ''}`}
        back
      />

      <div className="page-container flex-1 space-y-4 py-4">
        {/* Resume */}
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <ExpeditionStatusBadge phase={phase} />
            <p className="tabular text-xl font-bold text-surface-900">{formatPrice(mission.montant_final)}</p>
          </div>
          <div className="divider mt-3 divide-y divide-surface-100">
            <InfoRow icon={Banknote} label="Paiement" value={mission.statut_paiement === 'paye' ? 'Payé (espèces)' : 'Espèces à la clôture'} />
            {mission.assignee_le && <InfoRow icon={Package} label="Assignée" value={formatDateTime(mission.assignee_le)} />}
          </div>
        </div>

        {phase === 'done' && (
          <div className="flex items-start gap-3 rounded-2xl border border-success-200 bg-success-50 p-4">
            <CircleCheckBig size={22} className="mt-0.5 shrink-0 text-success-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-success-800">Mission terminée</p>
              <p className="text-sm text-success-700">{formatPrice(mission.montant_final)} crédité sur votre solde livreur.</p>
            </div>
          </div>
        )}
        {phase === 'cancelled' && (
          <div className="flex items-start gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4">
            <Ban size={22} className="mt-0.5 shrink-0 text-danger-600" aria-hidden="true" />
            <p className="text-sm font-medium text-danger-700">Cette mission a été annulée.</p>
          </div>
        )}
        {phase === 'offer' && (
          <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800">
            Mission express ouverte aux offres. <Link to={`${ROUTES.MISSIONS}?onglet=disponibles`} className="font-semibold underline underline-offset-2">Proposer un tarif</Link>
          </div>
        )}

        {phase !== 'offer' && phase !== 'cancelled' && (
          <section className="card p-4">
            <h2 className="mb-4 text-sm font-semibold text-surface-900">Progression</h2>
            <MissionStepper steps={EXPEDITION_STEPS[mission.type] || EXPEDITION_STEPS.livraison} current={expeditionStepIndex(mission)} />
          </section>
        )}

        {mission.type === 'livraison' && phase === 'deliver' && (
          <div className="flex items-start gap-3 rounded-2xl bg-surface-900 p-4 text-white">
            <KeyRound size={20} className="mt-0.5 shrink-0 text-accent-300" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-white/85">
              À la remise, demandez au destinataire son <strong className="text-white">code à 4 chiffres</strong>. Sans ce code, la livraison ne peut pas être clôturée.
            </p>
          </div>
        )}

        <MapRoutePreview origin={mapOrigin} destination={mapDestination} />

        <ContactCard role={primary.role} contact={primary.contact} isAgency={primary.isAgency} highlight={Boolean(action)} />
        {secondary?.contact && <ContactCard role={secondary.role} contact={secondary.contact} isAgency={secondary.isAgency} />}

        {(colis.length > 0 || exp.pays_depart || exp.pays_destination) && (
          <section className="card p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-surface-900">
              <Package size={16} className="text-surface-400" aria-hidden="true" /> Expédition
            </h2>
            <dl className="divide-y divide-surface-100 text-sm">
              {exp.pays_depart && <div className="flex justify-between py-2"><dt className="text-surface-500">Départ</dt><dd className="font-medium text-surface-800">{exp.pays_depart}</dd></div>}
              {exp.pays_destination && <div className="flex justify-between py-2"><dt className="text-surface-500">Destination</dt><dd className="font-medium text-surface-800">{exp.pays_destination}</dd></div>}
              {colis.map((c, i) => (
                <div key={c.id || i} className="flex justify-between gap-3 py-2">
                  <dt className="truncate text-surface-500">{c.designation || c.description || c.nom || `Colis ${i + 1}`}</dt>
                  <dd className="shrink-0 font-medium text-surface-800">{c.poids ? `${c.poids} kg` : ''}{c.quantite ? ` × ${c.quantite}` : ''}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {action && (
        <StickyActionBar hint={action.hint}>
          <button type="button" className="btn-accent btn-lg w-full" onClick={openAction} disabled={busy}>
            {busy ? 'Envoi…' : action.label}
          </button>
        </StickyActionBar>
      )}

      {sheet && !PROOF_ACTIONS.includes(sheet) && (
        <ConfirmSheet
          open
          onClose={() => setSheet(null)}
          onConfirm={() => run()}
          loading={busy}
          error={actionError}
          {...CONFIRM_COPY[sheet]}
        />
      )}

      <ProofCaptureModal
        open={sheet === 'confirmPickup'}
        onClose={() => setSheet(null)}
        onSubmit={run}
        loading={busy}
        error={actionError}
        title="Confirmer la récupération"
        description="Colis récupéré chez l'expéditeur. Ajoutez une preuve (recommandé)."
        submitLabel="Confirmer la récupération"
      />
      <ProofCaptureModal
        open={sheet === 'validateDelivery'}
        onClose={() => setSheet(null)}
        onSubmit={run}
        loading={busy}
        error={actionError}
        requireCode
        codeLabel="Code du destinataire"
        title="Valider la remise"
        description="Saisissez le code à 4 chiffres communiqué par le destinataire."
        submitLabel="Valider la livraison"
        photoLabel="Photo de la remise"
      />
    </div>
  );
}
