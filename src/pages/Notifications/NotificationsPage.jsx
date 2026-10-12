import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Zap, PackageCheck, CircleCheckBig, CircleX, CheckCheck, Trash2, Timer, BadgeCheck, UserX,
  CalendarClock, Lock, Wallet, RefreshCw,
} from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import IconButton from '../../components/common/IconButton';
import EmptyState from '../../components/common/EmptyState';
import RealtimeStatus from '../../components/common/RealtimeStatus';
import FilterChips from '../../components/common/FilterChips';
import ButtonLabel from '../../components/common/ButtonLabel';
import {
  markAllRead, markRead, clearActivity, fetchServerNotifications, markServerNotificationRead,
  markAllServerNotificationsRead, selectActivityFeed,
} from '../../store/slices/notificationsSlice';
import { formatDateTime, formatRelativeShort } from '../../utils/format';
import { isRealtimeConfigured } from '../../services/echo';

// Activite = historique persiste des notifications (GET /livreur/notifications,
// partage entre appareils) + evenements temps reel recus app ouverte.
const KIND = {
  available: { icon: Zap, className: 'bg-accent-50 text-accent-600' },
  proposed: { icon: Timer, className: 'bg-accent-50 text-accent-600' },
  assigned: { icon: PackageCheck, className: 'bg-primary-50 text-primary-600' },
  accepted: { icon: CircleCheckBig, className: 'bg-success-50 text-success-600' },
  refused: { icon: CircleX, className: 'bg-surface-100 text-surface-500' },
  account: { icon: BadgeCheck, className: 'bg-success-50 text-success-600' },
  account_rejected: { icon: UserX, className: 'bg-danger-50 text-danger-600' },
  subscription: { icon: CalendarClock, className: 'bg-warning-50 text-warning-700' },
  subscription_ok: { icon: BadgeCheck, className: 'bg-success-50 text-success-600' },
  subscription_rejected: { icon: CircleX, className: 'bg-danger-50 text-danger-600' },
  subscription_blocked: { icon: Lock, className: 'bg-danger-50 text-danger-600' },
  money: { icon: Wallet, className: 'bg-success-50 text-success-600' },
  money_rejected: { icon: Wallet, className: 'bg-danger-50 text-danger-600' },
};

const FILTERS = [
  { key: 'all', label: 'Toutes', kinds: null },
  { key: 'missions', label: 'Missions', kinds: ['available', 'proposed', 'assigned'] },
  { key: 'offers', label: 'Offres', kinds: ['accepted', 'refused'] },
  { key: 'compte', label: 'Compte', kinds: ['account', 'account_rejected', 'subscription', 'subscription_ok', 'subscription_rejected', 'subscription_blocked', 'money', 'money_rejected'] },
];

function ActivityItem({ item, onOpen }) {
  const kind = KIND[item.kind] || { icon: Bell, className: 'bg-surface-100 text-surface-500' };
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-surface-50 ${item.lue ? '' : 'bg-primary-50/40'}`}
      >
        <span className={`icon-tile h-10 w-10 ${kind.className}`}><kind.icon size={18} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className={`text-sm text-surface-900 ${item.lue ? 'font-medium' : 'font-semibold'}`}>{item.titre}</p>
            <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
              {!item.lue && <span className="status-dot bg-accent-600" aria-hidden="true" />}
              <time dateTime={item.date} title={formatDateTime(item.date)} className="tabular text-caption text-surface-500">
                {formatRelativeShort(item.date)}
              </time>
            </span>
          </div>
          {item.message && <p className="mt-0.5 text-label leading-snug text-surface-500">{item.message}</p>}
          {!item.lue && <span className="sr-only">Non lue</span>}
        </div>
      </button>
    </li>
  );
}

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectActivityFeed);
  const server = useSelector((state) => state.notifications.server);
  const hasLocal = useSelector((state) => state.notifications.items.length > 0);
  const hasUnread = items.some((n) => !n.lue);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchServerNotifications());
  }, [dispatch]);

  const { visible, options } = useMemo(() => {
    const match = (f, n) => !f.kinds || f.kinds.includes(n.kind);
    const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
    return {
      visible: items.filter((n) => match(active, n)),
      // Compteur = elements non lus de chaque filtre.
      options: FILTERS.map((f) => ({ key: f.key, label: f.label, count: items.filter((n) => !n.lue && match(f, n)).length })),
    };
  }, [items, filter]);

  // Les elements locaux consultes passent "lus" en quittant l'ecran.
  useEffect(() => () => { dispatch(markAllRead()); }, [dispatch]);

  const readAll = () => {
    dispatch(markAllRead());
    if (server.items.some((n) => !n.lue)) dispatch(markAllServerNotificationsRead());
  };

  const open = (n) => {
    if (n.server) {
      if (!n.lue) dispatch(markServerNotificationRead(n.serverId));
    } else {
      dispatch(markRead(n.id));
    }
    if (n.link) navigate(n.link);
  };

  const loadingFirst = !server.loaded && server.status === 'loading';

  return (
    <div>
      <TopBar
        title="Activité"
        back
        right={(
          <>
            {hasUnread && <IconButton icon={CheckCheck} size={19} label="Tout marquer comme lu" onClick={readAll} />}
            {hasLocal && <IconButton icon={Trash2} size={18} label="Effacer l'activité de cet appareil" onClick={() => dispatch(clearActivity())} />}
            <IconButton icon={RefreshCw} size={18} label="Actualiser" onClick={() => dispatch(fetchServerNotifications())} spinning={server.status === 'loading'} />
          </>
        )}
      />

      <div className="page-container space-y-3 py-4">
        <RealtimeStatus variant="banner" />
        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={loadingFirst ? 'Chargement…' : 'Aucune activité'}
            description={isRealtimeConfigured()
              ? 'Propositions de missions, assignations, réponses à vos offres, abonnement et retraits apparaîtront ici.'
              : 'Activez les notifications push dans votre profil pour être prévenu des nouvelles missions.'}
          />
        ) : (
          <>
            <FilterChips options={options} value={filter} onChange={setFilter} />
            {visible.length === 0 ? (
              <EmptyState compact icon={Bell} title="Rien dans ce filtre" description="Les événements correspondants apparaîtront ici." />
            ) : (
              <ul className="card divide-y divide-surface-100 overflow-hidden">
                {visible.map((n) => <ActivityItem key={n.id} item={n} onOpen={open} />)}
              </ul>
            )}
            {server.page < server.lastPage && (
              <button
                type="button"
                className="btn-secondary w-full"
                aria-busy={server.status === 'loading'}
                disabled={server.status === 'loading'}
                onClick={() => dispatch(fetchServerNotifications({ page: server.page + 1 }))}
              >
                <ButtonLabel loading={server.status === 'loading'} loadingLabel="Chargement…">Notifications plus anciennes</ButtonLabel>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
