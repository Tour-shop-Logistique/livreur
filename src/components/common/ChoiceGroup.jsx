import { useRef } from 'react';
import { Check } from 'lucide-react';

const COLUMNS = { 2: 'grid-cols-2', 3: 'grid-cols-3' };

// Choix unique parmi quelques options visibles (vehicule, piece, moyen de paiement).
// Semantique radiogroup : une seule tuile tabulable, fleches pour changer.
// `options`: [{ value, label, icon? }] ; `size="lg"` pour un choix structurant.
export default function ChoiceGroup({ options, value, onChange, label, columns = 2, size = 'md' }) {
  const refs = useRef([]);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const lg = size === 'lg';

  const onKeyDown = (index) => (e) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className={`grid gap-2 ${COLUMNS[columns] || COLUMNS[2]}`}>
      {options.map((o, i) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={i === selectedIndex ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={onKeyDown(i)}
            className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border px-5 text-center font-semibold leading-tight transition active:scale-[0.98] ${
              lg ? 'min-h-24 text-sm' : Icon ? 'min-h-16 text-xs' : 'min-h-12 text-xs'
            } ${
              active
                ? 'border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600'
                : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
            }`}
          >
            {active && <Check size={14} strokeWidth={3} className="absolute right-2 top-2" aria-hidden="true" />}
            {Icon && <Icon size={lg ? 28 : 18} aria-hidden="true" />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
