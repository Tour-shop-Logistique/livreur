import { useState } from 'react';
import { FilePicker } from 'livreur-app';

// A real File from an inline SVG (what the picker gets from <input type="file">).
const photo = new File(
  [`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320"><rect width="600" height="320" fill="#c2a27a"/><rect x="170" y="70" width="260" height="190" rx="10" fill="#a07850"/><rect x="170" y="140" width="260" height="22" fill="#e8d5b5"/><text x="300" y="300" font-family="Arial" font-size="20" fill="white" text-anchor="middle">Colis remis</text></svg>`],
  'preuve.svg',
  { type: 'image/svg+xml', lastModified: 1 },
);

export const Vide = () => {
  const [f, setF] = useState(null);
  return (
    <div className="max-w-sm space-y-3">
      <FilePicker id="fp1" value={f} onChange={setF} label="Photo du colis remis" capture="environment" />
      <FilePicker id="fp2" value={null} onChange={() => {}} label="Pièce d'identité (recto)" />
    </div>
  );
};

export const AvecApercu = () => {
  const [f, setF] = useState(photo);
  return (
    <div className="max-w-sm">
      <FilePicker id="fp3" value={f} onChange={setF} />
    </div>
  );
};
