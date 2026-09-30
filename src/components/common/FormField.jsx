// Champ de formulaire avec label visible, aide et erreur au plus pres du champ.
export default function FormField({ label, htmlFor, error, hint, children, optional = false, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {optional && <span className="ml-1 font-normal text-surface-400">(facultatif)</span>}
        </label>
      )}
      {children}
      {error ? <p className="field-error" role="alert">{error}</p> : hint && <p className="mt-1 text-xs text-surface-500">{hint}</p>}
    </div>
  );
}
