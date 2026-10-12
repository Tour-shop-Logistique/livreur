import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  SearchX, CircleCheckBig, KeyRound, Lock, ShoppingBag, Banknote, Package, MessageSquareText, CircleX,
} from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StickyActionBar from '../../components/common/StickyActionBar';
import Callout from '../../components/common/Callout';
import { MarketplaceStatusBadge } from '../../components/missions/StatusBadge';
import MissionStepper from '../../components/missions/MissionStepper';
import ContactCard from '../../components/missions/ContactCard';
import MissionMap from '../../components/missions/MissionMap';
import RouteLine from '../../components/missions/RouteLine';
import ProofCaptureModal from '../../components/missions/ProofCaptureModal';
import ProposalPanel from '../../components/missions/ProposalPanel';
import MissionCompleteScreen from '../../components/missions/MissionCompleteScreen';
import {
  fetchMarketplaceMine, fetchMarketplaceDetail, startMarketplaceDelivery, validateMarketplaceDelivery,
  acceptMarketplaceProposal, refuseMarketplaceProposal, selectMarketplaceById,
} from '../../store/slices/marketplaceSlice';
import { fetchAbonnementStatus } from '../../store/slices/abonnementSlice';
import { useRealtimeMission } from '../../hooks/useRealtimeUpdates';
import {
  MARKETPLACE_STEPS, marketplaceStepIndex, marketplaceAction, marketplacePickup, marketplaceDropoff, placeLabel,
} from '../../utils/missionFlow';
import { formatPrice, formatDateTime, formatDuration } from '../../utils/format';
import { ROUTES } from '../../routes';
import ButtonLabel from '../../components/common/ButtonLabel';

