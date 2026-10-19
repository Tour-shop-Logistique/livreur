import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RefreshCw, Route, Zap, ShoppingBag, History, WifiOff, Lock, ChevronRight, PackageOpen, PackageCheck,
} from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import IconButton from '../../components/common/IconButton';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import FilterChips from '../../components/common/FilterChips';
import SkeletonCard from '../../components/common/SkeletonCard';
import RealtimeStatus from '../../components/common/RealtimeStatus';
import EmptyState from '../../components/common/EmptyState';
import Callout from '../../components/common/Callout';
import MissionCard from '../../components/missions/MissionCard';
import MarketplaceCard from '../../components/missions/MarketplaceCard';
import ExpressCard from '../../components/missions/ExpressCard';
import useAcceptExpress from '../../hooks/useAcceptExpress';
import ProposalCard from '../../components/missions/ProposalCard';
import RouteLine from '../../components/missions/RouteLine';
import GeoFilterBar from '../../components/missions/GeoFilterBar';
import CoursesMap from '../../components/missions/CoursesMap';
import { expressRoute, expeditionRoute } from '../../components/missions/missionRoute';
import { fetchMissionHistory } from '../../store/slices/missionsSlice';
import { refreshMissions } from '../../hooks/useRealtime';
import {
  MISSION_TYPE_LABEL, isMarketplaceProposal, isProposalExpired, marketplacePickup, marketplaceDropoff, placeLabel,
  missionPrice,
} from '../../utils/missionFlow';
import { ROUTES, missionDetailPath, marketplaceDetailPath } from '../../routes';
import { formatPrice, formatDistance } from '../../utils/format';
import ButtonLabel from '../../components/common/ButtonLabel';

