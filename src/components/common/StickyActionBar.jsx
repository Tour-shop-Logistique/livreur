// Barre d'action collante en bas d'ecran : garde le CTA principal accessible au
// pouce quelle que soit la position de scroll (usage une main).
export default function StickyActionBar({ children, hint }) {
  return (
    <div className="safe-bottom sticky bottom-0 z-20 bg-white/95 shadow-sticky backdrop-blur">
      <div className="mx-auto max-w-md px-4 pb-3 pt-3">
        {hint && <p className="mb-2 text-center text-xs text-surface-500">{hint}</p>}
        <div className="flex gap-2">{children}</div>
      </div>
    </div>
  );
}
