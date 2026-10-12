import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Zap, ShoppingBag, ArrowRight, Bell, Timer, Phone, Navigation, Power, Clock,
} from 'lucide-react';
import AvailabilitySwitch from '../../components/common/AvailabilitySwitch';
import useAvailability from '../../hooks/useAvailability';
import Callout from '../../components/common/Callout';
import AbonnementBanner from '../../components/common/AbonnementBanner';
import ReadinessCard from '../../components/common/ReadinessCard';
import RealtimeStatus from '../../components/common/RealtimeStatus';
import StepBar from '../../components/missions/StepBar';
import { expeditionRoute, expressRoute } from '../../components/missions/missionRoute';
import { ROUTES, missionDetailPath, marketplaceDetailPath } from '../../routes';
import {
  expeditionAction, expeditionPhase, expeditionStepIndex, marketplaceAction, marketplaceStepIndex,
  isActiveMarketplace, isMarketplaceProposal, isProposalExpired, marketplacePickup, marketplaceDropoff,
  placeLabel, addressLine, mapsLink, EXPEDITION_STEPS, MARKETPLACE_STEPS, MISSION_TYPE_LABEL,
} from '../../utils/missionFlow';
import { formatDistance } from '../../services/routingService';
import { formatPrice, initials } from '../../utils/format';
import { selectUnreadCount } from '../../store/slices/notificationsSlice';
import useCountdown, { formatCountdown } from '../../hooks/useCountdown';
import useTodayStats from '../../hooks/useTodayStats';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

