import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchX, CircleCheckBig, Ban, Package, Banknote, KeyRound, Zap } from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StickyActionBar from '../../components/common/StickyActionBar';
import Callout from '../../components/common/Callout';
import { ExpeditionStatusBadge } from '../../components/missions/StatusBadge';
import MissionStepper from '../../components/missions/MissionStepper';
import ContactCard from '../../components/missions/ContactCard';
import MapRoutePreview from '../../components/missions/MapRoutePreview';
import ProofCaptureModal from '../../components/missions/ProofCaptureModal';
import ConfirmSheet from '../../components/missions/ConfirmSheet';
import RouteLine from '../../components/missions/RouteLine';
import MissionCompleteScreen from '../../components/missions/MissionCompleteScreen';
import { expeditionRoute } from '../../components/missions/missionRoute';
import {
  fetchActiveMissions, fetchMissionHistory, runMissionAction, selectMissionById,
} from '../../store/slices/missionsSlice';
import { fetchBalance } from '../../store/slices/earningsSlice';
import {
  expeditionPhase, expeditionAction, expeditionStepIndex, EXPEDITION_STEPS,
  MISSION_TYPE_LABEL, MISSION_MODE_LABEL,
} from '../../utils/missionFlow';
import { formatPrice, formatDateTime, formatDuration } from '../../utils/format';
import { ROUTES } from '../../routes';
import ButtonLabel from '../../components/common/ButtonLabel';

// Actions qui passent par une capture de preuve (sinon simple confirmation).
const PROOF_ACTIONS = ['confirmPickup', 'validateDelivery'];

// Actions qui cloturent la mission : ecran de fin au lieu d'un simple toast.
const CLOSING_ACTIONS = ['confirmAgencyDrop', 'validateDelivery'];

// Arret vers lequel le livreur se rend, selon la phase (cf. missionRoute).
const NEXT_STOP = {
  enlevement: { start: 'from', pickup: 'from', deposit: 'to' },
  livraison: { start: 'to', deliver: 'to' },
};

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
  const [completed, setCompleted] = useState(null); // { duree } apres cloture

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
  const nextStop = NEXT_STOP[mission.type]?.[phase] || null;

  const openAction = () => {
    setActionError(null);
    setSheet(action.key);
  };

  const run = async (proof) => {
    setActionError(null);
    const result = await dispatch(runMissionAction({ mission, actionKey: sheet, proof }));
    if (runMissionAction.fulfilled.match(result)) {
      if (CLOSING_ACTIONS.includes(sheet)) {
        dispatch(fetchBalance());
        setCompleted({ duree: mission.assignee_le ? formatDuration(mission.assignee_le) : null });
      } else {
        toast.success(SUCCESS_COPY[sheet]);
      }
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
        <MapRoutePreview origin={mapOrigin} destination={mapDestination} />

        {/* Resume : etat, montant et trajet d'un coup d'oeil */}
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <ExpeditionStatusBadge phase={phase} />
            <p className="tabular font-heading text-xl font-bold text-surface-900">{formatPrice(mission.montant_final)}</p>
          </div>
          <div className="mt-4">
            <RouteLine from={route.from} to={route.to} active={nextStop} />
          </div>
          <div className="divider mt-4 divide-y divide-surface-100">
            <InfoRow icon={Banknote} label="Paiement" value={mission.statut_paiement === 'paye' ? 'Payé (espèces)' : 'Espèces à la clôture'} />
            {mission.assignee_le && <InfoRow icon={Package} label="Assignée" value={formatDateTime(mission.assignee_le)} />}
          </div>
        </div>

        {phase === 'done' && (
          <Callout tone="success" icon={CircleCheckBig} title="Mission terminée">
            {formatPrice(mission.montant_final)} crédité sur votre solde livreur.
          </Callout>
        )}
        {phase === 'cancelled' && <Callout tone="danger" icon={Ban} title="Cette mission a été annulée." />}
        {phase === 'offer' && (
          <Callout to={`${ROUTES.MISSIONS}?onglet=disponibles`} tone="info" icon={Zap} title="Mission express ouverte aux offres">
            Proposez votre tarif depuis l'onglet Express.
          </Callout>
        )}

        {mission.type === 'livraison' && phase === 'deliver' && (
          <Callout tone="emphasis" icon={KeyRound}>
            À la remise, demandez au destinataire son <strong className="text-white">code à 4 chiffres</strong>. Sans ce code, la livraison ne peut pas être clôturée.
          </Callout>
        )}

        <section className="space-y-3">
          <h2 className="section-title">{action ? 'Prochaine étape' : 'Contacts'}</h2>
          <ContactCard role={primary.role} contact={primary.contact} isAgency={primary.isAgency} highlight={Boolean(action)} />
          {secondary?.contact && <ContactCard role={secondary.role} contact={secondary.contact} isAgency={secondary.isAgency} />}
        </section>

        {phase !== 'offer' && phase !== 'cancelled' && (
          <section className="card p-4">
            <h2 className="mb-4 text-sm font-semibold text-surface-900">Progression</h2>
            <MissionStepper steps={EXPEDITION_STEPS[mission.type] || EXPEDITION_STEPS.livraison} current={expeditionStepIndex(mission)} />
          </section>
        )}

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
          <button type="button" aria-busy={busy} className="btn-accent btn-lg w-full" onClick={openAction} disabled={busy}>
            <ButtonLabel loading={busy} loadingLabel="Envoi…">{action.label}</ButtonLabel>
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

      {completed && (
        <MissionCompleteScreen
          title={isPickup ? 'Mission terminée !' : 'Livraison terminée !'}
          description={isPickup
            ? "Le colis est déposé à l'agence. Votre solde a été crédité."
            : 'Le colis est remis au destinataire. Votre solde a été crédité.'}
          stats={[
            { label: 'Gain crédité', value: formatPrice(mission.montant_final) },
            ...(completed.duree ? [{ label: 'Durée', value: completed.duree }] : []),
          ]}
          primary={{ label: 'Voir mes gains', to: ROUTES.EARNINGS }}
          secondary={{ label: "Retour à l'accueil", to: ROUTES.HOME }}
          onClose={() => setCompleted(null)}
        />
      )}
    </div>
  );
}
