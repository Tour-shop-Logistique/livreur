import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Chargement…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-surface-500 ${className}`} role="status">
      <Loader2 className="animate-spin text-primary-600" size={28} aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
