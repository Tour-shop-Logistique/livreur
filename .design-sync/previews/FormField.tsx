import { FormField } from 'livreur-app';

export const Etats = () => (
  <div className="max-w-sm space-y-4">
    <FormField label="Nom complet" htmlFor="nom" hint="Tel qu'il apparaît sur votre pièce d'identité">
      <input id="nom" className="input-field" defaultValue="Koffi Yao" />
    </FormField>
    <FormField label="Plaque d'immatriculation" htmlFor="plaque" optional>
      <input id="plaque" className="input-field" placeholder="Ex. 1234 AB 01" />
    </FormField>
    <FormField label="Email" htmlFor="mail" error="Cette adresse email est déjà utilisée.">
      <input id="mail" className="input-field input-error" defaultValue="koffi.yao@mail.ci" />
    </FormField>
  </div>
);
