import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CountrySelectSheet from './CountrySelectSheet';
import { findCountry } from '../../utils/countries';
import { getPhoneLengthHint } from '../../utils/phone';

// Indicatif pays (liste complete de client-app, avec recherche) + numero national.
export default function PhoneInput({ id, country, onCountryChange, value, onChange, invalid = false, lockCountry = false, showHint = true }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const current = findCountry(country);
  const hint = showHint ? getPhoneLengthHint(current.code) : '';

  return (
    <>
      <div className={`flex overflow-hidden rounded-xl border bg-white transition focus-within:ring-4 ${
        invalid ? 'border-danger-500 focus-within:ring-danger-100' : 'border-surface-200 focus-within:border-primary-500 focus-within:ring-primary-100'
      }`}>
        <button
          type="button"
          onClick={() => !lockCountry && setPickerOpen(true)}
          disabled={lockCountry}
          className="flex shrink-0 items-center gap-1.5 border-r border-surface-200 bg-surface-50 pl-3 pr-2.5 text-sm font-medium text-surface-700 transition hover:bg-surface-100 disabled:cursor-default disabled:hover:bg-surface-50"
          aria-label={`Indicatif : ${current.nom} ${current.indicatif}${lockCountry ? '' : ', modifier'}`}
        >
          <span className="text-lg leading-none" aria-hidden="true">{current.flag}</span>
          <span className="tabular">{current.indicatif}</span>
          {!lockCountry && <ChevronDown size={15} className="text-surface-400" aria-hidden="true" />}
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="07 00 00 00 00"
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-surface-500">Numéro national : {hint}</p>}

      {!lockCountry && (
        <CountrySelectSheet
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          currentCode={current.code}
          onSelect={(c) => onCountryChange?.(c.code)}
          title="Indicatif du pays"
        />
      )}
    </>
  );
}
