import { Link } from 'react-router-dom';
import { PackageOpen, PackageCheck, ChevronRight } from 'lucide-react';
import { ExpeditionStatusBadge } from './StatusBadge';
import RouteLine from './RouteLine';
import { expeditionRoute } from './missionRoute';
import { missionDetailPath } from '../../routes';
import { expeditionPhase, MISSION_TYPE_LABEL, MISSION_MODE_LABEL } from '../../utils/missionFlow';
import { formatPrice, formatDateTime } from '../../utils/format';

// Carte d'une mission d'expedition qui m'est assignee (active ou historique).
export default function MissionCard({ mission }) {
  const phase = expeditionPhase(mission);
  const route = expeditionRoute(mission);
  const isPickup = mission.type === 'enlevement';
  const Icon = isPickup ? PackageOpen : PackageCheck;
  const reference = mission.expedition?.reference;

  return (
    <Link
      to={missionDetailPath(mission.id)}
      className="card block p-4 transition hover:shadow-raised active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`icon-tile h-10 w-10 ${isPickup ? 'bg-primary-50 text-primary-600' : 'bg-accent-50 text-accent-600'}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-surface-900">
              {MISSION_TYPE_LABEL[mission.type] || 'Mission'}
              <span className="font-normal text-surface-400"> · {MISSION_MODE_LABEL[mission.mode] || mission.mode}</span>
            </p>
            <p className="truncate font-mono text-xs text-surface-500">{reference || `#${String(mission.id).slice(0, 8)}`}</p>
          </div>
        </div>
        <ExpeditionStatusBadge phase={phase} />
      </div>

      <div className="mt-4">
        <RouteLine from={route.from} to={route.to} compact />
      </div>

      <div className="divider mt-4 flex items-center justify-between pt-3">
        <div>
          <p className="tabular text-[15px] font-bold text-surface-900">{formatPrice(mission.montant_final)}</p>
          {mission.assignee_le && <p className="text-[11px] text-surface-400">Assignée {formatDateTime(mission.assignee_le).toLowerCase()}</p>}
        </div>
        <span className="flex items-center gap-0.5 text-[13px] font-semibold text-primary-600">
          {phase === 'done' || phase === 'cancelled' ? 'Détails' : 'Continuer'} <ChevronRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
