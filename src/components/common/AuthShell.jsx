import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import logo from '../../assets/logo_transparent.png';

// Gabarit commun des ecrans d'authentification / onboarding (design "Plume" :
// bande aux 4 couleurs du logo en haut, titres navy).
export default function AuthShell({ title, subtitle, children, footer, backTo, wide = false, showLogo = true }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="safe-top" />
      <div className="plume-band h-1.5" aria-hidden="true" />
      <div className={`mx-auto flex w-full flex-1 flex-col px-5 pb-8 pt-4 ${wide ? 'max-w-lg' : 'max-w-sm'}`}>
        {backTo ? (
          <Link to={backTo} className="mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-[0.875rem] bg-surface-50 text-navy-900 shadow-card" aria-label="Retour">
            <ChevronLeft size={24} />
          </Link>
        ) : <div className="h-6" />}

        {showLogo && <img src={logo} alt="TourShop" className="mb-8 h-10 w-auto self-start" />}

        <h1 className="text-[1.75rem] font-bold leading-tight text-navy-950">{title}</h1>
        {subtitle && <p className="mt-1.5 text-lead leading-relaxed text-surface-500">{subtitle}</p>}

        <div className="mt-7 flex-1">{children}</div>

        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </div>
  );
}
