import { SignaturePad } from 'livreur-app';

export const Vide = () => (
  <div className="max-w-sm">
    <p className="label">Signature du destinataire</p>
    <SignaturePad onChange={() => {}} />
  </div>
);