// Montant sans devise (la devise est affichee en dessous).
const amount = (v) => formatPrice(v, '').trim();
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Mission en cours = element central de l'accueil (un livreur n'a jamais plus
// d'une mission d'expedition active, §3) : prochaine etape, progression et
// actions directes (appeler, itineraire) sans ouvrir le detail.
function ActiveMissionCard({
  to, kicker, title, detail, price, steps, current, phone, mapsUrl, actionLabel,
}) {
  return (
    <section className="card overflow-hidden shadow-raised" aria-labelledby="mission-en-cours">
      <div className="brand-gradient flex items-center justify-between gap-3 px-4 py-3 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
          <span className="status-dot animate-pulse-dot bg-accent-300" aria-hidden="true" /> Mission en cours
        </span>
        <span className="tabular text-lead font-bold">{formatPrice(price)}</span>
      </div>

      <div className="space-y-3.5 p-4">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-wide text-primary-700">{kicker}</p>
          <h2 id="mission-en-cours" className="mt-0.5 truncate text-lg font-semibold text-surface-900">{title || 'Voir la mission'}</h2>
          {detail && <p className="truncate text-sm text-surface-600">{detail}</p>}
        </div>

        <StepBar steps={steps} current={current} />

        <div className="flex gap-2.5">
          {phone && (
            <a href={`tel:${phone}`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-surface-200 text-primary-600 transition active:scale-95" aria-label="Appeler">
              <Phone size={20} aria-hidden="true" />
            </a>
          )}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-surface-200 text-primary-600 transition active:scale-95" aria-label="Ouvrir l'itinéraire">
              <Navigation size={20} aria-hidden="true" />
            </a>
          )}
          <Link to={to} className="btn-primary flex-1">
            {actionLabel} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ExpeditionHero({ mission }) {
  const route = expeditionRoute(mission);
  const phase = expeditionPhase(mission);
  const action = expeditionAction(mission);
  const isPickup = mission.type === 'enlevement';
  const steps = EXPEDITION_STEPS[mission.type] || EXPEDITION_STEPS.livraison;
  const current = expeditionStepIndex(mission);

  // Arret vers lequel le livreur se rend maintenant.
  const toAgency = isPickup && phase === 'deposit';
  const point = isPickup && !toAgency ? route.from : route.to;
  const stop = toAgency ? route.agence : route.contact;

  return (
    <ActiveMissionCard
      to={missionDetailPath(mission.id)}
      kicker={`${MISSION_TYPE_LABEL[mission.type] || 'Mission'} · Étape ${Math.min(current + 2, steps.length)} sur ${steps.length}`}
      title={point?.title}
      detail={point?.detail}
      price={mission.montant_final}
      steps={steps}
      current={current}
      phone={stop?.telephone}
      mapsUrl={mapsLink(stop)}
      actionLabel={action ? 'Continuer la mission' : 'Voir la mission'}
    />
  );
}

function MarketplaceHero({ livraison }) {
  const action = marketplaceAction(livraison);
  const current = marketplaceStepIndex(livraison);
  const stop = livraison.statut === 'en_cours' ? marketplaceDropoff(livraison) : marketplacePickup(livraison);

  return (
    <ActiveMissionCard
      to={marketplaceDetailPath(livraison.id)}
      kicker={`Marketplace · ${livraison.statut === 'en_cours' ? "En route vers l'acheteur" : 'À récupérer chez le vendeur'}`}
      title={stop?.nom || placeLabel(stop)}
      detail={addressLine(stop)}
      price={livraison.montant_final}
      steps={MARKETPLACE_STEPS}
      current={current}
      phone={stop?.telephone}
      mapsUrl={mapsLink(stop)}
      actionLabel={action ? 'Continuer la livraison' : 'Voir la livraison'}
    />
  );
}

// Hors ligne et sans mission : une seule decision, en grand.
function OfflineHero({ count }) {
  const { loading, toggle } = useAvailability();
  return (
    <section className="flex flex-col items-center gap-4 rounded-3xl bg-primary-950 px-5 py-6 text-center text-white" aria-labelledby="hors-ligne-titre">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-primary-100">
        <span className="status-dot bg-surface-400" aria-hidden="true" /> Hors ligne
      </span>
      <h2 id="hors-ligne-titre" className="text-xl font-semibold leading-snug">
        {count > 0 ? `${plural(count, 'mission')} ${count > 1 ? 'vous attendent' : 'vous attend'} dans votre zone` : 'Prêt pour une nouvelle tournée ?'}
      </h2>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-busy={loading}
        className="my-4 flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full bg-primary-600 shadow-brand ring-[12px] ring-primary-500/25 transition active:scale-95 disabled:opacity-60"
      >
        <Power size={36} strokeWidth={2.2} aria-hidden="true" />
        <span className="text-base font-bold">{loading ? 'Connexion…' : 'Passer en ligne'}</span>
      </button>
      <p className="text-sm leading-relaxed text-primary-200">Vous recevrez les missions express et les assignations du backoffice.</p>
    </section>
  );
}

function TodayStrip({ today, solde }) {
  const cell = 'flex min-w-0 flex-col items-center gap-0.5 px-1';
  const label = 'text-caption font-medium uppercase tracking-wide text-surface-500';
  return (
    <Link to={ROUTES.EARNINGS} className="card grid grid-cols-3 divide-x divide-surface-100 py-3.5 transition hover:shadow-raised active:scale-[0.99]" aria-label="Voir mes gains">
      <span className={cell}>
        <span className={label}>Aujourd'hui</span>
        <span className="tabular truncate text-title font-bold text-surface-900">{today ? amount(today.gains) : '—'}</span>
        <span className="text-caption text-surface-500">FCFA</span>
      </span>
      <span className={cell}>
        <span className={label}>Courses</span>
        <span className="tabular text-title font-bold text-surface-900">{today ? today.missions : '—'}</span>
        <span className="text-caption text-surface-500">{today?.missions > 1 ? 'terminées' : 'terminée'}</span>
      </span>
      <span className={cell}>
        <span className={label}>Solde</span>
        <span className="tabular truncate text-title font-bold text-success-700">{solde != null ? amount(solde) : '—'}</span>
        <span className="text-caption text-surface-500">FCFA</span>
      </span>
    </Link>
  );
}

function ProposalsCallout({ count, expireLe }) {
  const left = useCountdown(expireLe);
  return (
    <Callout to={`${ROUTES.MISSIONS}?onglet=encours`} tone="warning" icon={Timer} title={`${plural(count, 'proposition')} à accepter`}>
      {left != null ? (
        <>Expire dans <strong className="tabular">{formatCountdown(left)}</strong>, sinon {count > 1 ? 'elles seront réattribuées' : 'elle sera réattribuée'}.</>
      ) : (
        <>Répondez sous 15 minutes, sinon {count > 1 ? 'elles seront réattribuées' : 'elle sera réattribuée'}.</>
      )}
    </Callout>
  );
}

// Carte d'opportunite du carrousel "Autour de vous".
function OpportunityCard({ to, kind, distance, title, footer }) {
  const express = kind === 'express';
  return (
    <Link to={to} className="card flex w-56 shrink-0 snap-start flex-col gap-2.5 p-3.5 transition hover:shadow-raised active:scale-[0.98]">
      <span className="flex items-center justify-between gap-2">
        <span className={`badge px-2 py-0.5 text-caption ${express ? 'bg-accent-50 text-accent-700' : 'bg-success-50 text-success-700'}`}>
          {express ? <Zap size={12} aria-hidden="true" /> : <ShoppingBag size={12} aria-hidden="true" />}
          {express ? 'Express' : 'Marketplace'}
        </span>
        {distance && <span className="tabular text-xs text-surface-500">{distance}</span>}
      </span>
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-surface-900">{title}</span>
      <span className="mt-auto text-xs text-surface-500">{footer}</span>
    </Link>
  );
}

function Opportunities({ express, marketplace, offers, marketplaceOffers, offersCount }) {
  const total = express.length + marketplace.length;
  const cards = [
    ...express.slice(0, 4).map((m) => {
      const r = expressRoute(m);
      return (
        <OpportunityCard
          key={`e-${m.id}`}
          kind="express"
          to={`${ROUTES.MISSIONS}?onglet=disponibles&offre=${m.id}`}
          distance={m.distance_km != null ? formatDistance(Number(m.distance_km)) : null}
          title={`${r.from.title} → ${r.to.title}`}
          footer={offers[m.id] != null ? `Votre offre : ${formatPrice(offers[m.id])}` : `${MISSION_TYPE_LABEL[m.type] || 'Mission'} · proposez votre tarif`}
        />
      );
    }),
    ...marketplace.slice(0, 2).map((l) => (
      <OpportunityCard
        key={`m-${l.id}`}
        kind="marketplace"
        to={`${ROUTES.MISSIONS}?onglet=marketplace`}
        distance={l.distance_km != null ? formatDistance(Number(l.distance_km)) : null}
        title={`${placeLabel(marketplacePickup(l))} → ${placeLabel(marketplaceDropoff(l))}`}
        footer={marketplaceOffers[l.id] != null ? `Votre offre : ${formatPrice(marketplaceOffers[l.id])}` : 'Livraison d’une vente'}
      />
    )),
  ];

  return (
    <section aria-labelledby="autour-titre">
      <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
        <div>
          <h2 id="autour-titre" className="text-base font-semibold text-surface-900">Autour de vous</h2>
          {offersCount > 0 && <p className="text-xs text-surface-500">{plural(offersCount, 'offre')} en attente de réponse</p>}
        </div>
        <Link to={`${ROUTES.MISSIONS}?onglet=disponibles`} className="shrink-0 text-label font-semibold text-primary-700">
          Tout voir ({total})
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {cards}
      </div>
    </section>
  );
}

function WaitingCard() {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="icon-tile h-12 w-12 bg-primary-50 text-primary-600"><Clock size={22} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-surface-900">Aucune mission pour l'instant</p>
        <p className="text-sm text-surface-500">Vous serez alerté dès qu'une course arrive dans votre zone.</p>
      </div>
    </div>
  );
}

