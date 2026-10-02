import { useEffect, useState } from 'react';
import { BottomSheet } from 'livreur-app';

// BottomSheet portals into #modal-root and is position:fixed. This frame owns a
// #modal-root inside a transformed box so the sheet renders within the card.
const SheetFrame = ({ children, height = 540 }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div style={{ transform: 'translateZ(0)', width: 400, height }} className="relative overflow-hidden bg-surface-50">
      <div id="modal-root" />
      {ready && children}
    </div>
  );
};

export const AvecPiedDePage = () => (
  <SheetFrame>
    <BottomSheet
      open
      onClose={() => {}}
      title="Signaler un problème"
      description="Le support TourShop sera prévenu immédiatement."
      footer={<button type="button" className="btn-accent w-full">Envoyer le signalement</button>}
    >
      <div className="space-y-2">
        {['Destinataire absent', 'Adresse introuvable', 'Colis endommagé', 'Autre problème'].map((r, i) => (
          <label key={r} className={`flex min-h-12 items-center gap-3 rounded-xl border px-3.5 text-sm ${i === 0 ? 'border-accent-500 bg-accent-50 font-semibold text-surface-900' : 'border-surface-200 text-surface-700'}`}>
            <input type="radio" name="r" defaultChecked={i === 0} className="accent-accent-600" /> {r}
          </label>
        ))}
      </div>
    </BottomSheet>
  </SheetFrame>
);
