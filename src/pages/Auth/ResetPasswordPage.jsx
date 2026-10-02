import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import AuthShell from '../../components/common/AuthShell';
import FormField from '../../components/common/FormField';
import PasswordInput from '../../components/common/PasswordInput';
import CodeInput from '../../components/common/CodeInput';
import { verifyResetCode, resetPassword, clearAuthError } from '../../store/slices/authSlice';
import { ROUTES } from '../../routes';
import ButtonLabel from '../../components/common/ButtonLabel';

export default function ResetPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, fieldErrors, pendingEmail } = useSelector((state) => state.auth);
  const email = pendingEmail || location.state?.email || '';
  const [form, setForm] = useState({ code: '', password: '', passwordConfirmation: '' });
  const [localError, setLocalError] = useState(null);
  const loading = status === 'loading';

  const set = (name) => (value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    setLocalError(null);
    if (form.password.length < 8) { setLocalError('8 caractères minimum.'); return; }
    if (form.password !== form.passwordConfirmation) { setLocalError('Les mots de passe ne correspondent pas.'); return; }

    const check = await dispatch(verifyResetCode({ email, code: form.code }));
    if (!verifyResetCode.fulfilled.match(check)) return;

    const result = await dispatch(resetPassword({
      email, code: form.code, password: form.password, passwordConfirmation: form.passwordConfirmation,
    }));
    if (resetPassword.fulfilled.match(result)) {
      toast.success('Mot de passe réinitialisé. Connectez-vous.');
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle={<>Code envoyé à <span className="font-semibold text-surface-800">{email}</span> (valable 15 minutes).</>}
      backTo={ROUTES.FORGOT_PASSWORD}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="label text-center">Code de réinitialisation</p>
          <CodeInput length={6} value={form.code} onChange={set('code')} autoFocus invalid={Boolean(fieldErrors?.code || (error && !localError))} label="Code de réinitialisation" />
          {error && <p className="field-error text-center" role="alert">{error}</p>}
        </div>
        <FormField label="Nouveau mot de passe" htmlFor="password" error={localError || fieldErrors?.password?.[0]} hint="8 caractères minimum.">
          <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password')(e.target.value)} required />
        </FormField>
        <FormField label="Confirmer le mot de passe" htmlFor="password-confirmation">
          <PasswordInput id="password-confirmation" autoComplete="new-password" value={form.passwordConfirmation} onChange={(e) => set('passwordConfirmation')(e.target.value)} required />
        </FormField>
        <button type="submit" aria-busy={loading} className="btn-primary btn-lg w-full" disabled={loading || form.code.length < 6}>
          <ButtonLabel loading={loading} loadingLabel="Réinitialisation…">Réinitialiser</ButtonLabel>
        </button>
      </form>
    </AuthShell>
  );
}
