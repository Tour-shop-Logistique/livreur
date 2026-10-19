import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Zap, ShoppingBag, ArrowRight, Bell, Timer, Phone, Navigation, Power, Clock,
} from 'lucide-react';
import AvailabilitySwitch from '../../components/common/AvailabilitySwitch';
import useAvailability from '../../hooks/useAvailability';
import useAcceptExpress from '../../hooks/useAcceptExpress';
import Callout from '../../components/common/Callout';
import AbonnementBanner from '../../components/common/AbonnementBanner';
import ReadinessCard from '../../components/common/ReadinessCard';
import RealtimeStatus from '../../components/common/RealtimeStatus';
import ButtonLabel from '../../components/common/ButtonLabel';
import StepBar from '../../components/missions/StepBar';
import { expeditionRoute, expressRoute } from '../../components/missions/missionRoute';
import { ROUTES, missionDetailPath, marketplaceDetailPath } from '../../routes';
import {
  expeditionAction, expeditionPhase, expeditionStepIndex, marketplaceAction, marketplaceStepIndex,
  isActiveMarketplace, isMarketplaceProposal, isProposalExpired, marketplacePickup, marketplaceDropoff,
  placeLabel, addressLine, mapsLink, EXPEDITION_STEPS, MARKETPLACE_STEPS, MISSION_TYPE_LABEL, MISSION_MODE_LABEL,
  missionPrice,
} from '../../utils/missionFlow';
import { formatDistance } from '../../services/routingService';
import { formatPrice, currencyLabel, fullName } from '../../utils/format';
import { selectUnreadCount } from '../../store/slices/notificationsSlice';
import useCountdown, { formatCountdown } from '../../hooks/useCountdown';
import useTodayStats from '../../hooks/useTodayStats';
import logoMark from '../../assets/logo_mark.png';

// Accueil du design "Plume" : en-tete navy (identite, service, chiffres du
// jour) signe par la bande aux 4 couleurs du logo, puis la mission en cours et
// les courses autour de soi.

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

// Montant sans devise (la devise est affichee en dessous).
const amount = (v) => formatPrice(v, '').trim();
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Prix en grand, devise en petit.
function Price({ value, className = 'text-lead', currencyClass = 'text-xs' }) {
  return (
    <span className={`tabular font-heading font-bold text-navy-950 ${className}`}>
      {amount(value)} <span className={`font-sans font-semibold text-surface-500 ${currencyClass}`}>{currencyLabel()}</span>
    </span>
  );
}

// Mission en cours = element central de l'accueil (un livreur n'a jamais plus
// d'une mission d'expedition active, §3) : prochaine etape, progression et
// actions directes (appeler, itineraire) sans ouvrir le detail.
function ActiveMissionCard({
  to, status, kicker, title, detail, price, steps, current, phone, mapsUrl, actionLabel,
}) {
  return (
    <section className="card-raised overflow-hidden" aria-labelledby="mission-en-cours">
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5">
        <span className="badge bg-teal-50 text-teal-700">
          <span className="status-dot animate-pulse-dot bg-teal-500" aria-hidden="true" /> {status}
        </span>
        {price != null && <Price value={price} className="text-lg" />}
      </div>

      <div className="space-y-1 px-4 pt-3">
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-primary-600">{kicker}</p>
        <h2 id="mission-en-cours" className="truncate text-lg font-bold text-navy-950">{title || 'Voir la mission'}</h2>
        {detail && <p className="truncate text-sm text-surface-500">{detail}</p>}
      </div>

      <div className="px-4 pt-3.5">
        <StepBar steps={steps} current={current} />
      </div>

      <div className="flex gap-2.5 p-4">
        {phone && (
          <a href={`tel:${phone}`} className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition active:scale-95" aria-label="Appeler">
            <Phone size={20} aria-hidden="true" />
          </a>
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition active:scale-95" aria-label="Ouvrir l'itinéraire">
            <Navigation size={20} aria-hidden="true" />
          </a>
        )}
        <Link to={to} className="btn-primary flex-1">
          {actionLabel} <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </Link>
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
      status={`Étape ${Math.min(current + 2, steps.length)} sur ${steps.length}`}
      kicker={`${MISSION_TYPE_LABEL[mission.type] || 'Mission'} · ${MISSION_MODE_LABEL[mission.mode] || mission.mode || ''}`}
      title={point?.title}
      detail={point?.detail}
      price={missionPrice(mission)}
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
      status={livraison.statut === 'en_cours' ? "En route vers l'acheteur" : 'À récupérer'}
      kicker="Marketplace"
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
    <section className="flex flex-col items-center gap-3 rounded-3xl bg-navy-900 px-5 py-7 text-center text-white" aria-labelledby="hors-ligne-titre">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-navy-100">
        <span className="status-dot bg-navy-300" aria-hidden="true" /> Hors ligne
      </span>
      <h2 id="hors-ligne-titre" className="text-xl font-bold leading-snug">
        {count > 0 ? `${plural(count, 'course')} ${count > 1 ? 'vous attendent' : 'vous attend'} dans votre zone` : 'Prêt pour une nouvelle tournée ?'}
      </h2>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-busy={loading}
        className="my-4 flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full bg-accent-400 text-accent-900 shadow-lime ring-[12px] ring-accent-400/20 transition active:scale-95 disabled:opacity-60"
      >
        <Power size={36} strokeWidth={2.4} aria-hidden="true" />
        <span className="text-base font-extrabold">{loading ? 'Connexion…' : 'Passer en ligne'}</span>
      </button>
      <p className="text-sm leading-relaxed text-navy-200">Vous recevrez les courses express et les assignations de l'agence.</p>
    </section>
  );
}