export default function HomeDashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const {
    proposals, active, available, offers,
  } = useSelector((state) => state.missions);
  const marketplace = useSelector((state) => state.marketplace);
  const balance = useSelector((state) => state.earnings.balance);
  const unread = useSelector(selectUnreadCount);

  const activeMission = active.items[0];
  const activeLivraison = useMemo(() => marketplace.mine.items.find(isActiveMarketplace), [marketplace.mine.items]);
  const offersCount = Object.keys(offers).length + Object.keys(marketplace.offers).length;

  const pending = useMemo(() => [
    ...proposals.items.filter((m) => !isProposalExpired(m)),
    ...marketplace.mine.items.filter(isMarketplaceProposal),
  ], [proposals.items, marketplace.mine.items]);
  // Echeance la plus proche, pour le compte a rebours.
  const nextExpiry = useMemo(() => {
    const times = pending.map((p) => Date.parse(p.expire_le ?? '')).filter(Number.isFinite);
    return times.length ? new Date(Math.min(...times)).toISOString() : null;
  }, [pending]);

  const solde = balance.value ?? (user?.solde_livreur != null ? Number(user.solde_livreur) : null);
  const today = useTodayStats(balance.value);
  const disponible = Boolean(user?.disponible);
  const hasActive = Boolean(activeMission || activeLivraison);
  const firstName = user?.prenoms?.split(' ')[0] || user?.nom || 'Livreur';
  const opportunityCount = available.items.length + marketplace.available.items.length;

  return (
    <div className="safe-top">
      {/* En-tete : identite, activite et etat de service */}
      <header className="border-b border-surface-200/70 bg-white">
        <div className="page-container space-y-4 pb-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <Link to={ROUTES.PROFILE} className="flex min-w-0 items-center gap-3">
              {user?.livreur?.photo_profil_url ? (
                <img src={user.livreur.photo_profil_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">{initials(user)}</span>
              )}
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs text-surface-500">{greeting()}, <RealtimeStatus /></p>
                <p className="truncate font-heading text-lg font-semibold text-surface-900">{firstName}</p>
              </div>
            </Link>
            <Link
              to={ROUTES.NOTIFICATIONS}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-100 text-surface-700"
              aria-label={unread ? `Activité, ${unread} non lue(s)` : 'Activité'}
            >
              <Bell size={20} aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-accent-700 px-1 text-micro font-bold leading-none text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          </div>

          {/* Hors ligne sans mission : le grand bouton du corps de page suffit. */}
          {(disponible || hasActive) && <AvailabilitySwitch variant="banner" />}
        </div>
      </header>

      <div className="page-container space-y-4 pb-6 pt-4">
        <AbonnementBanner />

        {pending.length > 0 && <ProposalsCallout count={pending.length} expireLe={nextExpiry} />}

        {!disponible && !hasActive && <OfflineHero count={available.items.length} />}

        <TodayStrip today={today} solde={solde} />

        {/* Mission en cours : l'action du moment passe avant tout le reste. */}
        {activeMission && <ExpeditionHero mission={activeMission} />}
        {!activeMission && activeLivraison && <MarketplaceHero livraison={activeLivraison} />}

        <ReadinessCard />

        {disponible && (opportunityCount > 0 ? (
          <Opportunities
            express={available.items}
            marketplace={marketplace.available.items}
            offers={offers}
            marketplaceOffers={marketplace.offers}
            offersCount={offersCount}
          />
        ) : !hasActive && <WaitingCard />)}
      </div>
    </div>
  );
}
