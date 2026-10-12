import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  SearchX, CircleCheckBig, Ban, Package, Banknote, KeyRound, Zap, MessageSquareText, CircleX,
} from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StickyActionBar from '../../components/common/StickyActionBar';
import SlideToConfirm from '../../components/common/SlideToConfirm';
import Callout from '../../components/common/Callout';
import { ExpeditionStatusBadge } from '../../components/missions/StatusBadge';
import StepBar from '../../components/missions/StepBar';
import ContactCard from '../../components/missions/ContactCard';
import MissionMap from '../../components/missions/MissionMap';
import ProofCaptureModal from '../../components/missions/ProofCaptureModal';
import RouteLine from '../../components/missions/RouteLine';
import MissionCompleteScreen from '../../components/missions/MissionCompleteScreen';
import ProposalPanel from '../../components/missions/ProposalPanel';
import MissionNotes from '../../components/missions/MissionNotes';
import { expeditionRoute } from '../../components/missions/missionRoute';
import {
  fetchActiveMissions, fetchMissionHistory, fetchMissionProposals, runMissionAction, selectMissionById,
  acceptMissionProposal, refuseMissionProposal,
} from '../../store/slices/missionsSlice';
import { fetchBalance } from '../../store/slices/earningsSlice';
import {
  expeditionPhase, expeditionAction, expeditionStepIndex, EXPEDITION_STEPS,
  MISSION_TYPE_LABEL, MISSION_MODE_LABEL, missionInstructions,
} from '../../utils/missionFlow';
import { formatPrice, formatDateTime, formatDuration } from '../../utils/format';
import { isValidPoint } from '../../services/routingService';
import { ROUTES } from '../../routes';

// Actions qui passent par une capture de preuve ; les autres partent
// directement apres le glissement (qui vaut confirmation).
const PROOF_ACTIONS = ['confirmPickup', 'validateDelivery'];

// Actions qui cloturent la mission : ecran de fin au lieu d'un simple toast.
const CLOSING_ACTIONS = ['confirmAgencyDrop', 'validateDelivery'];

// Arret vers lequel le livreur se rend, selon la phase (cf. missionRoute).
const NEXT_STOP = {
  enlevement: { start: 'from', pickup: 'from', deposit: 'to' },
  livraison: { start: 'to', deliver: 'to' },
};

