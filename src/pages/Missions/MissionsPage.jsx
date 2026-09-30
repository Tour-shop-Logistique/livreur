import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  RefreshCw, Route, Zap, ShoppingBag, History, WifiOff, Lock, ChevronRight,
} from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import FilterChips from '../../components/common/FilterChips';
import SkeletonCard from '../../components/common/SkeletonCard';
import RealtimeStatus from '../../components/common/RealtimeStatus';
import EmptyState from '../../components/common/EmptyState';
import MissionCard from '../../components/missions/MissionCard';
import MarketplaceCard from '../../components/missions/MarketplaceCard';
import OfferCard from '../../components/missions/OfferCard';
import OfferSheet from '../../components/missions/OfferSheet';
import {
  fetchMissionHistory, proposeOffer, withdrawOffer,
} from '../../store/slices/missionsSlice';
import { proposeMarketplaceOffer, withdrawMarketplaceOffer } from '../../store/slices/marketplaceSlice';
import { refreshMissions } from '../../hooks/useRealtime';
import { contactOf, MISSION_TYPE_LABEL } from '../../utils/missionFlow';
import { formatPrice } from '../../utils/format';
import { ROUTES } from '../../routes';

const HISTORY_FILTERS = [
  { key: '', label: 'Toutes' },
  { key: 'assignee', label: 'En cours' },
  { key: 'terminee', label: 'Terminées' },
  { key: 'annulee', label: 'Annulées' },
];

function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon={WifiOff}
      tone="error"
      title="Chargement impossible"
      description={message}
      action={<button type="button" className="btn-secondary btn-sm" onClick={onRetry}><RefreshCw size={14} /> Réessayer</button>}
    />
  );
}

function BlockedState() {
  return (
    <EmptyState
      icon={Lock}
      tone="error"
      title="Marketplace suspendue"
      description="Votre abonnement marketplace est en retard. Régularisez-le pour accéder de nouveau aux livraisons marketplace. Vos missions d'expédition ne sont pas concernées."
      action={<Link to={ROUTES.ABONNEMENT} className="btn-primary btn-sm">Régulariser</Link>}
    />
  );
}

