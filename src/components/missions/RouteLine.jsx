// Trajet depart -> arrivee sous forme de mini timeline (points relies).
// `active` ('from' | 'to') met en avant l'arret vers lequel le livreur se rend.
export default function RouteLine({ from, to, compact = false, active = null }) {
  const rows = [
    { key: 'from', ...from, dot: 'border-2 border-surface-400 bg-white' },
    { key: 'to', ...to, dot: 'bg-accent-600' },
  ];

  return (
    <ol className="relative">
      {rows.map((row, i) => {
        const current = row.key === active;
        return (
          <li key={row.key} className={`relative flex gap-3 ${i === 0 ? (compact ? 'pb-2.5' : 'pb-3.5') : ''}`}>
            <div className="relative flex w-3 shrink-0 justify-center pt-1.5">
              <span
                className={`relative z-10 h-2.5 w-2.5 rounded-full ${current ? 'bg-accent-600 ring-4 ring-accent-100' : row.dot}`}
                aria-hidden="true"
              />
              {i === 0 && <span className="absolute left-1/2 top-4 h-full w-px -translate-x-1/2 border-l border-dashed border-surface-300" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={current ? 'eyebrow text-accent-700' : 'eyebrow'}>
                {row.label}
                {current && <span className="sr-only"> (prochain arrêt)</span>}
              </p>
              <p className={`truncate ${current ? 'font-semibold text-surface-900' : 'font-medium text-surface-800'} ${compact ? 'text-label' : 'text-sm'}`}>{row.title || '—'}</p>
              {row.detail && !compact && <p className="truncate text-xs text-surface-500">{row.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
