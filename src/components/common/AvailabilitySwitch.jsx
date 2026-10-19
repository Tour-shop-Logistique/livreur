import Switch from './Switch';
import useAvailability from '../../hooks/useAvailability';

// Disponibilite declarative (PUT /profile/availability). Si `false`, le livreur
// ne peut plus accepter de course express ni etre assigne en groupage (§3).
//  - card   : carte avec libelle et explication
//  - banner : bandeau d'etat de service de l'en-tete d'accueil
//  - inline : l'interrupteur seul
export default function AvailabilitySwitch({ variant = 'card' }) {
  const { disponible, loading, toggle } = useAvailability();

  const control = <Switch checked={disponible} onChange={toggle} label="Disponibilité" disabled={loading} tone="lime" />;

  if (variant === 'inline') return control;

  // Bandeau pose sur l'en-tete navy de l'accueil (design "Plume").
  if (variant === 'banner') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] py-3 pl-4 pr-3 transition-colors">
        <span
          className={`status-dot h-2.5 w-2.5 ${disponible ? 'bg-accent-400 ring-[5px] ring-accent-400/25' : 'bg-navy-300 ring-[5px] ring-white/10'}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-lead font-bold text-white">
            {disponible ? 'En ligne' : 'Hors ligne'}
          </p>
          <p className="truncate text-xs text-navy-200">
            {disponible ? 'Vous recevez les courses et assignations.' : 'Aucune nouvelle course proposée.'}
          </p>
        </div>
        {control}
      </div>
    );
  }

  return (
    <div className="card flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-surface-900">
          <span className={`status-dot ${disponible ? 'bg-accent-400' : 'bg-surface-400'}`} aria-hidden="true" />
          {disponible ? 'Disponible' : 'Hors ligne'}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-surface-500">
          {disponible
            ? 'Vous recevez les missions express et les assignations.'
            : 'Aucune nouvelle mission ne vous sera proposée.'}
        </p>
      </div>
      {control}
    </div>
  );
}
