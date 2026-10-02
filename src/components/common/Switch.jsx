// Interrupteur on/off. `tone` colore l'etat actif : success pour un statut
// (disponibilite), primary pour un reglage (notifications).
const ON = {
  primary: 'bg-primary-600',
  success: 'bg-success-600',
};

export default function Switch({ checked, onChange, label, disabled = false, tone = 'primary' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition-colors duration-200 disabled:cursor-default disabled:opacity-60 ${checked ? ON[tone] || ON.primary : 'bg-surface-300'}`}
    >
      <span
        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-card transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`}
        aria-hidden="true"
      />
    </button>
  );
}
