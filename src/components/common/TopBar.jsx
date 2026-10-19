import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// Barre de titre du design "Plume" : fond clair de l'app, titre Poppins,
// bouton retour en tuile blanche (zone tactile 46 px).
export default function TopBar({ title, subtitle, back = false, right = null }) {
  const navigate = useNavigate();

  const goBack = () => {
    // Deep link direct (aucun historique) : retour a l'accueil plutot que hors de l'app.
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/', { replace: true });
  };

  return (
    <header className="safe-top sticky top-0 z-30 bg-surface-50/95 backdrop-blur">
      <div className="page-container flex h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {back && (
            <button
              type="button"
              aria-label="Retour"
              onClick={goBack}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[0.875rem] bg-white text-navy-900 shadow-card transition active:scale-95"
            >
              <ChevronLeft size={22} strokeWidth={2.4} aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-heading text-xl font-bold tracking-tight text-navy-950">{title}</h1>
            {subtitle && <p className="truncate text-xs font-medium text-surface-500">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
