// Onglets segmentes principaux d'un ecran — `tabs`: [{ key, label, count? }].
// Au-dela de 3 onglets (mode dense), le compteur passe en pastille d'angle
// (comme la BottomNav) pour laisser toute la largeur au libelle sur 360px.
export default function SegmentedTabs({ tabs, value, onChange }) {
  const dense = tabs.length > 3;

  return (
    <div className="grid gap-1 rounded-2xl bg-[#e9ecf4] p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} role="tablist">
      {tabs.map((t) => {
        const active = t.key === value;
        const hasCount = t.count > 0;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={hasCount ? `${t.label}, ${t.count}` : undefined}
            onClick={() => onChange(t.key)}
            className={`relative flex min-h-10 items-center justify-center gap-1.5 rounded-xl font-bold transition ${
              dense ? 'px-0.5 text-xs' : 'px-2 text-label'
            } ${active ? 'bg-navy-900 text-white' : 'text-surface-500 hover:text-navy-900'}`}
          >
            <span className="truncate">{t.label}</span>
            {hasCount && (
              <span
                className={`tabular rounded-full font-bold ${
                  dense
                    ? 'absolute -right-1 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center px-1 text-micro leading-none ring-2 ring-[#e9ecf4]'
                    : 'min-w-5 px-1.5 text-caption'
                } ${active ? 'bg-accent-400 text-accent-900' : dense ? 'bg-navy-700 text-white' : 'bg-white text-surface-600'}`}
                aria-hidden="true"
              >
                {t.count > 99 ? '99+' : t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