// Livraison marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §7) :
// [direct] proposee -> accepter | refuser
// assignee -> demarrer { preuve de retrait? } (en_cours) -> valider { code, preuve de remise? } (terminee).
export default function MarketplaceDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const livraison = useSelector((state) => selectMarketplaceById(state, id));
  const { mine, pendingAction } = useSelector((state) => state.marketplace);
  const bloque = useSelector((state) => state.abonnement.bloque);
  const disponible = useSelector((state) => Boolean(state.auth.user?.disponible));
  const [sheet, setSheet] = useState(null); // 'start' | 'validate'
  const [actionError, setActionError] = useState(null);
  const [proposalError, setProposalError] = useState(null);
  const [completed, setCompleted] = useState(null); // { duree } apres validation

  const statut = livraison?.statut;

  useEffect(() => {
    if (!livraison && !mine.loaded) dispatch(fetchMarketplaceMine());
  }, [dispatch, livraison, mine.loaded]);

  // Detail complet (adresses, contacts, articles) des qu'elle m'est assignee.
  useEffect(() => {
    if (statut && statut !== 'proposee' && statut !== 'en_attente') dispatch(fetchMarketplaceDetail(id));
  }, [dispatch, id, statut]);

  // Mise a jour en direct (proposition expiree, livraison assignee…).
  useRealtimeMission(id, () => dispatch(fetchMarketplaceMine()));

  if (!livraison) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Livraison marketplace" back />
        {!mine.loaded || mine.status === 'loading' ? <LoadingSpinner label="Chargement…" /> : (
          <div className="page-container py-8">
            <EmptyState
              icon={mine.blocked ? Lock : SearchX}
              tone="error"
              title={mine.blocked ? 'Marketplace suspendue' : 'Livraison introuvable'}
              description={mine.blocked ? 'Régularisez votre abonnement pour accéder à vos livraisons marketplace.' : "Cette livraison n'existe plus ou ne vous est pas assignée. Une proposition sans réponse expire au bout de 15 minutes."}
              action={mine.blocked
                ? <Link to={ROUTES.ABONNEMENT} className="btn-primary btn-sm">Régulariser</Link>
                : <Link to={`${ROUTES.MISSIONS}?onglet=marketplace`} className="btn-secondary btn-sm">Retour</Link>}
            />
          </div>
        )}
      </div>
    );
  }

  const action = marketplaceAction(livraison);
  const busy = pendingAction === livraison.id;
  const commande = livraison.commande || {};
  const items = Array.isArray(commande.items) ? commande.items : [];
  const done = statut === 'terminee' || statut === 'livree';
  const isProposal = statut === 'proposee';
  const refused = statut === 'refusee' || statut === 'expiree';
  const pickup = marketplacePickup(livraison);
  const dropoff = marketplaceDropoff(livraison);
  const montant = livraison.montant_final ?? livraison.montant_propose_vendeur;
  const pickupContact = pickup && { ...pickup, nom: pickup.nom || 'Vendeur' };
  const dropoffContact = dropoff && { ...dropoff, nom: dropoff.nom || 'Acheteur' };
  // Prochain arret : chez le vendeur avant le demarrage, chez l'acheteur ensuite.
  const toBuyer = statut === 'en_cours';

  const onAccept = async () => {
    setProposalError(null);
    const result = await dispatch(acceptMarketplaceProposal(livraison.id));
    if (acceptMarketplaceProposal.fulfilled.match(result)) {
      toast.success('Livraison acceptée', { description: 'Récupérez l’article chez le vendeur.' });
      // L'acceptation peut demarrer l'abonnement marketplace du livreur.
      dispatch(fetchAbonnementStatus());
      dispatch(fetchMarketplaceDetail(livraison.id));
    } else {
      setProposalError(result.payload);
    }
  };

  const onRefuse = async (motif) => {
    setProposalError(null);
    const result = await dispatch(refuseMarketplaceProposal({ id: livraison.id, motif }));
    if (refuseMarketplaceProposal.fulfilled.match(result)) {
      toast.message('Livraison refusée', { description: 'Le vendeur va choisir un autre mode de livraison.' });
      navigate(`${ROUTES.MISSIONS}?onglet=marketplace`, { replace: true });
      return true;
    }
    setProposalError(result.payload);
    return false;
  };

  const onStart = async (proof) => {
    setActionError(null);
    const result = await dispatch(startMarketplaceDelivery({ id: livraison.id, proof }));
    if (startMarketplaceDelivery.fulfilled.match(result)) {
      toast.success('Course démarrée. Bonne route !');
      setSheet(null);
    } else {
      setActionError(result.payload);
    }
  };

  const onValidate = async ({ code, photo, signature, lat, lng }) => {
    setActionError(null);
    const result = await dispatch(validateMarketplaceDelivery({
      id: livraison.id, code, photo, signature, lat, lng,
    }));
    if (validateMarketplaceDelivery.fulfilled.match(result)) {
      setCompleted({ duree: livraison.assignee_le ? formatDuration(livraison.assignee_le) : null });
      setSheet(null);
      dispatch(fetchMarketplaceMine());
    } else {
      setActionError(result.payload);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Livraison marketplace" subtitle={`Cde #${String(commande.id || livraison.commande_marketplace_id || '').slice(0, 8)}`} back />

      <div className="page-container flex-1 space-y-4 py-4">
        {!isProposal && (
          <MissionMap
            stops={[
              pickup && { key: 'from', kind: 'pickup', ...pickup, title: pickupContact.nom, detail: placeLabel(pickup) },
              dropoff && { key: 'to', kind: 'dropoff', ...dropoff, title: dropoffContact.nom, detail: placeLabel(dropoff) },
            ]}
            nextStop={done || refused ? null : toBuyer ? 'to' : 'from'}
          />
        )}

        <div className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <MarketplaceStatusBadge statut={statut} />
            <p className="tabular text-xl font-bold text-surface-900">{formatPrice(montant)}</p>
          </div>
          {(pickup || dropoff) && (
            <div className="mt-4">
              <RouteLine
                from={{ label: 'Retrait', title: isProposal ? placeLabel(pickup) : pickup?.nom || placeLabel(pickup), detail: !isProposal ? placeLabel(pickup) : null }}
                to={{ label: 'Livraison', title: isProposal ? placeLabel(dropoff) : dropoff?.nom || placeLabel(dropoff), detail: !isProposal ? placeLabel(dropoff) : null }}
                active={isProposal || refused || done ? null : toBuyer ? 'to' : 'from'}
              />
            </div>
          )}
          <dl className="divider mt-3 divide-y divide-surface-100 text-sm">
            {commande.montant_articles != null && (
              <div className="flex justify-between py-2.5"><dt className="flex items-center gap-2 text-surface-500"><ShoppingBag size={16} className="text-surface-400" />Valeur des articles</dt><dd className="font-semibold text-surface-800">{formatPrice(commande.montant_articles)}</dd></div>
            )}
            <div className="flex justify-between py-2.5"><dt className="flex items-center gap-2 text-surface-500"><Banknote size={16} className="text-surface-400" />Règlement</dt><dd className="font-semibold text-surface-800">Hors application</dd></div>
            {livraison.assignee_le && (
              <div className="flex justify-between py-2.5"><dt className="text-surface-500">Assignée</dt><dd className="font-semibold text-surface-800">{formatDateTime(livraison.assignee_le)}</dd></div>
            )}
          </dl>
        </div>

        {isProposal && (
          <ProposalPanel
            title="Un vendeur vous confie cette livraison"
            expireLe={livraison.expire_le}
            loading={busy}
            error={proposalError}
            disabled={!disponible || bloque}
            disabledReason={bloque ? 'Abonnement marketplace en retard : régularisez pour accepter.' : 'Passez disponible pour accepter une livraison.'}
            onAccept={onAccept}
            onRefuse={onRefuse}
          >
            <p className="text-xs text-surface-500">
              Adresses et contacts complets visibles après acceptation. Accepter peut démarrer votre abonnement marketplace.
            </p>
          </ProposalPanel>
        )}

        {refused && (
          <Callout tone="neutral" icon={CircleX} title={statut === 'expiree' ? 'Proposition expirée' : 'Livraison refusée'}>
            Le vendeur peut choisir un autre mode de livraison.
          </Callout>
        )}

        {bloque && !done && !isProposal && (
          <Callout to={ROUTES.ABONNEMENT} tone="danger" icon={Lock} title="Abonnement marketplace en retard">
            Les actions sont bloquées jusqu'à régularisation. Touchez pour régulariser.
          </Callout>
        )}

        {done && <Callout tone="success" icon={CircleCheckBig} title="Livraison validée. Merci !" />}

        {statut === 'en_cours' && (
          <Callout tone="emphasis" icon={KeyRound}>
            À la remise, l'acheteur vous communique un <strong className="text-white">code à 4 chiffres</strong>. Il est indispensable pour valider la livraison.
          </Callout>
        )}

        {!isProposal && !refused && dropoff?.instructions && !done && (
          <Callout tone="warning" icon={MessageSquareText} title="Instructions de l'acheteur">
            {dropoff.instructions}
          </Callout>
        )}

        {!isProposal && !refused && (pickupContact || dropoffContact) && (
          <section className="space-y-3">
            <h2 className="section-title">{action ? 'Prochaine étape' : 'Contacts'}</h2>
            {toBuyer ? (
              <>
                <ContactCard role="Livraison · acheteur" contact={dropoffContact} highlight={Boolean(action)} />
                <ContactCard role="Retrait · vendeur" contact={pickupContact} />
              </>
            ) : (
              <>
                <ContactCard role="Retrait · vendeur" contact={pickupContact} highlight={Boolean(action)} />
                <ContactCard role="Livraison · acheteur" contact={dropoffContact} />
              </>
            )}
          </section>
        )}

        {!isProposal && !refused && (
          <section className="card p-4">
            <h2 className="mb-4 text-sm font-semibold text-surface-900">Progression</h2>
            <MissionStepper steps={MARKETPLACE_STEPS} current={marketplaceStepIndex(livraison)} />
          </section>
        )}

        {items.length > 0 && (
          <section className="card p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-surface-900">
              <Package size={16} className="text-surface-400" aria-hidden="true" /> Articles ({items.length})
            </h2>
            <ul className="divide-y divide-surface-100 text-sm">
              {items.map((it, i) => (
                <li key={it.id || i} className="flex justify-between gap-3 py-2">
                  <span className="truncate text-surface-700">{it.titre_snapshot || `Article ${i + 1}`}</span>
                  {it.prix_unitaire != null && <span className="shrink-0 font-medium text-surface-800">{formatPrice(it.prix_unitaire)}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="px-1 text-xs leading-relaxed text-surface-500">
          Aucun argent ne transite par TourShop pour la marketplace : le prix de la course et, le cas échéant, le paiement des articles se règlent directement avec le vendeur.
        </p>
      </div>

      {action && (
        <StickyActionBar hint={action.hint}>
          <button type="button" aria-busy={busy} className="btn-accent btn-lg w-full" onClick={() => { setActionError(null); setSheet(action.key); }} disabled={busy || bloque}>
            <ButtonLabel loading={busy} loadingLabel="Envoi…">{action.label}</ButtonLabel>
          </button>
        </StickyActionBar>
      )}

      <ProofCaptureModal
        open={sheet === 'start'}
        onClose={() => setSheet(null)}
        onSubmit={onStart}
        loading={busy}
        error={actionError}
        title="Article récupéré ?"
        description="Confirmez le retrait chez le vendeur. Ajoutez une preuve (recommandé) : elle sera visible par le vendeur."
        submitLabel="Article récupéré"
        photoLabel="Photo de l'article"
      />

      <ProofCaptureModal
        open={sheet === 'validate'}
        onClose={() => setSheet(null)}
        onSubmit={onValidate}
        loading={busy}
        error={actionError}
        requireCode
        codeLabel="Code de l'acheteur"
        title="Valider la livraison"
        description="Saisissez le code communiqué par l'acheteur."
        submitLabel="Valider la livraison"
        photoLabel="Photo de la remise"
      />

      {completed && (
        <MissionCompleteScreen
          title="Livraison terminée !"
          description="L'article est remis à l'acheteur. Le prix de la course se règle directement avec le vendeur."
          stats={[
            { label: 'Course', value: formatPrice(livraison.montant_final) },
            ...(completed.duree ? [{ label: 'Durée', value: completed.duree }] : []),
          ]}
          primary={{ label: "Retour à l'accueil", to: ROUTES.HOME }}
          secondary={{ label: 'Mes livraisons marketplace', to: `${ROUTES.MISSIONS}?onglet=marketplace` }}
          onClose={() => setCompleted(null)}
        />
      )}
    </div>
  );
}
