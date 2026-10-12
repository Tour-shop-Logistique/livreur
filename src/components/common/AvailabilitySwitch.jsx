import Switch from './Switch';
import useAvailability from '../../hooks/useAvailability';

// Disponibilite declarative (PUT /profile/availability). Si `false`, le livreur
// ne peut plus proposer d'offre express ni etre assigne en groupage (§3).
//  - card   : carte avec libelle et explication
//  - banner : bandeau d'etat de service de l'en-tete d'accueil
//  - inline : l'interrupteur seul
export default function AvailabilitySwitch({ variant = 'card' }) {
  const { disponible, loading, toggle } = useAvailability();

  const control = <Switch checked={disponible} onChange={toggle} label="Disponibilité" disabled={loading} tone="success" />;

  if (variant === 'inline') return control;

  if (variant === 'banner') {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border py-2.5 pl-3.5 pr-2.5 transition-colors ${
          disponible ? 'border-success-200 bg-success-50' : 'border-surface-200 bg-surface-50'
        }`}
      >
        <span
          className={`status-dot h-2.5 w-2.5 ${disponible ? 'bg-success-600 ring-4 ring-success-100' : 'bg-surface-400 ring-4 ring-surface-200'}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className={`text-lead font-semibold ${disponible ? 'text-success-800' : 'text-surface-800'}`}>
            {disponible ? 'En ligne' : 'Hors ligne'}
          </p>
          <p className={`truncate text-xs ${disponible ? 'text-success-700' : 'text-surface-500'}`}>
            {disponible ? 'Vous recevez les missions et assignations.' : 'Aucune nouvelle mission proposée.'}
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
          <span className={`status-dot ${disponible ? 'bg-success-500' : 'bg-surface-400'}`} aria-hidden="true" />
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
