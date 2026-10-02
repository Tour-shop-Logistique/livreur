import { PasswordInput, FormField } from 'livreur-app';

export const Default = () => (
  <div className="max-w-sm space-y-4">
    <FormField label="Mot de passe" htmlFor="p1">
      <PasswordInput id="p1" defaultValue="secret123" />
    </FormField>
    <FormField label="Confirmer le mot de passe" htmlFor="p2">
      <PasswordInput id="p2" placeholder="Saisissez à nouveau" />
    </FormField>
  </div>
);
