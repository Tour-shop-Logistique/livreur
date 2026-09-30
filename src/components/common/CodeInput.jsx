import { useRef } from 'react';

// Saisie d'un code numerique case par case (4 chiffres pour la remise, 6 pour
// la verification email). Collage d'un code complet pris en charge.
export default function CodeInput({ length = 4, value, onChange, autoFocus = false, invalid = false, label = 'Code' }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setAt = (index, char) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (index) => (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setAt(index, ''); return; }
    if (raw.length > 1) {
      const merged = (digits.slice(0, index).join('') + raw).slice(0, length);
      onChange(merged);
      refs.current[Math.min(merged.length, length - 1)]?.focus();
      return;
    }
    setAt(index, raw);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index) => (e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      setAt(index - 1, '');
    }
  };

  return (
    <div className="flex justify-center gap-2.5" role="group" aria-label={label}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={d}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onFocus={(e) => e.target.select()}
          autoFocus={autoFocus && i === 0}
          aria-label={`${label}, chiffre ${i + 1}`}
          className={`tabular h-14 w-12 rounded-xl border bg-white text-center text-2xl font-semibold text-surface-900 transition focus:outline-none focus:ring-4 ${
            invalid
              ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-100'
              : 'border-surface-200 focus:border-primary-500 focus:ring-primary-100'
          }`}
        />
      ))}
    </div>
  );
}
