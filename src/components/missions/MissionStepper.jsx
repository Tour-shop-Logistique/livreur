import { Check } from 'lucide-react';

// Progression verticale du workflow. `current` = index de la derniere etape
// terminee ; l'etape suivante est mise en avant comme "en cours".
export default function MissionStepper({ steps, current }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const done = i <= current;
        const next = i === current + 1;
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? 'bg-success-600 text-white'
                    : next
                      ? 'border-2 border-accent-600 bg-white text-accent-700 ring-4 ring-accent-100'
                      : 'border-2 border-surface-200 bg-white text-surface-400'
                }`}
                aria-hidden="true"
              >
                {done ? <Check size={15} strokeWidth={3} /> : i + 1}
              </span>
              {!last && <span className={`w-0.5 flex-1 ${done ? 'bg-success-500' : 'bg-surface-200'}`} style={{ minHeight: 20 }} aria-hidden="true" />}
            </div>
            <div className={`min-w-0 ${last ? '' : 'pb-4'} pt-1`}>
              <p className={`text-sm ${done ? 'font-medium text-surface-800' : next ? 'font-semibold text-surface-900' : 'text-surface-500'}`}>
                {step.label}
              </p>
              {next && <p className="text-xs font-medium text-accent-700">Étape en cours</p>}
              <span className="sr-only">{done ? 'terminée' : next ? 'en cours' : 'à venir'}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
