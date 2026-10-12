// Progression horizontale compacte : un segment par etape. `current` = index de
// la derniere etape terminee ; l'etape suivante est marquee "en cours".
export default function StepBar({ steps, current, showLabels = false }) {
  const next = Math.min(current + 1, steps.length - 1);
  const label = current >= steps.length - 1
    ? 'Toutes les étapes sont terminées'
    : `Étape ${next + 1} sur ${steps.length} : ${steps[next]?.label}`;

  return (
    <ol className={`grid gap-1.5 ${showLabels ? 'items-start' : ''}`} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label={label}>
      {steps.map((step, i) => {
        const done = i <= current;
        const isNext = i === current + 1;
        return (
          <li key={step.key} className="flex min-w-0 flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-full ${done ? 'bg-primary-600' : isNext ? 'bg-primary-300' : 'bg-surface-200'}`}
              aria-hidden="true"
            />
            {showLabels && (
              <span className={`text-caption leading-tight ${isNext ? 'font-bold text-primary-700' : done ? 'font-medium text-surface-600' : 'text-surface-500'}`} aria-hidden="true">
                {step.short || step.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
