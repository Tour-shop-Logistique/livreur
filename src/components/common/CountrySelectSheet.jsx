import { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { searchCountries } from '../../utils/countries';

// Selecteur de pays avec recherche (nom, code ISO ou indicatif), meme liste
// que client-app. `onSelect(country)` recoit { code, nom, indicatif, flag }.
export default function CountrySelectSheet({ open, onClose, currentCode, onSelect, title = 'Choisissez votre pays', description }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchCountries(query), [query]);

  const select = (country) => {
    onSelect(country);
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={() => { setQuery(''); onClose(); }} title={title} description={description}>
      <div className="sticky top-0 z-10 -mx-5 bg-white px-5 pb-3">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" aria-hidden="true" />
          <input
            type="search"
            className="input-field pl-10"
            placeholder="Rechercher un pays ou un indicatif"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un pays"
            autoFocus
          />
        </div>
      </div>

      {results.length === 0 ? (
        <p className="py-8 text-center text-sm text-surface-500">Aucun pays trouvé.</p>
      ) : (
        <ul className="divide-y divide-surface-100 overflow-hidden rounded-xl border border-surface-100">
          {results.map((c) => {
            const active = c.code === currentCode;
            return (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => select(c)}
                  className={`flex min-h-12 w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition hover:bg-surface-50 ${active ? 'bg-primary-50/60' : ''}`}
                  aria-pressed={active}
                >
                  <span className="text-xl leading-none" aria-hidden="true">{c.flag}</span>
                  <span className={`min-w-0 flex-1 truncate ${active ? 'font-semibold text-primary-700' : 'text-surface-900'}`}>{c.nom}</span>
                  <span className="tabular shrink-0 text-surface-500">{c.indicatif}</span>
                  {active && <Check size={16} className="shrink-0 text-primary-600" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
