// Bouton rond icone seule (barres d'en-tete, fermeture de feuille). Zone tactile
// de 44px ; `label` est obligatoire car il sert de nom accessible.
export default function IconButton({ icon, label, size = 20, spinning = false, className = '', type = 'button', ...props }) {
  const Icon = icon;
  return (
    <button
      type={type}
      aria-label={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-surface-600 transition hover:bg-surface-100 active:bg-surface-200 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      <Icon size={size} className={spinning ? 'animate-spin' : undefined} aria-hidden="true" />
    </button>
  );
}
