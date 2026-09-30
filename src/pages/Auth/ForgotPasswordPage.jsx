import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import AuthShell from '../../components/common/AuthShell';
import FormField from '../../components/common/FormField';
import { forgotPassword, clearAuthError } from '../../store/slices/authSlice';
import { ROUTES } from '../../routes';

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const loading = status === 'loading';

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(forgotPassword(email.trim()));
    if (forgotPassword.fulfilled.match(result)) {
      toast.success('Code de réinitialisation envoyé par email.');
      navigate(ROUTES.RESET_PASSWORD, { state: { email: email.trim() } });
    }
  };

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Recevez un code par email pour définir un nouveau mot de passe."
      backTo={ROUTES.LOGIN}
      footer={<p className="text-center text-sm"><Link to={ROUTES.LOGIN} className="font-semibold text-primary-600">Retour à la connexion</Link></p>}
    >
      <div className="mb-6 flex justify-center">
        <span className="icon-tile h-16 w-16 rounded-3xl bg-primary-50 text-primary-600"><KeyRound size={30} aria-hidden="true" /></span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email du compte" htmlFor="email" error={error}>
          <input
            id="email" type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.com"
            className={`input-field ${error ? 'input-error' : ''}`} value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required
          />
        </FormField>
        <button type="submit" className="btn-primary btn-lg w-full" disabled={loading || !email}>
          {loading ? 'Envoi…' : 'Recevoir un code'}
        </button>
      </form>
    </AuthShell>
  );
}
