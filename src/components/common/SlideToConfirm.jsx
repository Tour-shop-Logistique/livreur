import { useEffect, useRef, useState } from 'react';
import { ChevronsRight, Loader2 } from 'lucide-react';

// Action terrain a confirmer d'un glissement : evite les validations
// accidentelles (telephone en poche, en roulant). Clavier et lecteurs d'ecran
// valident par Entree / activation : le clic "synthetique" (event.detail === 0)
// est accepte, un simple tap au doigt ou a la souris ne l'est pas.
const THUMB = 48;
const PAD = 6;
const THRESHOLD = 0.85;

const TONES = {
  accent: { track: 'bg-accent-700', thumb: 'text-accent-700' },
  primary: { track: 'bg-primary-600', thumb: 'text-primary-700' },
  success: { track: 'bg-success-700', thumb: 'text-success-700' },
};

export default function SlideToConfirm({
  label, onConfirm, disabled = false, loading = false, loadingLabel = 'Envoi…', tone = 'accent',
}) {
  const trackRef = useRef(null);
  const origin = useRef(0);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const t = TONES[tone] || TONES.accent;

  const max = () => (trackRef.current ? trackRef.current.offsetWidth - THUMB - PAD * 2 : 0);

  // Retour au depart apres validation : pendant l'envoi, le curseur reste en
  // butee (voir `shown`) ; si l'action ouvre une feuille, il revient seul.
  const resetTimer = useRef(null);
  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const inactive = disabled || loading;

  const onPointerDown = (e) => {
    if (inactive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = e.clientX - x;
    setDragging(true);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    setX(Math.min(max(), Math.max(0, e.clientX - origin.current)));
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const m = max();
    if (m > 0 && x >= m * THRESHOLD) {
      setX(m);
      onConfirm();
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setX(0), 500);
    } else {
      setX(0);
    }
  };

  const onClick = (e) => {
    if (e.detail === 0 && !inactive) onConfirm();
  };

  const shown = loading ? max() : x;
  const progress = max() > 0 ? shown / max() : 0;

  return (
    <div
      ref={trackRef}
      className={`relative flex h-[60px] w-full select-none items-center justify-center overflow-hidden rounded-2xl ${t.track} ${disabled ? 'opacity-50' : ''}`}
    >
      <span
        className="pointer-events-none pl-12 text-base font-bold text-white"
        style={{ opacity: loading ? 1 : Math.max(0, 1 - progress * 1.4) }}
        aria-hidden="true"
      >
        {loading ? loadingLabel : label}
      </span>
      <button
        type="button"
        aria-label={`${label} (glisser vers la droite)`}
        aria-busy={loading}
        disabled={inactive}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        className={`absolute flex touch-none items-center justify-center rounded-xl bg-white shadow-card ${t.thumb} ${dragging ? '' : 'transition-transform duration-200'} ${inactive ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
        style={{ left: PAD, top: PAD, width: THUMB, height: THUMB, transform: `translateX(${shown}px)` }}
      >
        {loading
          ? <Loader2 size={22} className="animate-spin" aria-hidden="true" />
          : <ChevronsRight size={24} strokeWidth={2.4} aria-hidden="true" />}
      </button>
    </div>
  );
}
