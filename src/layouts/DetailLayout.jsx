import { Outlet } from 'react-router-dom';
import DevBypassBanner from '../components/common/DevBypassBanner';

// Ecrans "action" (detail mission, abonnement) : pas de bottom nav, pour que la
// barre d'action collante reste au vrai bas de l'ecran, accessible au pouce.
export default function DetailLayout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-surface-50">
      <DevBypassBanner />
      <Outlet />
    </div>
  );
}
