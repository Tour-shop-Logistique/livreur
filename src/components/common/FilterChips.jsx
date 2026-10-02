// Chips de filtre horizontales — `options`: [{ key, label, count? }], valeur controlee.
export default function FilterChips({ options, value, onChange, className = '' }) {
  return (
    <div className={`no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 ${className}`} role="tablist">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-label font-medium transition ${
              active
                ? 'border-surface-900 bg-surface-900 text-white'
                : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
            }`}
          >
            {opt.label}
            {opt.count > 0 && (
              <span className={`tabular rounded-full px-1.5 text-caption font-semibold ${active ? 'bg-white/20' : 'bg-surface-100 text-surface-600'}`}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
