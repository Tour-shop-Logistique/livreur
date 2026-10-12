import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { setAvailability } from '../store/slices/authSlice';

// Bascule de disponibilite (PUT /profile/availability), partagee par
// l'interrupteur et le bouton "Passer en ligne" de l'accueil hors ligne.
export default function useAvailability() {
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

  return { disponible, loading, toggle };
}
