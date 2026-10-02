import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Zap, PackageCheck, CircleCheckBig, CircleX, CheckCheck, Trash2 } from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import IconButton from '../../components/common/IconButton';
import EmptyState from '../../components/common/EmptyState';
import RealtimeStatus from '../../components/common/RealtimeStatus';
import FilterChips from '../../components/common/FilterChips';
import { markAllRead, markRead, clearActivity } from '../../store/slices/notificationsSlice';
import { formatDateTime, formatRelativeShort } from '../../utils/format';
import { isRealtimeConfigured } from '../../services/echo';

// Fil d'activite local : l'API n'expose aucun historique de notifications
// livreur (PARCOURS_LIVREUR_API.md §7.4). Alimente par le WebSocket.
const KIND = {
  available: { icon: Zap, className: 'bg-accent-50 text-accent-600' },
  assigned: { icon: PackageCheck, className: 'bg-primary-50 text-primary-600' },
  accepted: { icon: CircleCheckBig, className: 'bg-success-50 text-success-600' },
  refused: { icon: CircleX, className: 'bg-surface-100 text-surface-500' },
};

// Filtres : missions (nouvelles, assignees) / reponses a mes offres.
const FILTERS = [
  { key: 'all', label: 'Toutes', kinds: null },
  { key: 'missions', label: 'Missions', kinds: ['available', 'assigned'] },
  { key: 'offers', label: 'Offres', kinds: ['accepted', 'refused'] },
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
  const items = useSelector((state) => state.notifications.items);
  const hasUnread = items.some((n) => !n.lue);
  const [filter, setFilter] = useState('all');

  const { visible, options } = useMemo(() => {
    const match = (f, n) => !f.kinds || f.kinds.includes(n.kind);
    const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
    return {
      visible: items.filter((n) => match(active, n)),
      // Compteur = elements non lus de chaque filtre.
      options: FILTERS.map((f) => ({ key: f.key, label: f.label, count: items.filter((n) => !n.lue && match(f, n)).length })),
    };
  }, [items, filter]);

  // Les elements consultes passent "lus" en quittant l'ecran.
  useEffect(() => () => { dispatch(markAllRead()); }, [dispatch]);

  const open = (n) => {
    dispatch(markRead(n.id));
    if (n.link) navigate(n.link);
  };

  return (
    <div>
      <TopBar
        title="Activité"
        right={items.length > 0 && (
          <>
            {hasUnread && <IconButton icon={CheckCheck} size={19} label="Tout marquer comme lu" onClick={() => dispatch(markAllRead())} />}
            <IconButton icon={Trash2} size={18} label="Effacer l'activité" onClick={() => dispatch(clearActivity())} />
          </>
        )}
      />

      <div className="page-container space-y-3 py-4">
        <RealtimeStatus variant="banner" />
        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Aucune activité"
            description={isRealtimeConfigured()
              ? 'Nouvelles missions, assignations et réponses à vos offres apparaîtront ici en temps réel.'
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
          </>
        )}
      </div>
    </div>
  );
}
