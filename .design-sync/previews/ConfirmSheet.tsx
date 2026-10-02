import { useEffect, useState } from 'react';
import { ConfirmSheet } from 'livreur-app';

// The sheet portals into #modal-root and is position:fixed; this frame keeps it inside the card.
const SheetFrame = ({ children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div style={{ transform: 'translateZ(0)', width: 400, height: 400 }} className="relative overflow-hidden bg-surface-50">
      <div id="modal-root" />
      {ready && children}
    </div>
  );
};

export const Demarrer = () => (
  <SheetFrame>
    <ConfirmSheet
      open
      onClose={() => {}}
      onConfirm={() => {}}
      title="Démarrer la mission ?"
      description="L'expéditeur sera prévenu que vous êtes en route."
      confirmLabel="Je suis en route"
    />
  </SheetFrame>
);

export const AvecErreur = () => (
  <SheetFrame>
    <ConfirmSheet
      open
      onClose={() => {}}
      onConfirm={() => {}}
      title="Confirmer le dépôt à l'agence"
      description="Agence TourShop Plateau"
      confirmLabel="Confirmer le dépôt"
      error="Connexion perdue. Réessayez dans un instant."
    />
  </SheetFrame>
);
