import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Bike, Car, AlertCircle, ShieldCheck, ChevronDown } from 'lucide-react';
import AuthShell from '../../components/common/AuthShell';
import FormField from '../../components/common/FormField';
import Callout from '../../components/common/Callout';
import PasswordInput from '../../components/common/PasswordInput';
import PhoneInput from '../../components/common/PhoneInput';
import FilePicker from '../../components/common/FilePicker';
import ChoiceGroup from '../../components/common/ChoiceGroup';
import CountrySelectSheet from '../../components/common/CountrySelectSheet';
import { registerLivreur, clearAuthError } from '../../store/slices/authSlice';
import { ROUTES } from '../../routes';
import { DEFAULT_COUNTRY, findCountry } from '../../utils/countries';
import { nationalPhone, displayPhone } from '../../utils/phone';
import ButtonLabel from '../../components/common/ButtonLabel';

// Inscription self-service avec verification KYC (PARCOURS_LIVREUR_API.md §1).
// POST /register-livreur en multipart. Le compte reste inactif jusqu'a la
// validation des documents par le backoffice.

const STEPS = [
  { key: 'identite', label: 'Identité', fields: ['nom', 'prenoms', 'telephone', 'indicatif_telephone', 'email', 'code_pays'] },
  { key: 'piece', label: 'Pièce', fields: ['type_piece_identite', 'numero_piece_identite', 'piece_identite', 'photo_profil'] },
  { key: 'vehicule', label: 'Véhicule', fields: ['type_vehicule', 'numero_vehicule', 'permis_de_conduire', 'zone_de_livraison_km'] },
  { key: 'securite', label: 'Sécurité', fields: ['password', 'password_confirmation'] },
];

const PIECES = [
  { value: 'cni', label: "Carte d'identité" },
  { value: 'passeport', label: 'Passeport' },
  { value: 'permis_conduire', label: 'Permis de conduire' },
];

