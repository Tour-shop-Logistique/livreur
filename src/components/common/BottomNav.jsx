import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { House, Route, Wallet, UserRound } from 'lucide-react';
import { ROUTES } from '../../routes';

// Barre flottante du design "Plume" : pilule blanche detachee du bord,
// onglet actif en aplat navy. 4 onglets : l'Activite est accessible par la
// cloche de l'en-tete d'accueil.
const TABS = [
  { to: ROUTES.HOME, icon: House, label: 'Accueil', end: true },
  { to: ROUTES.MISSIONS, icon: Route, label: 'Missions', badgeKey: 'missions' },
  { to: ROUTES.EARNINGS, icon: Wallet, label: 'Gains' },
  { to: ROUTES.PROFILE, icon: UserRound, label: 'Profil' },
];

function NavItem({ tab, badge }) {
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) => `relative flex h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl text-caption font-bold transition-colors duration-200 ${
        isActive ? 'bg-navy-900 text-white' : 'text-surface-500 hover:text-navy-900'
      }`}
      aria-label={badge ? `${tab.label}, ${badge} en cours` : tab.label}
    >
      {({ isActive }) => (
        <>
          <tab.icon size={20} strokeWidth={isActive ? 2.3 : 2} aria-hidden="true" />
          {tab.label}
          {badge > 0 && (
            <span className="absolute right-3 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-accent-400 px-1 text-micro font-extrabold leading-none text-accent-900">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const activeCount = useSelector((state) =>
    state.missions.active.items.length
    + state.marketplace.mine.items.filter((l) => l.statut === 'assignee' || l.statut === 'en_cours').length
  );
  const badges = { missions: activeCount };

  return (
    <nav className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3" aria-label="Navigation principale">
      <div className="pointer-events-auto mx-auto mb-3 grid max-w-[26.5rem] grid-cols-4 gap-1 rounded-2xl bg-white p-2 shadow-nav">
        {TABS.map((tab) => (
          <NavItem key={tab.to} tab={tab} badge={tab.badgeKey ? badges[tab.badgeKey] : 0} />
        ))}
      </div>
    </nav>
  );
}
