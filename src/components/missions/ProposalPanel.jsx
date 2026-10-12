import { useEffect, useState } from 'react';
import { Timer, TimerOff } from 'lucide-react';
import BottomSheet from '../common/BottomSheet';
import ButtonLabel from '../common/ButtonLabel';
import FormField from '../common/FormField';
import useCountdown, { formatCountdown } from '../../hooks/useCountdown';

// Compte a rebours d'une proposition (`expire_le`).
export function ProposalTimer({ expireLe, className = '' }) {
  const left = useCountdown(expireLe);
  if (left == null) return null;
  const urgent = left < 120;
  return (
    <span className={`badge tabular ${left === 0 ? 'bg-surface-100 text-surface-500' : urgent ? 'bg-danger-50 text-danger-700' : 'bg-warning-50 text-warning-800'} ${className}`}>
      {left === 0 ? <TimerOff size={13} aria-hidden="true" /> : <Timer size={13} aria-hidden="true" />}
      {left === 0 ? 'Expirée' : formatCountdown(left)}
    </span>
  );
}

// Refus avec motif facultatif (max 255).
export function RefuseSheet({ open, onClose, onConfirm, loading, error, title = 'Refuser la proposition ?', description }) {
  const [motif, setMotif] = useState('');
  useEffect(() => { if (open) setMotif(''); }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description}>
      <FormField label="Motif" htmlFor="refus-motif" optional>
        <input
          id="refus-motif"
          className="input-field"
          maxLength={255}
          placeholder="Ex. Trop loin de ma position"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
        />
      </FormField>
      {error && <p className="field-error mt-3" role="alert">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>Annuler</button>
        <button type="button" className="btn-danger flex-[2]" onClick={() => onConfirm(motif.trim())} disabled={loading} aria-busy={loading}>
          <ButtonLabel loading={loading}>Refuser</ButtonLabel>
        </button>
      </div>
    </BottomSheet>
  );
}

// Delai de reponse d'une proposition (PARCOURS_LIVREUR_API.md §4.1bis).
const PROPOSAL_WINDOW_S = 15 * 60;
const RING_R = 30;
const RING_C = 2 * Math.PI * RING_R;

// Anneau de compte a rebours : la part restante du delai de 15 min.
export function CountdownRing({ left }) {
  if (left == null) return null;
  const ratio = Math.min(1, left / PROPOSAL_WINDOW_S);
  const urgent = left > 0 && left < 120;
  const stroke = left === 0 ? 'stroke-surface-300' : urgent ? 'stroke-danger-600' : 'stroke-warning-600';
  const track = urgent ? 'stroke-danger-100' : 'stroke-warning-100';
  return (
    <div className="relative h-[76px] w-[76px] shrink-0" role="timer" aria-label={left === 0 ? 'Proposition expirée' : `Temps restant ${formatCountdown(left)}`}>
      <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="38" cy="38" r={RING_R} fill="none" strokeWidth="6" className={track} />
        <circle
          cx="38"
          cy="38"
          r={RING_R}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - ratio)}
          className={`${stroke} transition-[stroke-dashoffset] duration-1000 ease-linear`}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className={`tabular text-lead font-bold ${urgent ? 'text-danger-700' : 'text-surface-900'}`}>
          {left === 0 ? '0:00' : formatCountdown(left)}
        </span>
        <span className="text-micro text-surface-500">{left === 0 ? 'expirée' : 'restantes'}</span>
      </span>
    </div>
  );
}

// Bloc "a accepter" des ecrans de detail : delai + Accepter / Refuser.
export default function ProposalPanel({
  expireLe, onAccept, onRefuse, loading, error, disabled, disabledReason, title, children,
}) {
  const left = useCountdown(expireLe);
  const expired = left === 0;
  const [refusing, setRefusing] = useState(false);

  return (
    <section className="card space-y-4 p-4 ring-2 ring-warning-200">
      <div className="flex items-center gap-4">
        <CountdownRing left={left} />
        <div className="min-w-0">
          <p className="font-semibold text-surface-900">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-surface-500">
            {expired ? 'Le délai de réponse est dépassé.' : 'Sans réponse avant la fin du délai, elle sera réattribuée.'}
          </p>
        </div>
      </div>
      {children}
      {disabled && disabledReason && !expired && <p className="text-xs text-warning-800">{disabledReason}</p>}
      {error && !refusing && <p className="field-error" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={() => setRefusing(true)} disabled={loading || expired}>
          Refuser
        </button>
        <button type="button" className="btn-primary btn-lg flex-[2]" onClick={onAccept} disabled={loading || expired || disabled} aria-busy={loading}>
          <ButtonLabel loading={loading && !refusing}>Accepter</ButtonLabel>
        </button>
      </div>

      <RefuseSheet
        open={refusing}
        onClose={() => setRefusing(false)}
        loading={loading}
        error={error}
        onConfirm={async (motif) => {
          const ok = await onRefuse(motif);
          if (ok) setRefusing(false);
        }}
      />
    </section>
  );
}
