import { useEffect, useState } from 'react';
import { OfferSheet } from 'livreur-app';

// The sheet portals into #modal-root and is position:fixed; this frame keeps it inside the card.
const SheetFrame = ({ children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div style={{ transform: 'translateZ(0)', width: 400, height: 540 }} className="relative overflow-hidden bg-surface-50">
      <div id="modal-root" />
      {ready && children}
    </div>
  );
};

export const NouvelleOffre = () => (
  <SheetFrame>
    <OfferSheet
      open
      onClose={() => {}}
      title="Proposer un tarif"
      description="Course express · Cocody → Plateau"
      onSubmit={() => {}}
      note="Le client choisit parmi les offres reçues. Vous serez notifié si la vôtre est retenue."
    />
  </SheetFrame>
);

export const ModifierOffre = () => (
  <SheetFrame>
    <OfferSheet
      open
      onClose={() => {}}
      title="Modifier mon offre"
      description="Livraison marketplace · Yopougon"
      currentOffer={2500}
      onSubmit={() => {}}
      onWithdraw={() => {}}
    />
  </SheetFrame>
);
