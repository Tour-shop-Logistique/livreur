import { AuthShell, FormField, PasswordInput } from 'livreur-app';

export const Connexion = () => (
  <div style={{ width: 400, height: 620 }} className="overflow-hidden border border-surface-100">
    <AuthShell
      title="Bon retour !"
      subtitle="Connectez-vous pour voir vos missions du jour."
      footer={<p className="text-center text-sm text-surface-500">Pas encore livreur ? <span className="font-semibold text-primary-600">Créer un compte</span></p>}
    >
      <div className="space-y-4">
        <FormField label="Email" htmlFor="email">
          <input id="email" className="input-field" defaultValue="koffi.yao@mail.ci" />
        </FormField>
        <FormField label="Mot de passe" htmlFor="pwd">
          <PasswordInput id="pwd" defaultValue="motdepasse" />
        </FormField>
        <button type="button" className="btn-primary btn-lg w-full">Se connecter</button>
      </div>
    </AuthShell>
  </div>
);