// Libelle du curseur et consequence affichee au-dessus, pour les actions sans preuve.
const SLIDE_COPY = {
  startPickup: {
    label: "Je pars chez l'expéditeur",
    hint: "L'expéditeur et l'agence verront que vous êtes en route.",
  },
  startDelivery: {
    label: 'Je pars livrer',
    hint: 'Le destinataire verra que le colis est en cours de livraison.',
  },
  confirmAgencyDrop: {
    label: 'Colis déposé à l’agence',
    hint: 'La mission sera clôturée et votre solde crédité.',
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
  const navigate = useNavigate();
  const mission = useSelector((state) => selectMissionById(state, id));
  const {
    proposals, active, history, pendingAction,
  } = useSelector((state) => state.missions);
  const disponible = useSelector((state) => Boolean(state.auth.user?.disponible));
  const [sheet, setSheet] = useState(null); // action key en cours de confirmation
  const [actionError, setActionError] = useState(null);
  const [proposalError, setProposalError] = useState(null);
  const [completed, setCompleted] = useState(null); // { duree } apres cloture

  // Pas d'endpoint de detail : la mission est retrouvee dans les listes chargees.
  useEffect(() => {
    if (mission) return;
    if (!proposals.loaded) dispatch(fetchMissionProposals());
    if (!active.loaded) dispatch(fetchActiveMissions());
    if (!history.loaded) dispatch(fetchMissionHistory({ statut: '', page: 1 }));
  }, [dispatch, mission, proposals.loaded, active.loaded, history.loaded]);

  if (!mission) {
    const loading = !active.loaded || !history.loaded || !proposals.loaded
      || active.status === 'loading' || history.status === 'loading' || proposals.status === 'loading';
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Mission" back />
        {loading ? <LoadingSpinner label="Chargement de la mission…" /> : (
          <div className="page-container py-8">
            <EmptyState
              icon={SearchX}
              tone="error"
              title="Mission introuvable"
              description="Cette mission n'existe plus ou ne vous est pas assignée. Une proposition sans réponse expire au bout de 15 minutes."
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
  const instructions = missionInstructions(mission);
  const isProposal = phase === 'proposal';

  const acceptProposal = async () => {
    setProposalError(null);
    const result = await dispatch(acceptMissionProposal(mission.id));
    if (acceptMissionProposal.fulfilled.match(result)) {
      toast.success('Mission acceptée. Elle est à vous !');
      dispatch(fetchActiveMissions());
    } else {
      setProposalError(result.payload);
    }
  };

  const refuseProposal = async (motif) => {
    setProposalError(null);
    const result = await dispatch(refuseMissionProposal({ missionId: mission.id, motif }));
    if (refuseMissionProposal.fulfilled.match(result)) {
      toast.message('Mission refusée', { description: 'Elle retourne au backoffice.' });
      navigate(ROUTES.MISSIONS, { replace: true });
      return true;
    }
    setProposalError(result.payload);
    return false;
  };

  // Contact prioritaire selon l'etape.
  const agencyContact = route.agence ? { ...route.agence, nom: route.agence.nom } : null;
  const primary = isPickup && phase === 'deposit'
    ? { role: "Agence de dépôt", contact: agencyContact, isAgency: true }
    : { role: route.contact.role, contact: route.contact, isAgency: false };
  const secondary = isPickup && phase === 'deposit'
    ? { role: 'Expéditeur', contact: route.contact, isAgency: false }
    : agencyContact ? { role: isPickup ? 'Agence de dépôt' : 'Agence de retrait', contact: agencyContact, isAgency: true } : null;

  const mapOrigin = isPickup ? route.contact : route.agence;
  const mapDestination = isPickup ? route.agence : route.contact;
  const nextStop = NEXT_STOP[mission.type]?.[phase] || null;

  const hasMap = [mapOrigin, mapDestination].some((p) => p && isValidPoint(p));
  const slide = action ? SLIDE_COPY[action.key] : null;
  const showDeliveryCode = mission.type === 'livraison' && ['start', 'deliver'].includes(phase);
  const showInstructions = instructions && phase !== 'done' && phase !== 'cancelled';

  const run = async (actionKey, proof) => {
    setActionError(null);
    const result = await dispatch(runMissionAction({ mission, actionKey, proof }));
    if (runMissionAction.fulfilled.match(result)) {
      if (CLOSING_ACTIONS.includes(actionKey)) {
        dispatch(fetchBalance());
        setCompleted({ duree: mission.assignee_le ? formatDuration(mission.assignee_le) : null });
      } else {
        toast.success(SUCCESS_COPY[actionKey]);
      }
      setSheet(null);
      dispatch(fetchActiveMissions());
    } else {
      setActionError(result.payload);
    }
  };

  // Glissement valide : preuve a saisir, ou action envoyee directement.
  const onSlide = () => {
    setActionError(null);
    if (PROOF_ACTIONS.includes(action.key)) setSheet(action.key);
    else run(action.key);
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title={exp.reference || 'Mission'}
        subtitle={`${MISSION_TYPE_LABEL[mission.type] || 'Mission'} · ${MISSION_MODE_LABEL[mission.mode] || mission.mode || ''}`}
        back
      />

      {/* Carte bord a bord : le resume vient la chevaucher, facon feuille. */}
      {hasMap && (
        <MissionMap
          variant="hero"
          stops={[
            mapOrigin && { key: 'from', kind: isPickup ? 'pickup' : 'agency', ...mapOrigin, title: route.from.title || 'Départ', detail: route.from.detail },
            mapDestination && { key: 'to', kind: isPickup ? 'agency' : 'dropoff', ...mapDestination, title: route.to.title || 'Arrivée', detail: route.to.detail },
          ]}
          nextStop={nextStop}
        />
      )}

      <div className={`page-container relative z-10 flex-1 space-y-4 pb-4 ${hasMap ? '-mt-6' : 'pt-4'}`}>
        {/* Resume : etat, montant, progression et trajet d'un coup d'oeil */}
        <div className="card p-4 shadow-raised">
          <div className="flex items-center justify-between gap-3">
            <ExpeditionStatusBadge phase={phase} />
            <p className="tabular font-heading text-xl font-bold text-surface-900">{formatPrice(mission.montant_final)}</p>
          </div>
          {!['offer', 'cancelled', 'proposal', 'refused'].includes(phase) && (
            <div className="mt-4">
              <StepBar steps={EXPEDITION_STEPS[mission.type] || EXPEDITION_STEPS.livraison} current={expeditionStepIndex(mission)} showLabels />
            </div>
          )}
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
        {phase === 'refused' && (
          <Callout tone="neutral" icon={CircleX} title={mission.statut === 'expiree' ? 'Proposition expirée' : 'Mission refusée'}>
            Elle a été rendue au backoffice pour être réattribuée.
          </Callout>
        )}
        {isProposal && (
          <ProposalPanel
            title="Le backoffice vous propose cette mission"
            expireLe={mission.expire_le}
            loading={busy}
            error={proposalError}
            disabled={!disponible}
            disabledReason="Passez disponible pour accepter une mission."
            onAccept={acceptProposal}
            onRefuse={refuseProposal}
          />
        )}
        {phase === 'offer' && (
          <Callout to={`${ROUTES.MISSIONS}?onglet=disponibles`} tone="info" icon={Zap} title="Mission express ouverte aux offres">
            Proposez votre tarif depuis l'onglet Express.
          </Callout>
        )}

        <section className="space-y-3">
          <h2 className="section-title">{action ? 'Prochaine étape' : 'Contacts'}</h2>
          <ContactCard role={primary.role} contact={primary.contact} isAgency={primary.isAgency} highlight={Boolean(action)} />
          {secondary?.contact && <ContactCard role={secondary.role} contact={secondary.contact} isAgency={secondary.isAgency} />}
        </section>

        {/* Consignes terrain regroupees : instructions du client et code de remise. */}
        {(showInstructions || showDeliveryCode) && (
          <section className="card divide-y divide-surface-100" aria-label="Consignes">
            {showInstructions && (
              <div className="flex items-start gap-3 p-4">
                <MessageSquareText size={18} className="mt-0.5 shrink-0 text-warning-700" aria-hidden="true" />
                <div className="min-w-0 text-sm">
                  <p className="eyebrow">{isPickup ? "Instructions de l'expéditeur" : 'Instructions du destinataire'}</p>
                  <p className="mt-0.5 leading-relaxed text-surface-800">{instructions}</p>
                </div>
              </div>
            )}
            {showDeliveryCode && (
              <div className="flex items-start gap-3 p-4">
                <KeyRound size={18} className="mt-0.5 shrink-0 text-primary-600" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-surface-700">
                  À la remise, demandez au destinataire son <strong className="text-surface-900">code à 4 chiffres</strong>. Sans ce code, la livraison ne peut pas être clôturée.
                </p>
              </div>
            )}
          </section>
        )}

        {['assignee', 'terminee'].includes(mission.statut) && (
          <MissionNotes missionId={mission.id} editable={mission.statut === 'assignee'} />
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
        <StickyActionBar hint={slide?.hint || action.hint}>
          <div className="w-full space-y-2">
            {actionError && !sheet && <p className="field-error mt-0 text-center" role="alert">{actionError}</p>}
            <SlideToConfirm label={slide?.label || action.label} onConfirm={onSlide} loading={busy} />
          </div>
        </StickyActionBar>
      )}

      <ProofCaptureModal
        open={sheet === 'confirmPickup'}
        onClose={() => setSheet(null)}
        onSubmit={(proof) => run('confirmPickup', proof)}
        loading={busy}
        error={actionError}
        title="Confirmer la récupération"
        description="Colis récupéré chez l'expéditeur. Ajoutez une preuve (recommandé)."
        submitLabel="Confirmer la récupération"
      />
      <ProofCaptureModal
        open={sheet === 'validateDelivery'}
        onClose={() => setSheet(null)}
        onSubmit={(proof) => run('validateDelivery', proof)}
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
