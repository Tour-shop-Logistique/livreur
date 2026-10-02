import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, FileSearch, Hourglass, RefreshCw } from 'lucide-react';
import AuthShell from '../../components/common/AuthShell';
import { loginLivreur, clearAuthError } from '../../store/slices/authSlice';
import { ROUTES } from '../../routes';

// Ecran d'attente KYC (PARCOURS_LIVREUR_API.md §1 "Consequence pour l'app mobile") :
// aucune notification n'est envoyee a la validation/au rejet ; le seul moyen de
// connaitre le statut est de retenter POST /login.
const TIMELINE = [
  { key: 'inscription', label: 'Inscription reçue', done: true },
  { key: 'email', label: 'Email vérifié', done: true },
  { key: 'documents', label: 'Vérification de vos documents', current: true, hint: 'Notre équipe contrôle votre pièce d\'identité. En cas de document illisible, elle vous contactera.' },
  { key: 'actif', label: 'Compte activé' },
];

export default function PendingValidationPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const credentials = location.state?.credentials;
  const loading = useSelector((state) => state.auth.status === 'loading');

  const checkStatus = async () => {
    dispatch(clearAuthError());
    const result = await dispatch(loginLivreur(credentials));
    if (loginLivreur.fulfilled.match(result)) {
      toast.success('Votre compte est activé. Bienvenue !');
      navigate(ROUTES.HOME, { replace: true });
      return;
    }
    if (result.payload?.kind === 'inactive') {
      toast.message('Vérification toujours en cours', { description: 'Réessayez un peu plus tard.' });
    } else if (result.payload?.kind === 'unverified') {
      navigate(ROUTES.VERIFY_EMAIL, { state: { email: credentials?.email, credentials } });
    } else {
      toast.error(result.payload?.message || 'Impossible de vérifier votre statut.');
    }
  };

  return (
    <AuthShell
      title="Dossier en cours de vérification"
      subtitle="Votre compte sera activé dès que notre équipe aura validé vos documents. Cela prend généralement moins de 48 h."
    >
      <div className="mb-6 flex justify-center">
        <span className="icon-tile h-16 w-16 rounded-2xl bg-warning-50 text-warning-600"><FileSearch size={30} aria-hidden="true" /></span>
      </div>

      <ol className="card p-5">
        {TIMELINE.map((s, i) => (
          <li key={s.key} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                s.done ? 'bg-success-600 text-white' : s.current ? 'bg-warning-100 text-warning-700' : 'border-2 border-surface-200 bg-white text-surface-400'
              }`}>
                {s.done ? <Check size={15} strokeWidth={3} /> : s.current ? <Hourglass size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
              </span>
              {i < TIMELINE.length - 1 && <span className={`w-0.5 flex-1 ${s.done ? 'bg-success-500' : 'bg-surface-200'}`} style={{ minHeight: 18 }} />}
            </div>
            <div className={`pt-1 ${i < TIMELINE.length - 1 ? 'pb-4' : ''}`}>
              <p className={`text-sm ${s.done ? 'font-medium text-surface-800' : s.current ? 'font-semibold text-surface-900' : 'text-surface-500'}`}>{s.label}</p>
              {s.hint && <p className="mt-0.5 text-xs leading-relaxed text-surface-500">{s.hint}</p>}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 space-y-3">
        {credentials ? (
          <button type="button" className="btn-primary btn-lg w-full" onClick={checkStatus} disabled={loading} aria-busy={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> {loading ? 'Vérification…' : 'Vérifier mon statut'}
          </button>
        ) : (
          <Link to={ROUTES.LOGIN} className="btn-primary btn-lg w-full">Se connecter</Link>
        )}
        <Link to={ROUTES.LOGIN} className="btn-ghost w-full">Retour à la connexion</Link>
      </div>
    </AuthShell>
  );
}
