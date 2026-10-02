import { useEffect, useState } from 'react';
import { CountrySelectSheet } from 'livreur-app';

// The sheet portals into #modal-root and is position:fixed; this frame keeps it inside the card.
const SheetFrame = ({ children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div style={{ transform: 'translateZ(0)', width: 400, height: 620 }} className="relative overflow-hidden bg-surface-50">
      <div id="modal-root" />
      {ready && children}
    </div>
  );
};

export const Liste = () => (
  <SheetFrame>
    <CountrySelectSheet open onClose={() => {}} currentCode="CI" onSelect={() => {}} title="Indicatif du pays" />
  </SheetFrame>
);
