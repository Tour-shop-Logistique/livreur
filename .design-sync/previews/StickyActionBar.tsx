import { StickyActionBar, Navigation } from 'livreur-app';

const Frame = ({ children }) => <div className="max-w-md bg-surface-50 pt-6">{children}</div>;

export const ActionPrincipale = () => (
  <Frame>
    <StickyActionBar hint="Étape 2 sur 4 · Colis à récupérer chez l'expéditeur">
      <button type="button" className="btn-accent btn-lg flex-1">J'ai récupéré le colis</button>
    </StickyActionBar>
  </Frame>
);

export const DeuxActions = () => (
  <Frame>
    <StickyActionBar>
      <button type="button" className="btn-secondary flex-1"><Navigation size={18} /> Itinéraire</button>
      <button type="button" className="btn-accent flex-[2]">Valider la livraison</button>
    </StickyActionBar>
  </Frame>
);
