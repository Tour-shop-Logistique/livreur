// Onglets segmentes principaux d'un ecran — `tabs`: [{ key, label, count? }].
export default function SegmentedTabs({ tabs, value, onChange }) {
  return (
    <div className="grid gap-1 rounded-xl bg-surface-100 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} role="tablist">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold transition ${
              active ? 'bg-white text-surface-900 shadow-card' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <span className="truncate">{t.label}</span>
            {t.count > 0 && (
              <span className={`tabular min-w-5 rounded-full px-1.5 text-[11px] font-bold ${active ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
