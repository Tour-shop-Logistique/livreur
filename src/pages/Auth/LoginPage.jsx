import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { FlaskConical, Hourglass, MailWarning, AlertCircle } from 'lucide-react';
import AuthShell from '../../components/common/AuthShell';
import FormField from '../../components/common/FormField';
import PasswordInput from '../../components/common/PasswordInput';
import PhoneInput from '../../components/common/PhoneInput';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import { loginLivreur, devBypassLogin, clearAuthError } from '../../store/slices/authSlice';
import { ROUTES } from '../../routes';
import { findCountry, DEFAULT_COUNTRY } from '../../utils/countries';
import { nationalPhone } from '../../utils/phone';

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
        <div className="mb-5 flex gap-3 rounded-2xl border border-warning-200 bg-warning-50 p-4">
          <Hourglass size={20} className="mt-0.5 shrink-0 text-warning-700" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-warning-800">Compte en cours de validation</p>
            <p className="mt-0.5 text-warning-700">Notre équipe vérifie vos documents. Vous pourrez vous connecter dès leur validation.</p>
            <Link to={ROUTES.PENDING_VALIDATION} state={{ credentials: credentials() }} className="mt-2 inline-block font-semibold text-warning-800 underline underline-offset-2">
              Suivre ma demande
            </Link>
          </div>
        </div>
      )}
      {errorKind === 'unverified' && (
        <div className="mb-5 flex gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4">
          <MailWarning size={20} className="mt-0.5 shrink-0 text-primary-700" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-primary-800">Email non vérifié</p>
            <p className="mt-0.5 text-primary-700">Saisissez le code reçu par email pour continuer.</p>
            <Link to={ROUTES.VERIFY_EMAIL} className="mt-2 inline-block font-semibold text-primary-800 underline underline-offset-2">Vérifier mon email</Link>
          </div>
        </div>
      )}
      {error && !errorKind && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-danger-50 p-3.5 text-sm text-danger-700" role="alert">
          <AlertCircle size={18} className="mt-px shrink-0" aria-hidden="true" /> {error}
        </div>
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

        <button type="submit" className="btn-primary btn-lg w-full" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthShell>
  );
}
