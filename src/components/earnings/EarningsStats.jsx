import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SegmentedTabs from '../common/SegmentedTabs';
import { STATS_PERIODS, computeStats } from '../../utils/stats';
import { formatPrice } from '../../utils/format';

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

// Gains par jour : une seule serie (pas de legende), colonnes fines arrondies en
// tete, 2px d'air entre elles. Seule la meilleure journee est annoncee ; survol,
// tap ou fleches du clavier affichent un autre jour dans la legende. Les valeurs
// restent lisibles sans couleur via le tableau masque (lecteurs d'ecran).
function DailyGainsChart({ days }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...days.map((d) => d.gains));
  const best = max > 0 ? days.findIndex((d) => d.gains === max) : -1;
  const shown = active ?? best;
  const dense = days.length > 7;
  const tickIndexes = dense ? [0, Math.floor((days.length - 1) / 2), days.length - 1] : days.map((_, i) => i);
  const dayLabel = (d) => format(d.date, dense ? 'd MMM' : 'EEE', { locale: fr });

  const onKeyDown = (e) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const from = shown < 0 ? days.length - 1 : shown;
    setActive(Math.min(days.length - 1, Math.max(0, from + delta)));
  };

  return (
    <figure className="mt-5">
      <figcaption>
        <span className="block text-xs font-medium text-surface-500">Gains par jour</span>
        <span className="mt-0.5 block text-sm text-surface-700" aria-live="polite">
          {shown >= 0 ? (
            <>
              {active === null && 'Meilleur jour : '}
              {format(days[shown].date, active === null ? 'EEE d MMM' : 'EEEE d MMM', { locale: fr })} ·{' '}
              <span className="font-semibold text-surface-900">{formatPrice(days[shown].gains)}</span>
            </>
          ) : 'Aucun gain sur la période'}
        </span>
      </figcaption>

      <div
        className="relative mt-6 rounded-sm focus-visible:ring-offset-4"
        tabIndex={0}
        role="group"
        aria-label="Gains par jour, flèches gauche et droite pour parcourir"
        onKeyDown={onKeyDown}
        onMouseLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
      >
        {max > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-surface-100" aria-hidden="true">
            <span className="tabular absolute bottom-full right-0 mb-0.5 text-caption leading-none text-surface-500">{formatPrice(max)}</span>
          </div>
        )}
        <div className="flex h-28 items-end gap-0.5 border-b border-surface-200" aria-hidden="true">
          {days.map((d, i) => (
            <div
              key={d.date.toISOString()}
              className="flex h-full flex-1 cursor-pointer items-end justify-center"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <div
                className={`w-full max-w-6 rounded-t bg-primary-600 transition-opacity ${shown >= 0 && i !== shown && active !== null ? 'opacity-40' : ''}`}
                style={{ height: d.gains > 0 ? `${Math.max(4, (d.gains / max) * 100)}%` : 0 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-0.5" aria-hidden="true">
          {days.map((d, i) => (
            <span key={d.date.toISOString()} className="tabular flex-1 overflow-visible whitespace-nowrap text-center text-caption text-surface-500">
              {tickIndexes.includes(i) ? dayLabel(d) : ''}
            </span>
          ))}
        </div>
      </div>

      <table className="sr-only">
        <caption>Gains par jour</caption>
        <thead><tr><th scope="col">Jour</th><th scope="col">Gains</th><th scope="col">Missions</th></tr></thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date.toISOString()}>
              <td>{format(d.date, 'EEEE d MMMM', { locale: fr })}</td>
              <td>{formatPrice(d.gains)}</td>
              <td>{d.missions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// Statistiques personnelles (cahier des charges §5) : missions cloturees, gains,
// repartition par type, courses marketplace, gains quotidiens.
export default function EarningsStats({ historyItems, marketplaceItems }) {
  const [period, setPeriod] = useState('7j');
  const stats = useMemo(
    () => computeStats(historyItems, marketplaceItems, period),
    [historyItems, marketplaceItems, period]
  );

  const breakdown = [
    stats.byType.enlevement > 0 && plural(stats.byType.enlevement, 'enlèvement', 'enlèvements'),
    stats.byType.livraison > 0 && plural(stats.byType.livraison, 'livraison', 'livraisons'),
    stats.marketplace > 0 && plural(stats.marketplace, 'course marketplace', 'courses marketplace'),
  ].filter(Boolean);

  return (
    <section aria-labelledby="stats-title">
      <h2 id="stats-title" className="section-title">Statistiques</h2>
      <SegmentedTabs tabs={STATS_PERIODS.map(({ key, label }) => ({ key, label }))} value={period} onChange={setPeriod} />

      <div className="card mt-3 p-4">
        <p className="text-xs font-medium text-surface-500">Gains sur la période</p>
        <p className="mt-0.5 font-heading text-2xl font-bold text-surface-900">{formatPrice(stats.gains)}</p>

        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-50 p-3">
            <dt className="text-xs text-surface-500">Missions terminées</dt>
            <dd className="text-lg font-semibold text-surface-900">{stats.missions}</dd>
          </div>
          <div className="rounded-xl bg-surface-50 p-3">
            <dt className="text-xs text-surface-500">Gain moyen</dt>
            <dd className="text-lg font-semibold text-surface-900">{stats.missions ? formatPrice(stats.moyenne) : '—'}</dd>
          </div>
        </dl>

        {breakdown.length > 0 && <p className="mt-3 text-xs text-surface-500">{breakdown.join(' · ')}</p>}

        {stats.days && <DailyGainsChart days={stats.days} />}
      </div>
      {stats.marketplace > 0 && (
        <p className="mt-2 px-1 text-xs text-surface-500">Les courses marketplace sont réglées avec le vendeur et ne s'ajoutent pas aux gains.</p>
      )}
    </section>
  );
}
