import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Zap, ShoppingBag, Send, ArrowRight, Wallet, ChevronRight, PackageOpen, PackageCheck, Bell, Coffee,
} from 'lucide-react';
import AvailabilitySwitch from '../../components/common/AvailabilitySwitch';
import AbonnementBanner from '../../components/common/AbonnementBanner';
import StatCard from '../../components/common/StatCard';
import RealtimeStatus from '../../components/common/RealtimeStatus';
import { expeditionRoute } from '../../components/missions/missionRoute';
import { ROUTES, missionDetailPath, marketplaceDetailPath } from '../../routes';
import {
  expeditionPhaseLabel, expeditionAction, marketplaceAction, isActiveMarketplace, MISSION_TYPE_LABEL,
} from '../../utils/missionFlow';
import { formatPrice, initials } from '../../utils/format';
import { selectUnreadCount } from '../../store/slices/notificationsSlice';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

// Mission en cours = element central de l'accueil (un livreur n'a jamais plus
// d'une mission d'expedition active, §3).
function ActiveMissionHero({ mission, livraison }) {
  if (mission) {
    const route = expeditionRoute(mission);
    const action = expeditionAction(mission);
    const target = mission.type === 'enlevement' && action?.key !== 'confirmAgencyDrop' ? route.from : route.to;
    const Icon = mission.type === 'enlevement' ? PackageOpen : PackageCheck;
    return (
      <Link to={missionDetailPath(mission.id)} className="brand-gradient block overflow-hidden rounded-3xl p-5 text-white shadow-brand transition active:scale-[0.99]">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            <span className="status-dot animate-pulse-dot bg-accent-300" aria-hidden="true" /> Mission en cours
          </span>
          <span className="tabular text-sm font-semibold text-white/90">{formatPrice(mission.montant_final)}</span>
        </div>
        <div className="mt-4 flex items-start gap-3">
          <span className="icon-tile h-11 w-11 bg-white/15"><Icon size={22} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">{MISSION_TYPE_LABEL[mission.type]} · {expeditionPhaseLabel(mission)}</p>
            <p className="mt-0.5 truncate text-lg font-semibold">{target?.title || 'Voir la mission'}</p>
            {target?.detail && <p className="truncate text-sm text-white/75">{target.detail}</p>}
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-primary-700">
          <span className="text-sm font-semibold">{action?.label || 'Voir la mission'}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </div>
      </Link>
    );
  }

  if (livraison) {
    const action = marketplaceAction(livraison);
    return (
      <Link to={marketplaceDetailPath(livraison.id)} className="block overflow-hidden rounded-3xl bg-success-700 p-5 text-white shadow-raised transition active:scale-[0.99]">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
            <span className="status-dot animate-pulse-dot bg-white" aria-hidden="true" /> Livraison marketplace
          </span>
          <span className="tabular text-sm font-semibold text-white/90">{formatPrice(livraison.montant_final)}</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="icon-tile h-11 w-11 bg-white/15"><ShoppingBag size={22} aria-hidden="true" /></span>
          <p className="text-lg font-semibold">{livraison.statut === 'en_cours' ? "En route vers l'acheteur" : "À récupérer chez le vendeur"}</p>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-success-700">
          <span className="text-sm font-semibold">{action?.label || 'Voir la livraison'}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </div>
      </Link>
    );
  }

  return null;
}

export default function HomeDashboardPage() {
  const user = useSelector((state) => state.auth.user);
  const { active, available, offers } = useSelector((state) => state.missions);
  const marketplace = useSelector((state) => state.marketplace);
  const balance = useSelector((state) => state.earnings.balance);
  const unread = useSelector(selectUnreadCount);

  const activeMission = active.items[0];
  const activeLivraison = useMemo(() => marketplace.mine.items.find(isActiveMarketplace), [marketplace.mine.items]);
  const offersCount = Object.keys(offers).length + Object.keys(marketplace.offers).length;
  const solde = balance.value ?? (user?.solde_livreur != null ? Number(user.solde_livreur) : null);
  const disponible = Boolean(user?.disponible);
  const firstName = user?.prenoms?.split(' ')[0] || user?.nom || 'Livreur';

  return (
    <div className="safe-top">
      <div className="page-container space-y-5 pb-6 pt-5">
        {/* En-tete */}
        <header className="flex items-center justify-between gap-3">
          <Link to={ROUTES.PROFILE} className="flex min-w-0 items-center gap-3">
            {user?.livreur?.photo_profil_url ? (
              <img src={user.livreur.photo_profil_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white" />
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
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-surface-600 shadow-card"
            aria-label={unread ? `Activité, ${unread} non lue(s)` : 'Activité'}
          >
            <Bell size={20} aria-hidden="true" />
            {unread > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent-600" />}
          </Link>
        </header>

        <AvailabilitySwitch />
        <AbonnementBanner />

        {/* Mission en cours */}
        {activeMission || activeLivraison ? (
          <ActiveMissionHero mission={activeMission} livraison={!activeMission ? activeLivraison : null} />
        ) : (
          <div className="card flex items-center gap-4 p-5">
            <span className={`icon-tile h-12 w-12 ${disponible ? 'bg-primary-50 text-primary-600' : 'bg-surface-100 text-surface-500'}`}>
              {disponible ? <Zap size={22} aria-hidden="true" /> : <Coffee size={22} aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-surface-900">Aucune mission en cours</p>
              <p className="text-sm text-surface-500">
                {disponible
                  ? `${available.items.length} mission${available.items.length > 1 ? 's' : ''} express ouverte${available.items.length > 1 ? 's' : ''} aux offres.`
                  : 'Passez disponible pour recevoir des missions.'}
              </p>
            </div>
            {disponible && (
              <Link to={`${ROUTES.MISSIONS}?onglet=disponibles`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white" aria-label="Voir les missions disponibles">
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        )}

        {/* Solde */}
        <Link to={ROUTES.EARNINGS} className="card flex items-center gap-4 p-4 transition hover:shadow-raised active:scale-[0.99]">
          <span className="icon-tile h-11 w-11 bg-success-50 text-success-600"><Wallet size={21} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-surface-500">Solde disponible</p>
            <p className="tabular text-xl font-bold text-surface-900">{solde != null ? formatPrice(solde) : '—'}</p>
          </div>
          <span className="flex items-center gap-0.5 text-[13px] font-semibold text-primary-600">
            Gains <ChevronRight size={16} aria-hidden="true" />
          </span>
        </Link>

        {/* Opportunites */}
        <section>
          <h2 className="section-title">Opportunités</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Zap} tone="accent" value={available.items.length} label="Express" to={`${ROUTES.MISSIONS}?onglet=disponibles`} />
            <StatCard icon={ShoppingBag} tone="success" value={marketplace.available.items.length} label="Marketplace" to={`${ROUTES.MISSIONS}?onglet=marketplace`} />
            <StatCard icon={Send} tone="primary" value={offersCount} label="Mes offres" to={`${ROUTES.MISSIONS}?onglet=disponibles`} />
          </div>
        </section>

        {!disponible && (
          <p className="rounded-xl bg-surface-100 px-4 py-3 text-xs leading-relaxed text-surface-600">
            Hors ligne : vous ne pouvez ni proposer d'offre express, ni recevoir d'assignation du backoffice. Vos missions en cours restent accessibles.
          </p>
        )}
      </div>
    </div>
  );
}
