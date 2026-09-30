import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Zap, PackageCheck, CircleCheckBig, CircleX, CheckCheck, Trash2 } from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import EmptyState from '../../components/common/EmptyState';
import RealtimeStatus from '../../components/common/RealtimeStatus';
import { markAllRead, markRead, clearActivity } from '../../store/slices/notificationsSlice';
import { formatRelative } from '../../utils/format';
import { isRealtimeConfigured } from '../../services/echo';

// Fil d'activite local : l'API n'expose aucun historique de notifications
// livreur (PARCOURS_LIVREUR_API.md §7.4). Alimente par le WebSocket.
const KIND = {
  available: { icon: Zap, className: 'bg-accent-50 text-accent-600' },
  assigned: { icon: PackageCheck, className: 'bg-primary-50 text-primary-600' },
  accepted: { icon: CircleCheckBig, className: 'bg-success-50 text-success-600' },
  refused: { icon: CircleX, className: 'bg-surface-100 text-surface-500' },
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((state) => state.notifications.items);
  const hasUnread = items.some((n) => !n.lue);

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
            {hasUnread && (
              <button type="button" onClick={() => dispatch(markAllRead())} className="flex h-11 w-11 items-center justify-center rounded-full text-surface-600 hover:bg-surface-100" aria-label="Tout marquer comme lu">
                <CheckCheck size={19} />
              </button>
            )}
            <button type="button" onClick={() => dispatch(clearActivity())} className="flex h-11 w-11 items-center justify-center rounded-full text-surface-600 hover:bg-surface-100" aria-label="Effacer l'activité">
              <Trash2 size={18} />
            </button>
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
          <ul className="card divide-y divide-surface-100 overflow-hidden">
            {items.map((n) => {
              const kind = KIND[n.kind] || { icon: Bell, className: 'bg-surface-100 text-surface-500' };
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-surface-50 ${n.lue ? '' : 'bg-primary-50/40'}`}
                  >
                    <span className={`icon-tile h-10 w-10 ${kind.className}`}><kind.icon size={18} aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm text-surface-900 ${n.lue ? 'font-medium' : 'font-semibold'}`}>{n.titre}</p>
                        {!n.lue && <span className="status-dot mt-1.5 bg-accent-600" aria-label="Non lue" />}
                      </div>
                      {n.message && <p className="mt-0.5 text-[13px] leading-snug text-surface-500">{n.message}</p>}
                      <p className="mt-1 text-[11px] text-surface-400">{formatRelative(n.date)}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
