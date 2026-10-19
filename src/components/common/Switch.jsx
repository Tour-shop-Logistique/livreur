// Interrupteur on/off. `tone` colore l'etat actif : lime pour le statut de
// service (design "Plume" : En ligne = lime), primary pour un reglage.
const ON = {
  primary: { track: 'bg-primary-600', thumb: 'bg-white' },
  success: { track: 'bg-accent-400', thumb: 'bg-accent-900' },
  lime: { track: 'bg-accent-400', thumb: 'bg-accent-900' },
};

export default function Switch({ checked, onChange, label, disabled = false, tone = 'primary' }) {
  const on = ON[tone] || ON.primary;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative h-[34px] w-[58px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 disabled:cursor-default disabled:opacity-60 ${checked ? on.track : 'bg-surface-300'}`}
    >
      <span
        className={`absolute left-1 top-1 h-[26px] w-[26px] rounded-full shadow-card transition-transform duration-200 ${checked ? `translate-x-6 ${on.thumb}` : 'translate-x-0 bg-white'}`}
        aria-hidden="true"
      />
    </button>
  );
}
