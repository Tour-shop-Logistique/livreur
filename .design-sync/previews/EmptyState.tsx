import { EmptyState, Route, CircleCheckBig, WifiOff, MapPinOff } from 'livreur-app';

export const AucuneMission = () => (
  <div className="max-w-md">
    <EmptyState
      icon={Route}
      title="Aucune mission en cours"
      description="Les demandes ouvertes près de vous apparaissent dans l'onglet Demandes."
      action={<button type="button" className="btn-primary">Voir les demandes</button>}
    />
  </div>
);

export const Tons = () => (
  <div className="grid max-w-2xl grid-cols-3 gap-3">
    <EmptyState compact tone="success" icon={CircleCheckBig} title="Tout est livré" description="Bravo pour aujourd'hui !" />
    <EmptyState compact tone="warning" icon={MapPinOff} title="Localisation désactivée" />
    <EmptyState compact tone="error" icon={WifiOff} title="Hors connexion" description="Vérifiez votre réseau." />
  </div>
);
