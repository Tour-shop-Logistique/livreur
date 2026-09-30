import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';
import { ROUTES } from '../routes';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-50 px-6 text-center">
      <span className="icon-tile h-16 w-16 rounded-3xl bg-primary-50 text-primary-600"><MapPinOff size={30} aria-hidden="true" /></span>
      <div>
        <p className="font-heading text-xl font-semibold text-surface-900">Page introuvable</p>
        <p className="mt-1 text-sm text-surface-500">Cette adresse ne mène nulle part.</p>
      </div>
      <Link to={ROUTES.HOME} className="btn-primary">Retour à l'accueil</Link>
    </div>
  );
}
