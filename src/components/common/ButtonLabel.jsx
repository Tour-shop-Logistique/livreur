import { Loader2 } from 'lucide-react';

// Contenu d'un bouton .btn-* avec etat d'envoi : spinner + libelle d'attente.
// Le bouton parent porte `disabled` et `aria-busy`.
export default function ButtonLabel({ loading, loadingLabel = 'Envoi…', children }) {
  if (!loading) return children;
  return (
    <>
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      {loadingLabel}
    </>
  );
}
