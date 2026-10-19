import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';

// Ecran de fin de mission, affiche juste apres la cloture (depot agence, remise
// validee, livraison marketplace validee). `stats` : [{ label, value }] ;
// `primary` / `secondary` : { label, to }. Echap ou `onClose` ramene au detail.
export default function MissionCompleteScreen({ title, description, stats = [], primary, secondary, onClose }) {
  const primaryRef = useRef(null);
  // Fonction inline cote appelant : en ref pour ne pas relancer l'effet (focus).
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    primaryRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-navy-900 text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-complete-title"
    >
      <div className="safe-top" />
      <div className="plume-band mx-auto mt-4 h-1.5 w-40 rounded-full" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="icon-tile h-20 w-20 rounded-3xl bg-accent-400 text-accent-900 shadow-lime ring-[10px] ring-accent-400/20">
          <PartyPopper size={38} aria-hidden="true" />
        </span>
        <h2 id="mission-complete-title" className="mt-7 text-2xl font-bold text-white">{title}</h2>
        {description && <p className="mt-2 max-w-xs text-sm leading-relaxed text-navy-200">{description}</p>}

        {stats.length > 0 && (
          <dl className="mt-8 grid w-full divide-x divide-white/10 rounded-2xl bg-white/[0.08]" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
            {stats.map((s) => (
              <div key={s.label} className="px-3 py-4">
                <dt className="text-xs font-medium text-navy-200">{s.label}</dt>
                <dd className="tabular mt-1 font-heading text-lg font-bold text-accent-300">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md space-y-2 px-4 pb-4 pt-3">
        {primary && <Link ref={primaryRef} to={primary.to} className="btn-accent btn-lg w-full">{primary.label}</Link>}
        {secondary && <Link to={secondary.to} className="btn w-full bg-transparent text-white hover:bg-white/10">{secondary.label}</Link>}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
