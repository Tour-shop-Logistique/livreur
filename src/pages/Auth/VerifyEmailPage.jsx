import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';
import AuthShell from '../../components/common/AuthShell';
import CodeInput from '../../components/common/CodeInput';
import { verifyEmailCode, resendVerification, clearAuthError } from '../../store/slices/authSlice';
import { ROUTES } from '../../routes';

// POST /verify-email. Meme verifie, le compte reste inactif jusqu'a la
// validation des documents par le backoffice -> ecran d'attente.
export default function VerifyEmailPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, pendingEmail } = useSelector((state) => state.auth);
  const email = location.state?.email || pendingEmail || '';
  const credentials = location.state?.credentials;
  const [code, setCode] = useState('');
  const loading = status === 'loading';

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(verifyEmailCode({ email, code: code.trim() }));
    if (!verifyEmailCode.fulfilled.match(result)) return;
    toast.success('Email vérifié.');
    navigate(ROUTES.PENDING_VALIDATION, { replace: true, state: { credentials, emailVerified: true } });
  };

  const handleResend = async () => {
    const result = await dispatch(resendVerification(email));
    if (resendVerification.fulfilled.match(result)) toast.success('Nouveau code envoyé.');
  };

  return (
    <AuthShell
      title="Vérifiez votre email"
      subtitle={(
        <>Saisissez le code à 6 chiffres envoyé à <span className="font-semibold text-surface-800">{email || 'votre adresse'}</span>.</>
      )}
      backTo={ROUTES.LOGIN}
    >
      <div className="mb-6 flex justify-center">
        <span className="icon-tile h-16 w-16 rounded-3xl bg-primary-50 text-primary-600"><MailCheck size={30} aria-hidden="true" /></span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <CodeInput length={6} value={code} onChange={setCode} autoFocus invalid={Boolean(error)} label="Code de vérification" />
        {error && <p className="field-error text-center" role="alert">{error}</p>}
        <button type="submit" className="btn-primary btn-lg w-full" disabled={loading || code.length < 6 || !email}>
          {loading ? 'Vérification…' : 'Valider'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Code non reçu ?{' '}
        <button type="button" className="font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50" onClick={handleResend} disabled={loading || !email}>
          Renvoyer le code
        </button>
      </p>
    </AuthShell>
  );
}