const VEHICULES = [
  { value: 'moto', label: 'Moto', icon: Bike },
  { value: 'voiture', label: 'Voiture', icon: Car },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Stepper({ current }) {
  return (
    <ol className="mb-7 flex items-center gap-2" aria-label="Étapes de l'inscription">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.key} className="flex flex-1 flex-col gap-1.5">
            <span className={`h-1.5 rounded-full transition-colors ${done || active ? 'bg-primary-600' : 'bg-surface-200'}`} />
            <span className={`text-caption font-medium ${active ? 'text-primary-700' : done ? 'text-surface-600' : 'text-surface-500'}`}>
              {i + 1}. {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, fieldErrors } = useSelector((state) => state.auth);
  const loading = status === 'loading';
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [form, setForm] = useState({
    nom: '', prenoms: '', codePays: DEFAULT_COUNTRY.code, telephone: '', email: '',
    typePieceIdentite: 'cni', numeroPieceIdentite: '', pieceIdentite: null, photoProfil: null,
    typeVehicule: 'moto', numeroVehicule: '', permisDeConduire: '', zoneDeLivraisonKm: '',
    password: '', passwordConfirmation: '', acceptTerms: false,
  });

  const set = (name) => (value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const setInput = (name) => (e) => set(name)(e.target.value);

  // Erreur locale en priorite, sinon erreur serveur (cle snake_case Laravel).
  const err = (localKey, apiKey) => errors[localKey] || fieldErrors?.[apiKey]?.[0];

  const validateStep = (index) => {
    const e = {};
    if (index === 0) {
      if (!form.nom.trim()) e.nom = 'Votre nom est requis.';
      if (form.telephone.replace(/\D/g, '').length < 6) e.telephone = 'Numéro de téléphone invalide.';
      if (!EMAIL_RE.test(form.email.trim())) e.email = 'Adresse email invalide.';
    }
    if (index === 1) {
      if (!form.numeroPieceIdentite.trim()) e.numeroPieceIdentite = 'Le numéro de la pièce est requis.';
      if (!form.pieceIdentite) e.pieceIdentite = "La photo de la pièce d'identité est requise.";
    }
    if (index === 2) {
      if (form.zoneDeLivraisonKm !== '' && Number(form.zoneDeLivraisonKm) < 0) e.zoneDeLivraisonKm = 'Valeur invalide.';
    }
    if (index === 3) {
      if (form.password.length < 8) e.password = '8 caractères minimum.';
      if (form.password !== form.passwordConfirmation) e.passwordConfirmation = 'Les mots de passe ne correspondent pas.';
      if (!form.acceptTerms) e.acceptTerms = 'Vous devez accepter les conditions pour continuer.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    dispatch(clearAuthError());
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) { next(); return; }
    if (!validateStep(step)) return;

    const country = findCountry(form.codePays);
    // Comme client-app : numero national dans `telephone`, indicatif a part.
    const telephone = nationalPhone(form.telephone);
    const email = form.email.trim();
    const result = await dispatch(registerLivreur({
      nom: form.nom.trim(),
      prenoms: form.prenoms.trim(),
      telephone,
      indicatifTelephone: country.indicatif,
      email,
      password: form.password,
      passwordConfirmation: form.passwordConfirmation,
      codePays: country.code,
      typePieceIdentite: form.typePieceIdentite,
      numeroPieceIdentite: form.numeroPieceIdentite.trim(),
      pieceIdentite: form.pieceIdentite,
      photoProfil: form.photoProfil,
      typeVehicule: form.typeVehicule,
      numeroVehicule: form.numeroVehicule.trim(),
      permisDeConduire: form.permisDeConduire.trim(),
      zoneDeLivraisonKm: form.zoneDeLivraisonKm,
    }));

    if (registerLivreur.fulfilled.match(result)) {
      toast.success('Inscription reçue. Vérifiez votre email.');
      navigate(ROUTES.VERIFY_EMAIL, { state: { email, credentials: { telephone, password: form.password } } });
      return;
    }
    // Revenir a l'etape qui contient le premier champ en erreur cote serveur.
    const apiErrors = result.payload?.fieldErrors;
    if (apiErrors) {
      const target = STEPS.findIndex((s) => s.fields.some((f) => apiErrors[f]));
      if (target >= 0) setStep(target);
    }
  };

  const country = findCountry(form.codePays);

  return (
    <AuthShell
      title="Devenir livreur TourShop"
      subtitle="Inscription en 4 étapes. Votre compte sera activé après vérification de vos documents."
      backTo={step === 0 ? ROUTES.LOGIN : undefined}
      footer={(
        <p className="text-center text-sm text-surface-500">
          Déjà inscrit ?{' '}
          <Link to={ROUTES.LOGIN} className="font-semibold text-primary-600 hover:text-primary-700">Se connecter</Link>
        </p>
      )}
    >
      <Stepper current={step} />

      {error && <Callout tone="danger" icon={AlertCircle} role="alert" className="mb-5">{error}</Callout>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {step === 0 && (
          <div className="animate-slide-up space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nom" htmlFor="nom" error={err('nom', 'nom')}>
                <input id="nom" autoComplete="family-name" className={`input-field ${err('nom', 'nom') ? 'input-error' : ''}`} value={form.nom} onChange={setInput('nom')} />
              </FormField>
              <FormField label="Prénoms" htmlFor="prenoms" optional>
                <input id="prenoms" autoComplete="given-name" className="input-field" value={form.prenoms} onChange={setInput('prenoms')} />
              </FormField>
            </div>
            <FormField label="Pays d'exercice" htmlFor="pays" error={err('codePays', 'code_pays')} hint="Détermine l'équipe TourShop qui validera votre dossier.">
              <button
                id="pays"
                type="button"
                onClick={() => setCountryPickerOpen(true)}
                className={`input-field flex items-center gap-2.5 text-left ${err('codePays', 'code_pays') ? 'input-error' : ''}`}
              >
                <span className="text-lg leading-none" aria-hidden="true">{country.flag}</span>
                <span className="min-w-0 flex-1 truncate">{country.nom}</span>
                <ChevronDown size={16} className="shrink-0 text-surface-400" aria-hidden="true" />
              </button>
            </FormField>
            <FormField label="Téléphone" htmlFor="telephone" error={err('telephone', 'telephone')}>
              <PhoneInput id="telephone" country={form.codePays} lockCountry value={form.telephone} onChange={set('telephone')} invalid={Boolean(err('telephone', 'telephone'))} />
            </FormField>
            <FormField label="Email" htmlFor="email" error={err('email', 'email')} hint="Un code de vérification vous sera envoyé.">
              <input id="email" type="email" inputMode="email" autoComplete="email" className={`input-field ${err('email', 'email') ? 'input-error' : ''}`} value={form.email} onChange={setInput('email')} />
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div className="animate-slide-up space-y-4">
            <FormField label="Type de pièce d'identité" error={err('typePieceIdentite', 'type_piece_identite')}>
              <ChoiceGroup label="Type de pièce d'identité" options={PIECES} value={form.typePieceIdentite} onChange={set('typePieceIdentite')} columns={3} />
            </FormField>
            <FormField label="Numéro de la pièce" htmlFor="numero-piece" error={err('numeroPieceIdentite', 'numero_piece_identite')}>
              <input id="numero-piece" maxLength={100} className={`input-field uppercase ${err('numeroPieceIdentite', 'numero_piece_identite') ? 'input-error' : ''}`} value={form.numeroPieceIdentite} onChange={setInput('numeroPieceIdentite')} />
            </FormField>
            <FormField label="Photo de la pièce d'identité" error={err('pieceIdentite', 'piece_identite')} hint="Recto lisible, sans reflet.">
              <FilePicker id="piece-identite" value={form.pieceIdentite} onChange={set('pieceIdentite')} label="Photographier la pièce" capture="environment" invalid={Boolean(err('pieceIdentite', 'piece_identite'))} />
            </FormField>
            <FormField label="Photo de profil" optional error={err('photoProfil', 'photo_profil')}>
              <FilePicker id="photo-profil" value={form.photoProfil} onChange={set('photoProfil')} label="Ajouter une photo de vous" capture="user" />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up space-y-4">
            <FormField label="Type de véhicule" error={err('typeVehicule', 'type_vehicule')}>
              <ChoiceGroup label="Type de véhicule" options={VEHICULES} value={form.typeVehicule} onChange={set('typeVehicule')} size="lg" />
            </FormField>
            <FormField label="Immatriculation" htmlFor="numero-vehicule" optional error={err('numeroVehicule', 'numero_vehicule')}>
              <input id="numero-vehicule" placeholder="AB-1234-CI" className="input-field uppercase" value={form.numeroVehicule} onChange={setInput('numeroVehicule')} />
            </FormField>
            <FormField label="Numéro de permis de conduire" htmlFor="permis" optional error={err('permisDeConduire', 'permis_de_conduire')}>
              <input id="permis" className="input-field uppercase" value={form.permisDeConduire} onChange={setInput('permisDeConduire')} />
            </FormField>
            <FormField label="Rayon d'intervention" htmlFor="zone" optional error={err('zoneDeLivraisonKm', 'zone_de_livraison_km')}>
              <div className="relative">
                <input id="zone" type="number" min="0" inputMode="numeric" placeholder="15" className="input-field pr-12" value={form.zoneDeLivraisonKm} onChange={setInput('zoneDeLivraisonKm')} />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-surface-400">km</span>
              </div>
            </FormField>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up space-y-4">
            <FormField label="Mot de passe" htmlFor="password" error={err('password', 'password')} hint="8 caractères minimum.">
              <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={setInput('password')} className={err('password', 'password') ? 'input-error' : ''} />
            </FormField>
            <FormField label="Confirmer le mot de passe" htmlFor="password-confirmation" error={err('passwordConfirmation', 'password_confirmation')}>
              <PasswordInput id="password-confirmation" autoComplete="new-password" value={form.passwordConfirmation} onChange={setInput('passwordConfirmation')} className={err('passwordConfirmation') ? 'input-error' : ''} />
            </FormField>

            <div className="rounded-2xl bg-surface-50 p-4 text-sm">
              <p className="mb-2 font-semibold text-surface-800">Récapitulatif</p>
              <dl className="space-y-1.5 text-surface-600">
                <div className="flex justify-between gap-3"><dt>Nom</dt><dd className="truncate font-medium text-surface-800">{[form.prenoms, form.nom].filter(Boolean).join(' ')}</dd></div>
                <div className="flex justify-between gap-3"><dt>Téléphone</dt><dd className="tabular font-medium text-surface-800">{displayPhone(country.indicatif, nationalPhone(form.telephone))}</dd></div>
                <div className="flex justify-between gap-3"><dt>Pays</dt><dd className="font-medium text-surface-800">{country.nom}</dd></div>
                <div className="flex justify-between gap-3"><dt>Pièce</dt><dd className="font-medium text-surface-800">{PIECES.find((p) => p.value === form.typePieceIdentite)?.label}</dd></div>
                <div className="flex justify-between gap-3"><dt>Véhicule</dt><dd className="font-medium capitalize text-surface-800">{form.typeVehicule}</dd></div>
              </dl>
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-surface-600">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                checked={form.acceptTerms}
                onChange={(e) => set('acceptTerms')(e.target.checked)}
              />
              <span>Je certifie l'exactitude des informations fournies et j'accepte que TourShop vérifie mes documents.</span>
            </label>
            {errors.acceptTerms && <p className="field-error">{errors.acceptTerms}</p>}

            <p className="flex items-start gap-2 text-xs leading-relaxed text-surface-500">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-success-600" aria-hidden="true" />
              Vos documents sont uniquement utilisés pour vérifier votre identité.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <button type="button" className="btn-secondary btn-lg flex-1" onClick={back} disabled={loading}>Retour</button>
          )}
          <button type="submit" aria-busy={loading} className="btn-primary btn-lg flex-[2]" disabled={loading}>
            <ButtonLabel loading={loading} loadingLabel="Envoi du dossier…">{step < STEPS.length - 1 ? 'Continuer' : 'Envoyer mon inscription'}</ButtonLabel>
          </button>
        </div>
      </form>

      <CountrySelectSheet
        open={countryPickerOpen}
        onClose={() => setCountryPickerOpen(false)}
        currentCode={form.codePays}
        onSelect={(c) => set('codePays')(c.code)}
        title="Pays d'exercice"
        description="Votre dossier sera validé par l'équipe TourShop de ce pays."
      />
    </AuthShell>
  );
}
