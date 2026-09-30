import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TopBar({ title, subtitle, back = false, right = null }) {
  const navigate = useNavigate();

  const goBack = () => {
    // Deep link direct (aucun historique) : retour a l'accueil plutot que hors de l'app.
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/', { replace: true });
  };

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-surface-200/70 bg-white/95 backdrop-blur">
      <div className="page-container flex h-14 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          {back && (
            <button
              type="button"
              onClick={goBack}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-surface-700 transition hover:bg-surface-100"
              aria-label="Retour"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-semibold text-surface-900">{title}</h1>
            {subtitle && <p className="truncate text-xs text-surface-500">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="flex shrink-0 items-center gap-1">{right}</div>}
      </div>
    </header>
  );
}
