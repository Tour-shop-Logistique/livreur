// Trajet depart -> arrivee sous forme de mini timeline (points relies).
// `active` ('from' | 'to') met en avant l'arret vers lequel le livreur se rend.
// Design "Plume" : depart = anneau bleu, arrivee = carre navy, arret en cours = cyan.
export default function RouteLine({ from, to, compact = false, active = null }) {
  const rows = [
    { key: 'from', ...from, dot: 'rounded-full border-[3px] border-primary-500 bg-white' },
    { key: 'to', ...to, dot: 'rounded-[3px] bg-navy-900' },
  ];

  return (
    <ol className="relative">
      {rows.map((row, i) => {
        const current = row.key === active;
        return (
          <li key={row.key} className={`relative flex gap-3 ${i === 0 ? (compact ? 'pb-2.5' : 'pb-3.5') : ''}`}>
            <div className="relative flex w-3 shrink-0 justify-center pt-1">
              <span
                className={`relative z-10 h-3 w-3 ${current ? 'rounded-full bg-teal-500 ring-4 ring-teal-100' : row.dot}`}
                aria-hidden="true"
              />
              {i === 0 && <span className="absolute left-1/2 top-4 h-full w-0.5 -translate-x-1/2 border-l-2 border-dotted border-surface-300" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={current ? 'eyebrow text-teal-700' : 'eyebrow'}>
                {row.label}
                {current && <span className="sr-only"> (prochain arrêt)</span>}
              </p>
              <p className={`truncate ${current ? 'font-bold text-navy-950' : 'font-semibold text-surface-800'} ${compact ? 'text-sm' : 'text-lead'}`}>{row.title || '—'}</p>
              {row.detail && !compact && <p className="truncate text-xs text-surface-500">{row.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