const HISTORY_FILTERS = [
  { key: '', label: 'Toutes' },
  { key: 'assignee', label: 'En cours' },
  { key: 'terminee', label: 'Terminées' },
  { key: 'refusee', label: 'Refusées' },
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
  const {
    proposals, active, available, history,
  } = useSelector((state) => state.missions);
  const marketplace = useSelector((state) => state.marketplace);
  const abonnementBloque = useSelector((state) => state.abonnement.bloque);
  const { accept: acceptExpress, isAccepting, busy: accepting } = useAcceptExpress();

  useEffect(() => {
    if (tab === 'historique' && !history.loaded) dispatch(fetchMissionHistory({ statut: '', page: 1 }));
  }, [dispatch, tab, history.loaded]);

  // Ancien lien profond `?offre=` (modele par offres) : on le nettoie.
  useEffect(() => {
    if (params.get('offre')) setParams({ onglet: 'disponibles' }, { replace: true });
  }, [params, setParams]);

  const activeMarketplace = useMemo(
    () => marketplace.mine.items.filter((l) => l.statut === 'assignee' || l.statut === 'en_cours'),
    [marketplace.mine.items]
  );
  const pastMarketplace = useMemo(
    () => marketplace.mine.items.filter((l) => !['assignee', 'en_cours', 'proposee'].includes(l.statut)),
    [marketplace.mine.items]
  );
  // Propositions en attente de ma reponse (groupage + marketplace direct, 15 min).
  const missionProposals = useMemo(() => proposals.items.filter((m) => !isProposalExpired(m)), [proposals.items]);
  const marketplaceProposals = useMemo(() => marketplace.mine.items.filter(isMarketplaceProposal), [marketplace.mine.items]);
  const proposalCount = missionProposals.length + marketplaceProposals.length;

  // Filtrage geographique fait par l'API (ville du profil, autre ville ou position).
  const expressList = available.items;

  const activeCount = active.items.length + activeMarketplace.length + proposalCount;
  const tabs = [
    { key: 'encours', label: 'En cours', count: activeCount },
    { key: 'disponibles', label: 'Express', count: available.items.length },
    { key: 'marketplace', label: 'Marketplace', count: marketplace.available.items.filter((l) => l.mode !== 'standard').length },
    { key: 'historique', label: 'Historique' },
  ];

  const refreshing = active.status === 'loading' || available.status === 'loading'
    || marketplace.available.status === 'loading' || history.status === 'loading';

  const refresh = () => refreshMissions(dispatch, history.statut);

  // Livraisons marketplace disponibles : express (a accepter, prix fixe) et
  // standard (attribuees par l'agence, visibles pour information).
  const marketplaceExpress = marketplace.available.items.filter((l) => l.mode !== 'standard');
  const marketplaceStandard = marketplace.available.items.filter((l) => l.mode === 'standard');
  const marketplaceRoute = (l) => (l.retrait || l.livraison) && {
    from: { label: 'Retrait', title: placeLabel(marketplacePickup(l)) },
    to: { label: 'Livraison', title: placeLabel(marketplaceDropoff(l)) },
  };
  const marketplaceMeta = (l) => (
    <>
      {l.commande?.montant_articles != null && <span>Articles : <strong className="text-navy-950">{formatPrice(l.commande.montant_articles)}</strong></span>}
      {l.commande?.nombre_articles != null && <span>{l.commande.nombre_articles} article{l.commande.nombre_articles > 1 ? 's' : ''}</span>}
      {l.distance_km != null && <span>{formatDistance(l.distance_km)}</span>}
    </>
  );

  return (
    <div>
      <TopBar
        title="Missions"
        right={<IconButton icon={RefreshCw} size={19} label="Actualiser" onClick={refresh} spinning={refreshing} />}
      />

      <div className="page-container space-y-4 pt-4">
        <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />
        {(tab === 'disponibles' || tab === 'marketplace') && <RealtimeStatus variant="banner" />}

        {/* EN COURS */}
        {tab === 'encours' && (
          <div className="space-y-3">
            {!active.loaded && active.status === 'loading' && <SkeletonCard count={2} />}
            {active.status === 'error' && active.items.length === 0 && <ErrorState message={active.error} onRetry={refresh} />}
            {proposalCount > 0 && (
              <section className="space-y-3">
                <h2 className="section-title">À accepter ({proposalCount})</h2>
                {missionProposals.map((m) => (
                  <ProposalCard
                    key={m.id}
                    to={missionDetailPath(m.id)}
                    icon={m.type === 'enlevement' ? PackageOpen : PackageCheck}
                    title={`${MISSION_TYPE_LABEL[m.type] || 'Mission'} · groupage`}
                    subtitle={m.expedition?.reference}
                    montant={missionPrice(m)}
                    expireLe={m.expire_le}
                    route={expeditionRoute(m)}
                  />
                ))}
                {marketplaceProposals.map((l) => (
                  <ProposalCard
                    key={l.id}
                    to={marketplaceDetailPath(l.id)}
                    icon={ShoppingBag}
                    title="Livraison marketplace · direct"
                    subtitle={`Cde #${String(l.commande?.id || l.commande_marketplace_id || '').slice(0, 8)}`}
                    montant={l.montant_final ?? l.montant_propose_vendeur}
                    expireLe={l.expire_le}
                    route={(l.retrait || l.livraison) && {
                      from: { label: 'Retrait', title: placeLabel(marketplacePickup(l)) },
                      to: { label: 'Livraison', title: placeLabel(marketplaceDropoff(l)) },
                    }}
                  />
                ))}
              </section>
            )}
            <CoursesMap missions={active.items} livraisons={activeMarketplace} />
            {active.items.map((m) => <MissionCard key={m.id} mission={m} />)}
            {activeMarketplace.map((l) => <MarketplaceCard key={l.id} livraison={l} />)}
            {active.loaded && active.status !== 'error' && activeCount === 0 && (
              <EmptyState
                icon={Route}
                title="Aucune mission en cours"
                description={disponible
                  ? 'Les missions assignées par le backoffice et les courses express que vous acceptez apparaîtront ici.'
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
            <p className="flex items-start gap-2 px-1 text-[0.8125rem] leading-relaxed text-surface-500">
              <Zap size={16} className="mt-0.5 shrink-0 fill-accent-400 text-accent-600" aria-hidden="true" />
              Prix fixe, crédité sur votre solde. Le premier livreur qui accepte remporte la course.
            </p>
            {!disponible && (
              <Callout tone="warning" size="sm" icon={WifiOff}>
                Vous êtes hors ligne : passez disponible pour pouvoir accepter une course.
              </Callout>
            )}
            {disponible && active.items.length > 0 && (
              <Callout tone="neutral" size="sm" icon={Route}>
                Vous avez déjà une mission en cours : terminez-la avant d'accepter une nouvelle course.
              </Callout>
            )}
            {!available.loaded && available.status === 'loading' && <SkeletonCard />}
            {available.status === 'error' && available.items.length === 0 && <ErrorState message={available.error} onRetry={refresh} />}
            <GeoFilterBar />
            {available.loaded && available.status !== 'error' && available.items.length === 0 && (
              <EmptyState icon={Zap} title="Aucune mission express" description="Aucune mission dans cette zone pour l'instant. Les nouvelles vous seront signalées en temps réel." />
            )}
            {expressList.map((m) => (
              <ExpressCard
                key={m.id}
                to={missionDetailPath(m.id)}
                title={`${MISSION_TYPE_LABEL[m.type] || 'Mission'} · Express`}
                subtitle={m.expedition?.reference}
                route={expressRoute(m)}
                price={missionPrice(m)}
                meta={m.distance_km != null && <span>{formatDistance(m.distance_km)}</span>}
                loading={isAccepting(m.id)}
                disabled={!disponible || active.items.length > 0 || (accepting && !isAccepting(m.id))}
                disabledReason={!disponible ? 'Passez disponible pour accepter.' : active.items.length > 0 ? 'Mission en cours.' : null}
                onAccept={() => acceptExpress(m)}
              />
            ))}
          </div>
        )}

        {/* MARKETPLACE */}
        {tab === 'marketplace' && (
          <div className="space-y-5">
            {abonnementBloque || marketplace.available.blocked ? (
              <BlockedState />
            ) : (
              <section className="space-y-3">
                <h2 className="section-title">Livraisons de ventes</h2>
                <p className="flex items-start gap-2 px-1 text-[0.8125rem] leading-relaxed text-surface-500">
                  <Zap size={16} className="mt-0.5 shrink-0 fill-accent-400 text-accent-600" aria-hidden="true" />
                  Prix fixe en express : le premier livreur qui accepte récupère l’article chez le vendeur.
                </p>
                <GeoFilterBar />
                {!marketplace.available.loaded && marketplace.available.status === 'loading' && <SkeletonCard count={2} />}
                {marketplace.available.status === 'error' && marketplace.available.items.length === 0 && (
                  <ErrorState message={marketplace.available.error} onRetry={refresh} />
                )}
                {marketplace.available.loaded && marketplace.available.status !== 'error' && marketplace.available.items.length === 0 && (
                  <EmptyState compact icon={ShoppingBag} title="Aucune livraison marketplace" description="Les ventes à livrer dans cette zone apparaîtront ici." />
                )}
                {marketplaceExpress.map((l) => (
                  <ExpressCard
                    key={l.id}
                    title="Vente · Express"
                    subtitle={`Cde #${String(l.commande?.id || l.commande_marketplace_id || '').slice(0, 8)}`}
                    route={marketplaceRoute(l)}
                    price={l.montant_final}
                    meta={marketplaceMeta(l)}
                    loading={isAccepting(l.id)}
                    disabled={!disponible || (accepting && !isAccepting(l.id))}
                    disabledReason={!disponible ? 'Passez disponible pour accepter.' : null}
                    onAccept={() => acceptExpress(l, { kind: 'marketplace' })}
                  />
                ))}
                {marketplaceStandard.length > 0 && (
                  <>
                    <h3 className="px-1 pt-2 text-xs font-bold uppercase tracking-[0.06em] text-surface-500">Standard · attribuées par l’agence</h3>
                    {marketplaceStandard.map((l) => (
                      <article key={l.id} className="card p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="badge bg-primary-50 text-primary-700">Vente · Standard</span>
                          {l.montant_final != null && <span className="tabular font-heading font-bold text-navy-950">{formatPrice(l.montant_final)}</span>}
                        </div>
                        {marketplaceRoute(l) && <div className="mt-3"><RouteLine {...marketplaceRoute(l)} compact /></div>}
                        <p className="mt-3 text-xs text-surface-500">L’agence attribue cette livraison : elle vous sera proposée si vous êtes choisi.</p>
                      </article>
                    ))}
                  </>
                )}
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
                aria-busy={history.status === 'loading'}
                className="btn-secondary w-full"
                disabled={history.status === 'loading'}
                onClick={() => dispatch(fetchMissionHistory({ statut: history.statut, page: history.page + 1 }))}
              >
                <ButtonLabel loading={history.status === 'loading'} loadingLabel="Chargement…">Charger plus</ButtonLabel>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