export default function MissionsPage() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') || 'encours';
  const setTab = (key) => setParams({ onglet: key }, { replace: true });

  const user = useSelector((state) => state.auth.user);
  const disponible = Boolean(user?.disponible);
  const { active, available, history, offers } = useSelector((state) => state.missions);
  const marketplace = useSelector((state) => state.marketplace);
  const abonnementBloque = useSelector((state) => state.abonnement.bloque);

  const [offerTarget, setOfferTarget] = useState(null); // { kind, id, title }
  const [offerLoading, setOfferLoading] = useState(false);

  useEffect(() => {
    if (tab === 'historique' && !history.loaded) dispatch(fetchMissionHistory({ statut: '', page: 1 }));
  }, [dispatch, tab, history.loaded]);

  const activeMarketplace = useMemo(
    () => marketplace.mine.items.filter((l) => l.statut === 'assignee' || l.statut === 'en_cours'),
    [marketplace.mine.items]
  );
  const pastMarketplace = useMemo(
    () => marketplace.mine.items.filter((l) => l.statut !== 'assignee' && l.statut !== 'en_cours'),
    [marketplace.mine.items]
  );

  const activeCount = active.items.length + activeMarketplace.length;
  const tabs = [
    { key: 'encours', label: 'En cours', count: activeCount },
    { key: 'disponibles', label: 'Express', count: available.items.length },
    { key: 'marketplace', label: 'Marketplace', count: marketplace.available.items.length },
    { key: 'historique', label: 'Historique' },
  ];

  const refreshing = active.status === 'loading' || available.status === 'loading'
    || marketplace.available.status === 'loading' || history.status === 'loading';

  const refresh = () => refreshMissions(dispatch, history.statut);

  const currentOffer = offerTarget
    ? (offerTarget.kind === 'express' ? offers[offerTarget.id] : marketplace.offers[offerTarget.id])
    : undefined;

  const submitOffer = async (montant) => {
    setOfferLoading(true);
    const action = offerTarget.kind === 'express'
      ? proposeOffer({ missionId: offerTarget.id, montant })
      : proposeMarketplaceOffer({ id: offerTarget.id, montant });
    const result = await dispatch(action);
    setOfferLoading(false);
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(currentOffer != null ? 'Offre mise à jour.' : 'Offre envoyée.', { description: 'Vous serez notifié si elle est retenue.' });
      setOfferTarget(null);
    } else {
      toast.error(result.payload);
    }
  };

  const removeOffer = async () => {
    setOfferLoading(true);
    const action = offerTarget.kind === 'express' ? withdrawOffer(offerTarget.id) : withdrawMarketplaceOffer(offerTarget.id);
    const result = await dispatch(action);
    setOfferLoading(false);
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Offre retirée.');
      setOfferTarget(null);
    } else {
      toast.error(result.payload);
    }
  };

  return (
    <div>
      <TopBar
        title="Missions"
        right={(
          <button
            type="button"
            onClick={refresh}
            className="flex h-11 w-11 items-center justify-center rounded-full text-surface-600 hover:bg-surface-100"
            aria-label="Actualiser"
          >
            <RefreshCw size={19} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}
      />

      <div className="page-container space-y-4 pt-4">
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
        {(tab === 'disponibles' || tab === 'marketplace') && <RealtimeStatus variant="banner" />}

        {/* EN COURS */}
        {tab === 'encours' && (
          <div className="space-y-3">
            {!active.loaded && active.status === 'loading' && <SkeletonCard count={2} />}
            {active.status === 'error' && active.items.length === 0 && <ErrorState message={active.error} onRetry={refresh} />}
            {active.items.map((m) => <MissionCard key={m.id} mission={m} />)}
            {activeMarketplace.map((l) => <MarketplaceCard key={l.id} livraison={l} />)}
            {active.loaded && active.status !== 'error' && activeCount === 0 && (
              <EmptyState
                icon={Route}
                title="Aucune mission en cours"
                description={disponible
                  ? "Les missions assignées par le backoffice et vos offres acceptées apparaîtront ici."
                  : 'Vous êtes hors ligne. Passez disponible depuis l\'accueil pour recevoir des missions.'}
                action={disponible && available.items.length > 0 && (
                  <button type="button" className="btn-accent btn-sm" onClick={() => setTab('disponibles')}>
                    Voir {available.items.length} mission{available.items.length > 1 ? 's' : ''} express
                  </button>
                )}
              />
            )}
          </div>
        )}

        {/* EXPRESS */}
        {tab === 'disponibles' && (
          <div className="space-y-3">
            <p className="px-1 text-xs leading-relaxed text-surface-500">
              Missions sans livreur rattaché, ouvertes au réseau. Proposez votre prix : le client compare les offres et choisit.
            </p>
            {!disponible && (
              <div className="flex items-start gap-2.5 rounded-xl border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">
                <WifiOff size={16} className="mt-px shrink-0" aria-hidden="true" />
                Vous êtes hors ligne : passez disponible pour pouvoir proposer une offre.
              </div>
            )}
            {!available.loaded && available.status === 'loading' && <SkeletonCard />}
            {available.status === 'error' && available.items.length === 0 && <ErrorState message={available.error} onRetry={refresh} />}
            {available.loaded && available.status !== 'error' && available.items.length === 0 && (
              <EmptyState icon={Zap} title="Aucune mission express" description="Les nouvelles missions vous seront signalées en temps réel." />
            )}
            {available.items.map((m) => {
              const exp = m.expedition || {};
              const expediteur = contactOf(exp, 'expediteur');
              const destinataire = contactOf(exp, 'destinataire');
              return (
                <OfferCard
                  key={m.id}
                  kind="express"
                  title={`${MISSION_TYPE_LABEL[m.type] || 'Mission'} express`}
                  subtitle={exp.reference}
                  route={{
                    from: { label: 'Départ', title: expediteur.ville || exp.pays_depart || '—' },
                    to: { label: 'Arrivée', title: destinataire.ville || exp.pays_destination || '—' },
                  }}
                  myOffer={offers[m.id]}
                  disabled={!disponible}
                  disabledReason="Passez disponible pour proposer une offre."
                  onOffer={() => setOfferTarget({ kind: 'express', id: m.id, title: `${MISSION_TYPE_LABEL[m.type] || 'Mission'} ${exp.reference || ''}`.trim() })}
                />
              );
            })}
          </div>
        )}

        {/* MARKETPLACE */}
        {tab === 'marketplace' && (
          <div className="space-y-5">
            {abonnementBloque || marketplace.available.blocked ? (
              <BlockedState />
            ) : (
              <section className="space-y-3">
                <h2 className="section-title">Ouvertes aux offres</h2>
                {!marketplace.available.loaded && marketplace.available.status === 'loading' && <SkeletonCard count={2} />}
                {marketplace.available.status === 'error' && marketplace.available.items.length === 0 && (
                  <ErrorState message={marketplace.available.error} onRetry={refresh} />
                )}
                {marketplace.available.loaded && marketplace.available.status !== 'error' && marketplace.available.items.length === 0 && (
                  <EmptyState compact icon={ShoppingBag} title="Aucune livraison marketplace" description="Les ventes à livrer dans votre pays apparaîtront ici." />
                )}
                {marketplace.available.items.map((l) => (
                  <OfferCard
                    key={l.id}
                    kind="marketplace"
                    title="Livraison d'une vente"
                    subtitle={`Cde #${String(l.commande?.id || '').slice(0, 8)}`}
                    meta={l.commande?.montant_articles != null && <span>Valeur des articles : <strong className="text-surface-700">{formatPrice(l.commande.montant_articles)}</strong></span>}
                    myOffer={marketplace.offers[l.id]}
                    onOffer={() => setOfferTarget({ kind: 'marketplace', id: l.id, title: 'Livraison marketplace' })}
                  />
                ))}
              </section>
            )}

            {pastMarketplace.length > 0 && (
              <section className="space-y-3">
                <h2 className="section-title">Mes livraisons marketplace</h2>
                {pastMarketplace.map((l) => <MarketplaceCard key={l.id} livraison={l} />)}
              </section>
            )}

            <Link to={ROUTES.ABONNEMENT} className="card flex items-center justify-between p-4 text-sm">
              <span className="font-medium text-surface-700">Mon abonnement marketplace</span>
              <ChevronRight size={18} className="text-surface-400" aria-hidden="true" />
            </Link>
          </div>
        )}

        {/* HISTORIQUE */}
        {tab === 'historique' && (
          <div className="space-y-3">
            <FilterChips
              options={HISTORY_FILTERS}
              value={history.statut}
              onChange={(statut) => dispatch(fetchMissionHistory({ statut, page: 1 }))}
            />
            {history.status === 'loading' && history.items.length === 0 && <SkeletonCard />}
            {history.status === 'error' && history.items.length === 0 && (
              <ErrorState message={history.error} onRetry={() => dispatch(fetchMissionHistory({ statut: history.statut, page: 1 }))} />
            )}
            {history.loaded && history.status !== 'error' && history.items.length === 0 && (
              <EmptyState icon={History} title="Aucune mission" description="Votre historique de missions d'expédition apparaîtra ici." />
            )}
            {history.items.map((m) => <MissionCard key={m.id} mission={m} />)}
            {history.page < history.lastPage && (
              <button
                type="button"
                className="btn-secondary w-full"
                disabled={history.status === 'loading'}
                onClick={() => dispatch(fetchMissionHistory({ statut: history.statut, page: history.page + 1 }))}
              >
                {history.status === 'loading' ? 'Chargement…' : 'Charger plus'}
              </button>
            )}
          </div>
        )}
      </div>

      <OfferSheet
        open={Boolean(offerTarget)}
        onClose={() => setOfferTarget(null)}
        title={currentOffer != null ? 'Modifier mon offre' : 'Proposer un tarif'}
        description={offerTarget?.title}
        currentOffer={currentOffer}
        loading={offerLoading}
        onSubmit={submitOffer}
        onWithdraw={removeOffer}
        note={offerTarget?.kind === 'marketplace'
          ? "Le paiement de la course se fait hors application. Une première offre acceptée démarre votre abonnement marketplace."
          : 'Paiement en espèces à la clôture de la mission. Vous ne pouvez avoir qu\'une mission active à la fois.'}
      />
    </div>
  );
}
