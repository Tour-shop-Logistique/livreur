import { useEffect, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo (contrainte API)
const ACCEPT = 'image/jpeg,image/png,image/jpg,image/webp';

// Selecteur d'image avec apercu — jpeg/png/jpg/webp, 5 Mo max (§1 et §4.3).
export default function FilePicker({ value, onChange, label = 'Ajouter une photo', capture, id, invalid = false }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!value) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handle = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) {
      setError('Format accepté : JPEG, PNG ou WEBP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image trop lourde (5 Mo maximum).');
      return;
    }
    setError(null);
    onChange(file);
  };

  const Icon = capture ? Camera : ImagePlus;

  return (
    <div>
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-surface-200 bg-surface-50">
          <img src={preview} alt="Aperçu" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-surface-900/70 text-white"
            aria-label="Retirer la photo"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-surface-50 px-4 py-5 text-center transition hover:bg-primary-50/50 ${
            invalid ? 'border-danger-400' : 'border-surface-300 hover:border-primary-300'
          }`}
        >
          <span className="icon-tile h-10 w-10 bg-white text-primary-600 shadow-card"><Icon size={20} aria-hidden="true" /></span>
          <span className="text-sm font-medium text-surface-700">{label}</span>
          <span className="text-xs text-surface-400">JPEG, PNG ou WEBP · 5 Mo max</span>
        </label>
      )}
      <input id={id} type="file" accept={ACCEPT} capture={capture} className="sr-only" onChange={handle} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
