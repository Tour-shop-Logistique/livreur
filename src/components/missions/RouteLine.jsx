// Trajet depart -> arrivee sous forme de mini timeline (points relies).
export default function RouteLine({ from, to, compact = false }) {
  const rows = [
    { key: 'from', ...from, dot: 'border-2 border-surface-400 bg-white' },
    { key: 'to', ...to, dot: 'bg-accent-600' },
  ];

  return (
    <ol className="relative">
      {rows.map((row, i) => (
        <li key={row.key} className={`relative flex gap-3 ${i === 0 ? (compact ? 'pb-2.5' : 'pb-3.5') : ''}`}>
          <div className="relative flex w-3 shrink-0 justify-center pt-1.5">
            <span className={`relative z-10 h-2.5 w-2.5 rounded-full ${row.dot}`} aria-hidden="true" />
            {i === 0 && <span className="absolute left-1/2 top-4 h-full w-px -translate-x-1/2 border-l border-dashed border-surface-300" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-surface-400">{row.label}</p>
            <p className={`truncate font-medium text-surface-800 ${compact ? 'text-[13px]' : 'text-sm'}`}>{row.title || '—'}</p>
            {row.detail && !compact && <p className="truncate text-xs text-surface-500">{row.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
