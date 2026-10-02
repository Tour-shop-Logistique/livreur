import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchX, CircleCheckBig, KeyRound, Lock, ShoppingBag, Banknote } from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StickyActionBar from '../../components/common/StickyActionBar';
import Callout from '../../components/common/Callout';
import { MarketplaceStatusBadge } from '../../components/missions/StatusBadge';
import MissionStepper from '../../components/missions/MissionStepper';
import ProofCaptureModal from '../../components/missions/ProofCaptureModal';
import ConfirmSheet from '../../components/missions/ConfirmSheet';
import MissionCompleteScreen from '../../components/missions/MissionCompleteScreen';
import {
  fetchMarketplaceMine, startMarketplaceDelivery, validateMarketplaceDelivery, selectMarketplaceById,
} from '../../store/slices/marketplaceSlice';
import { MARKETPLACE_STEPS, marketplaceStepIndex, marketplaceAction } from '../../utils/missionFlow';
import { formatPrice, formatDateTime, formatDuration } from '../../utils/format';
import { ROUTES } from '../../routes';
import ButtonLabel from '../../components/common/ButtonLabel';

// Livraison marketplace (MARKETPLACE_ET_ABONNEMENT_API.md §7) :
// assignee -> demarrer (en_cours) -> valider { code, preuve? } (terminee).
export default function MarketplaceDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const livraison = useSelector((state) => selectMarketplaceById(state, id));
  const { mine, pendingAction } = useSelector((state) => state.marketplace);
  const bloque = useSelector((state) => state.abonnement.bloque);
  const [sheet, setSheet] = useState(null); // 'start' | 'validate'
  const [actionError, setActionError] = useState(null);
  const [completed, setCompleted] = useState(null); // { duree } apres validation

  useEffect(() => {
    if (!livraison && !mine.loaded) dispatch(fetchMarketplaceMine());
  }, [dispatch, livraison, mine.loaded]);

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
              description={mine.blocked ? 'Régularisez votre abonnement pour accéder à vos livraisons marketplace.' : "Cette livraison n'existe plus ou ne vous est pas assignée."}
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
  const done = livraison.statut === 'terminee' || livraison.statut === 'livree';

  const onStart = async () => {
    setActionError(null);
    const result = await dispatch(startMarketplaceDelivery(livraison.id));
    if (startMarketplaceDelivery.fulfilled.match(result)) {
      toast.success('Course démarrée. Bonne route !');
      setSheet(null);
    } else {
      setActionError(result.payload);
    }
  };

  const onValidate = async ({ code, photo }) => {
    setActionError(null);
    const result = await dispatch(validateMarketplaceDelivery({ id: livraison.id, code, photo }));
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
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3">
            <MarketplaceStatusBadge statut={livraison.statut} />
            <p className="tabular text-xl font-bold text-surface-900">{formatPrice(livraison.montant_final)}</p>
          </div>
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

        {bloque && !done && (
          <Callout to={ROUTES.ABONNEMENT} tone="danger" icon={Lock} title="Abonnement marketplace en retard">
            Les actions sont bloquées jusqu'à régularisation. Touchez pour régulariser.
          </Callout>
        )}

        {done && <Callout tone="success" icon={CircleCheckBig} title="Livraison validée. Merci !" />}

        <section className="card p-4">
          <h2 className="mb-4 text-sm font-semibold text-surface-900">Progression</h2>
          <MissionStepper steps={MARKETPLACE_STEPS} current={marketplaceStepIndex(livraison)} />
        </section>

        {livraison.statut === 'en_cours' && (
          <Callout tone="emphasis" icon={KeyRound}>
            À la remise, l'acheteur vous communique un <strong className="text-white">code à 4 chiffres</strong>. Il est indispensable pour valider la livraison.
          </Callout>
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

      {sheet === 'start' && (
        <ConfirmSheet
          open
          onClose={() => setSheet(null)}
          onConfirm={onStart}
          loading={busy}
          error={actionError}
          title="Démarrer la course ?"
          description="Confirmez que vous avez récupéré l'article chez le vendeur."
          confirmLabel="Article récupéré"
        />
      )}

      <ProofCaptureModal
        open={sheet === 'validate'}
        onClose={() => setSheet(null)}
        onSubmit={onValidate}
        loading={busy}
        error={actionError}
        requireCode
        withSignature={false}
        withGeo={false}
        codeLabel="Code de l'acheteur"
        title="Valider la livraison"
        description="Saisissez le code communiqué par l'acheteur."
        submitLabel="Valider la livraison"
        photoLabel="Photo de preuve"
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
