import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import logo from '../../assets/logo_transparent.png';

// Gabarit commun des ecrans d'authentification / onboarding.
export default function AuthShell({ title, subtitle, children, footer, backTo, wide = false, showLogo = true }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="safe-top" />
      <div className={`mx-auto flex w-full flex-1 flex-col px-5 pb-8 pt-4 ${wide ? 'max-w-lg' : 'max-w-sm'}`}>
        {backTo ? (
          <Link to={backTo} className="-ml-2 mb-4 flex h-11 w-11 items-center justify-center rounded-full text-surface-700 hover:bg-surface-100" aria-label="Retour">
            <ChevronLeft size={24} />
          </Link>
        ) : <div className="h-6" />}

        {showLogo && <img src={logo} alt="TourShop" className="mb-8 h-10 w-auto self-start" />}

        <h1 className="text-2xl font-bold text-surface-900">{title}</h1>
        {subtitle && <p className="mt-1.5 text-lead leading-relaxed text-surface-500">{subtitle}</p>}

        <div className="mt-7 flex-1">{children}</div>

        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </div>
  );
}
