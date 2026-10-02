import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { FlaskConical, Hourglass, MailWarning, AlertCircle } from 'lucide-react';
import AuthShell from '../../components/common/AuthShell';
import FormField from '../../components/common/FormField';
import Callout from '../../components/common/Callout';
import PasswordInput from '../../components/common/PasswordInput';
import PhoneInput from '../../components/common/PhoneInput';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import { loginLivreur, devBypassLogin, clearAuthError } from '../../store/slices/authSlice';
import { ROUTES } from '../../routes';
import { findCountry, DEFAULT_COUNTRY } from '../../utils/countries';
import { nationalPhone } from '../../utils/phone';
import ButtonLabel from '../../components/common/ButtonLabel';

// Dernier pays choisi a la connexion (confort : pre-selection au prochain lancement).
const COUNTRY_KEY = 'livreur_login_country';
const loadCountry = () => {
  try {
    return findCountry(localStorage.getItem(COUNTRY_KEY)).code;
  } catch {
    return DEFAULT_COUNTRY.code;
  }
};
const saveCountry = (code) => {
  try {
    localStorage.setItem(COUNTRY_KEY, code);
  } catch {
    // non bloquant
  }
};

const METHODS = [
  { key: 'telephone', label: 'Téléphone' },
  { key: 'email', label: 'Email' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, errorKind, fieldErrors } = useSelector((state) => state.auth);
  const [method, setMethod] = useState('telephone');
  const [country, setCountryState] = useState(loadCountry);
  const setCountry = (code) => { setCountryState(code); saveCountry(code); };
  const [form, setForm] = useState({ email: '', telephone: '', password: '' });
  const loading = status === 'loading';

  const set = (name) => (value) => setForm((f) => ({ ...f, [name]: value }));

  // Comme client-app : l'API attend le numero national seul (tel que stocke a
  // l'inscription, sans indicatif). Le pays sert au format et a l'indication.
  const credentials = () => (method === 'email'
    ? { email: form.email.trim(), password: form.password }
    : { telephone: nationalPhone(form.telephone), password: form.password });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const creds = credentials();
    const result = await dispatch(loginLivreur(creds));
    if (loginLivreur.fulfilled.match(result)) {
      toast.success('Bienvenue !');
      navigate(location.state?.from?.pathname || ROUTES.HOME, { replace: true });
      return;
    }
    if (result.payload?.kind === 'unverified' && creds.email) {
      navigate(ROUTES.VERIFY_EMAIL, { state: { email: creds.email, credentials: creds } });
    }
  };

  // Porte derobee de developpement (bloc elimine du build de production).
  const handleDevBypass = () => {
    dispatch(devBypassLogin());
    toast.message('Session de démonstration activée (données non réelles).');
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <AuthShell
      title="Connexion livreur"
      subtitle="Accédez à vos missions, livraisons et gains."
      footer={(
        <div className="space-y-3 text-center">
          <p className="text-sm text-surface-500">
            Pas encore livreur TourShop ?{' '}
            <Link to={ROUTES.REGISTER} className="font-semibold text-primary-600 hover:text-primary-700">Créer un compte</Link>
          </p>
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleDevBypass}
              className="btn-secondary w-full border-dashed border-warning-300 bg-warning-50 text-warning-800 hover:bg-warning-100"
            >
              <FlaskConical size={16} /> Accéder sans connexion (dev uniquement)
            </button>
          )}
        </div>
      )}
    >
      {errorKind === 'inactive' && (
        <Callout
          tone="warning"
          icon={Hourglass}
          title="Compte en cours de validation"
          className="mb-5"
          action={(
            <Link to={ROUTES.PENDING_VALIDATION} state={{ credentials: credentials() }} className="font-semibold text-warning-800 underline underline-offset-2">
              Suivre ma demande
            </Link>
          )}
        >
          Notre équipe vérifie vos documents. Vous pourrez vous connecter dès leur validation.
        </Callout>
      )}
      {errorKind === 'unverified' && (
        <Callout
          tone="info"
          icon={MailWarning}
          title="Email non vérifié"
          className="mb-5"
          action={<Link to={ROUTES.VERIFY_EMAIL} className="font-semibold text-primary-800 underline underline-offset-2">Vérifier mon email</Link>}
        >
          Saisissez le code reçu par email pour continuer.
        </Callout>
      )}
      {error && !errorKind && (
        <Callout tone="danger" icon={AlertCircle} role="alert" className="mb-5">{error}</Callout>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <SegmentedTabs tabs={METHODS} value={method} onChange={(m) => { setMethod(m); dispatch(clearAuthError()); }} />

        {method === 'email' ? (
          <FormField label="Adresse email" htmlFor="email" error={errorKind ? null : fieldErrors?.email?.[0]}>
            <input
              id="email" type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.com"
              className="input-field" value={form.email} onChange={(e) => set('email')(e.target.value)} required
            />
          </FormField>
        ) : (
          <FormField label="Numéro de téléphone" htmlFor="telephone" error={fieldErrors?.telephone?.[0]}>
            <PhoneInput id="telephone" country={country} onCountryChange={setCountry} value={form.telephone} onChange={set('telephone')} />
          </FormField>
        )}

        <FormField label="Mot de passe" htmlFor="password" error={fieldErrors?.password?.[0]}>
          <PasswordInput id="password" autoComplete="current-password" value={form.password} onChange={(e) => set('password')(e.target.value)} required />
        </FormField>

        <div className="flex justify-end">
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm font-medium text-primary-600 hover:text-primary-700">Mot de passe oublié ?</Link>
        </div>

        <button type="submit" aria-busy={loading} className="btn-primary btn-lg w-full" disabled={loading}>
          <ButtonLabel loading={loading} loadingLabel="Connexion…">Se connecter</ButtonLabel>
        </button>
      </form>
    </AuthShell>
  );
}
