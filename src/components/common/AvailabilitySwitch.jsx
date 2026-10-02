import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { setAvailability } from '../../store/slices/authSlice';
import Switch from './Switch';

// Disponibilite declarative (PUT /profile/availability). Si `false`, le livreur
// ne peut plus proposer d'offre express ni etre assigne en groupage (§3).
export default function AvailabilitySwitch({ variant = 'card' }) {
  const dispatch = useDispatch();
  const disponible = useSelector((state) => Boolean(state.auth.user?.disponible));
  const loading = useSelector((state) => state.auth.availabilityLoading);

  const toggle = async () => {
    const result = await dispatch(setAvailability(!disponible));
    if (setAvailability.fulfilled.match(result)) {
      toast.success(result.payload.message || (result.payload.disponible ? 'Vous êtes disponible.' : 'Vous êtes hors ligne.'));
    } else {
      toast.error(result.payload);
    }
  };

  const control = <Switch checked={disponible} onChange={toggle} label="Disponibilité" disabled={loading} tone="success" />;

  if (variant === 'inline') return control;

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
