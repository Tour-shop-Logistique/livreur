import { useState } from 'react';
import { PhoneInput, FormField } from 'livreur-app';

export const Default = () => {
  const [country, setCountry] = useState('CI');
  const [value, setValue] = useState('07 12 34 56 78');
  return (
    <div className="max-w-sm">
      <FormField label="Téléphone" htmlFor="tel">
        <PhoneInput id="tel" country={country} onCountryChange={setCountry} value={value} onChange={setValue} />
      </FormField>
    </div>
  );
};

export const InvalideEtVerrouille = () => (
  <div className="max-w-sm space-y-4">
    <FormField label="Téléphone" htmlFor="t1" error="Numéro incomplet">
      <PhoneInput id="t1" country="SN" value="77 12" onChange={() => {}} invalid showHint={false} />
    </FormField>
    <FormField label="Téléphone du compte" htmlFor="t2">
      <PhoneInput id="t2" country="CI" value="07 12 34 56 78" onChange={() => {}} lockCountry showHint={false} />
    </FormField>
  </div>
);
