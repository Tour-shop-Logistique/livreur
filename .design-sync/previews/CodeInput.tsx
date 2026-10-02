import { useState } from 'react';
import { CodeInput } from 'livreur-app';

export const CodeRemise = () => {
  const [v, setV] = useState('48');
  return (
    <div className="max-w-sm space-y-2 text-center">
      <p className="text-sm font-medium text-surface-700">Code de remise donné par le destinataire</p>
      <CodeInput value={v} onChange={setV} label="Code de remise" />
    </div>
  );
};

export const VerificationEmail = () => {
  const [v, setV] = useState('482713');
  return (
    <div className="max-w-sm">
      <CodeInput length={6} value={v} onChange={setV} label="Code de vérification" />
    </div>
  );
};

export const Invalide = () => (
  <div className="max-w-sm space-y-2 text-center">
    <CodeInput value="1234" onChange={() => {}} invalid />
    <p className="field-error">Code incorrect, demandez-le à nouveau au destinataire.</p>
  </div>
);
