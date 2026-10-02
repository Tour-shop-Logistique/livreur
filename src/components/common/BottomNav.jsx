import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { House, Route, Wallet, Bell, UserRound } from 'lucide-react';
import { ROUTES } from '../../routes';
import { selectUnreadCount } from '../../store/slices/notificationsSlice';

const TABS = [
  { to: ROUTES.HOME, icon: House, label: 'Accueil', end: true },
  { to: ROUTES.MISSIONS, icon: Route, label: 'Missions', badgeKey: 'missions' },
  { to: ROUTES.EARNINGS, icon: Wallet, label: 'Gains' },
  { to: ROUTES.NOTIFICATIONS, icon: Bell, label: 'Activité', badgeKey: 'notifications' },
  { to: ROUTES.PROFILE, icon: UserRound, label: 'Profil' },
];

function NavItem({ tab, badge }) {
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className="group flex min-h-12 flex-col items-center justify-center gap-1"
      aria-label={badge ? `${tab.label}, ${badge} nouveau${badge > 1 ? 'x' : ''}` : tab.label}
    >
      {({ isActive }) => (
        <>
          <span
            className={`relative flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-200 ${
              isActive ? 'bg-primary-50 text-primary-600' : 'text-surface-400 group-hover:text-surface-600'
            }`}
          >
            <tab.icon size={21} strokeWidth={isActive ? 2.3 : 1.9} aria-hidden="true" />
            {badge > 0 && (
              <span className="absolute right-2.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-accent-600 px-1 text-micro font-bold leading-none text-white">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </span>
          <span className={`text-caption leading-none ${isActive ? 'font-semibold text-primary-700' : 'font-medium text-surface-500'}`}>
            {tab.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function BottomNav() {
  const unread = useSelector(selectUnreadCount);
  const activeCount = useSelector((state) =>
    state.missions.active.items.length
    + state.marketplace.mine.items.filter((l) => l.statut === 'assignee' || l.statut === 'en_cours').length
  );
  const badges = { notifications: unread, missions: activeCount };

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 bg-white shadow-nav" aria-label="Navigation principale">
      <div className="mx-auto grid h-bottom-nav max-w-md grid-cols-5 px-1">
        {TABS.map((tab) => (
          <NavItem key={tab.to} tab={tab} badge={tab.badgeKey ? badges[tab.badgeKey] : 0} />
        ))}
      </div>
    </nav>
  );
}