// Chiffres du jour, poses sur l'en-tete navy.
function TodayStrip({ today, solde }) {
  const cell = 'flex min-w-0 flex-col gap-0.5';
  const label = 'text-caption font-semibold uppercase tracking-[0.06em] text-navy-300';
  return (
    <Link to={ROUTES.EARNINGS} className="grid grid-cols-3 gap-3 rounded-2xl transition active:opacity-80" aria-label="Voir mes gains">
      <span className={cell}>
        <span className={label}>Gagné aujourd'hui</span>
        <span className="tabular truncate font-heading text-[1.3rem] font-bold leading-tight">{today ? amount(today.gains) : '—'}</span>
        <span className="text-xs text-navy-200">{currencyLabel()}</span>
      </span>
      <span className={`${cell} border-l border-white/10 pl-3`}>
        <span className={label}>Courses</span>
        <span className="tabular font-heading text-[1.3rem] font-bold leading-tight">{today ? today.missions : '—'}</span>
        <span className="text-xs text-navy-200">{today?.missions > 1 ? 'terminées' : 'terminée'}</span>
      </span>
      <span className={`${cell} border-l border-white/10 pl-3`}>
        <span className={label}>Solde</span>
        <span className="tabular truncate font-heading text-[1.3rem] font-bold leading-tight text-accent-300">{solde != null ? amount(solde) : '—'}</span>
        <span className="text-xs text-navy-200">{currencyLabel()}</span>
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

// Course express du carrousel "Autour de vous" : prix fixe + Accepter.
function ExpressOpportunity({ mission, accept, accepting, disabled }) {
  const r = expressRoute(mission);
  return (
    <article className="card flex w-[13.5rem] shrink-0 snap-start flex-col gap-2.5 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="badge bg-accent-50 px-2 py-0.5 text-caption text-accent-700">
          <Zap size={12} fill="currentColor" aria-hidden="true" /> Express
        </span>
        {mission.distance_km != null && <span className="tabular text-xs text-surface-500">{formatDistance(Number(mission.distance_km))}</span>}
      </div>
      <Link to={missionDetailPath(mission.id)} className="line-clamp-2 text-sm font-semibold leading-snug text-navy-950">
        {r.from.title} → {r.to.title}
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2">
        <Price value={missionPrice(mission)} className="text-base" currencyClass="text-[0.6875rem]" />
        <button
          type="button"
          className="btn-accent btn-sm shadow-none"
          onClick={() => accept(mission)}
          disabled={disabled || accepting}
          aria-busy={accepting}
        >
          <ButtonLabel loading={accepting} loadingLabel="…">Accepter</ButtonLabel>
        </button>
      </div>
    </article>
  );
}

// Livraison marketplace express : prix fixe + Accepter (premier arrive).
function MarketplaceOpportunity({ livraison, accept, accepting, disabled }) {
  return (
    <article className="card flex w-[13.5rem] shrink-0 snap-start flex-col gap-2.5 p-3.5">
      <span className="flex items-center justify-between gap-2">
        <span className="badge bg-teal-50 px-2 py-0.5 text-caption text-teal-700">
          <ShoppingBag size={12} aria-hidden="true" /> Vente
        </span>
        {livraison.distance_km != null && <span className="tabular text-xs text-surface-500">{formatDistance(Number(livraison.distance_km))}</span>}
      </span>
      <span className="line-clamp-2 text-sm font-semibold leading-snug text-navy-950">
        {placeLabel(marketplacePickup(livraison))} → {placeLabel(marketplaceDropoff(livraison))}
      </span>
      <div className="mt-auto flex items-center justify-between gap-2">
        <Price value={livraison.montant_final} className="text-base" currencyClass="text-[0.6875rem]" />
        <button
          type="button"
          className="btn-accent btn-sm shadow-none"
          onClick={() => accept(livraison, { kind: 'marketplace' })}
          disabled={disabled || accepting}
          aria-busy={accepting}
        >
          <ButtonLabel loading={accepting} loadingLabel="…">Accepter</ButtonLabel>
        </button>
      </div>
    </article>
  );
}

function Opportunities({ express, marketplace, busy }) {
  const total = express.length + marketplace.length;
  const { accept, isAccepting } = useAcceptExpress();

  return (
    <section aria-labelledby="autour-titre">
      <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
        <div>
          <h2 id="autour-titre" className="text-base font-bold text-navy-950">Courses autour de vous</h2>
        </div>
        <Link to={`${ROUTES.MISSIONS}?onglet=disponibles`} className="shrink-0 text-sm font-bold text-primary-600">
          Tout voir ({total})
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
        {express.slice(0, 4).map((m) => (
          <ExpressOpportunity key={`e-${m.id}`} mission={m} accept={accept} accepting={isAccepting(m.id)} disabled={busy} />
        ))}
        {marketplace.slice(0, 2).map((l) => (
          <MarketplaceOpportunity key={`m-${l.id}`} livraison={l} accept={accept} accepting={isAccepting(l.id)} disabled={busy} />
        ))}
      </div>
    </section>
  );
}

function WaitingCard() {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="icon-tile h-12 w-12 bg-primary-50 text-primary-600"><Clock size={22} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-navy-950">Aucune course pour l'instant</p>
        <p className="text-sm text-surface-500">Vous serez alerté dès qu'une course arrive dans votre zone.</p>
      </div>
    </div>
  );
}

export default function HomeDashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const { proposals, active, available } = useSelector((state) => state.missions);
  const marketplace = useSelector((state) => state.marketplace);
  const balance = useSelector((state) => state.earnings.balance);
  const unread = useSelector(selectUnreadCount);

  const activeMission = active.items[0];
  const activeLivraison = useMemo(() => marketplace.mine.items.find(isActiveMarketplace), [marketplace.mine.items]);
  // Seules les livraisons marketplace express s'acceptent ici (standard : agence).
  const marketplaceExpress = useMemo(() => marketplace.available.items.filter((l) => l.mode !== 'standard'), [marketplace.available.items]);

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
  const opportunityCount = available.items.length + marketplaceExpress.length;

  return (
    <div className="safe-top">
      {/* En-tete navy : identite, etat de service et chiffres du jour */}
      <header className="relative rounded-b-3xl bg-navy-900 text-white">
        <div className="page-container space-y-[1.125rem] pb-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <Link to={ROUTES.PROFILE} className="flex min-w-0 items-center gap-3">
              {user?.livreur?.photo_profil_url ? (
                <img src={user.livreur.photo_profil_url} alt="" className="h-[46px] w-[46px] shrink-0 rounded-[0.875rem] object-cover" />
              ) : (
                <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[0.875rem] bg-white">
                  <img src={logoMark} alt="" className="h-[34px] w-auto" />
                </span>
              )}
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[0.8125rem] text-navy-200">{greeting()}, <RealtimeStatus /></p>
                <p className="truncate font-heading text-[1.2rem] font-bold tracking-tight">{fullName(user)}</p>
              </div>
            </Link>
            <Link
              to={ROUTES.NOTIFICATIONS}
              className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[0.875rem] bg-white/10 text-white"
              aria-label={unread ? `Activité, ${unread} non lue(s)` : 'Activité'}
            >
              <Bell size={21} aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-navy-900 bg-accent-400 px-1 text-micro font-extrabold leading-none text-accent-900">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          </div>

          {/* Hors ligne sans mission : le grand bouton du corps de page suffit. */}
          {(disponible || hasActive) && <AvailabilitySwitch variant="banner" />}

          <TodayStrip today={today} solde={solde} />
        </div>

        {/* Signature "plume" : les 4 couleurs du logo. */}
        <div className="plume-band absolute inset-x-7 -bottom-[3px] h-1.5 rounded-full" aria-hidden="true" />
      </header>

      <div className="page-container space-y-[1.125rem] pb-6 pt-6">
        <AbonnementBanner />

        {pending.length > 0 && <ProposalsCallout count={pending.length} expireLe={nextExpiry} />}

        {!disponible && !hasActive && <OfflineHero count={available.items.length} />}

        {/* Mission en cours : l'action du moment passe avant tout le reste. */}
        {activeMission && <ExpeditionHero mission={activeMission} />}
        {!activeMission && activeLivraison && <MarketplaceHero livraison={activeLivraison} />}

        <ReadinessCard />

        {disponible && (opportunityCount > 0 ? (
          <Opportunities
            express={available.items}
            marketplace={marketplaceExpress}
            busy={active.items.length > 0}
          />
        ) : !hasActive && <WaitingCard />)}
      </div>
    </div>
  );
}
