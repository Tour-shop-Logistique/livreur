import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LogOut, Bike, Car, ChevronRight, UserRound, Lock, BellRing, ShieldCheck, BadgeCheck, Hourglass, XCircle, IdCard, Mail, Phone,
} from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import AvailabilitySwitch from '../../components/common/AvailabilitySwitch';
import BottomSheet from '../../components/common/BottomSheet';
import FormField from '../../components/common/FormField';
import PasswordInput from '../../components/common/PasswordInput';
import StatusBadge from '../../components/missions/StatusBadge';
import {
  logout, updateVehicle, updateProfile, changePassword,
} from '../../store/slices/authSlice';
import usePushSubscription from '../../hooks/usePushSubscription';
import { ROUTES } from '../../routes';
import { fullName, initials, formatDate } from '../../utils/format';

const KYC = {
  valide: { label: 'Identité vérifiée', tone: 'success', icon: BadgeCheck },
  en_attente: { label: 'Vérification en cours', tone: 'waiting', icon: Hourglass },
  rejete: { label: 'Documents rejetés', tone: 'danger', icon: XCircle },
};

const PIECE_LABEL = { cni: "Carte d'identité", passeport: 'Passeport', permis_conduire: 'Permis de conduire' };

function Row({ icon, label, value, onClick, to, danger = false }) {
  const Icon = icon;
  const content = (
    <>
      <span className={`icon-tile h-9 w-9 ${danger ? 'bg-danger-50 text-danger-600' : 'bg-surface-100 text-surface-600'}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className={`text-sm font-medium ${danger ? 'text-danger-600' : 'text-surface-900'}`}>{label}</p>
        {value && <p className="truncate text-xs text-surface-500">{value}</p>}
      </div>
      {!danger && <ChevronRight size={18} className="shrink-0 text-surface-300" aria-hidden="true" />}
    </>
  );
  const className = 'flex min-h-14 w-full items-center gap-3 px-4 py-3 transition hover:bg-surface-50';
  if (to) return <Link to={to} className={className}>{content}</Link>;
  return <button type="button" onClick={onClick} className={className}>{content}</button>;
}

function VehicleSheet({ open, onClose, livreur }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (open) {
      setErrors(null);
      setForm({
        typeVehicule: livreur?.type_vehicule || 'moto',
        numeroVehicule: livreur?.numero_vehicule || '',
        permisDeConduire: livreur?.permis_de_conduire || '',
        zoneDeLivraisonKm: livreur?.zone_de_livraison_km ?? '',
      });
    }
  }, [open, livreur]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await dispatch(updateVehicle(form));
    setLoading(false);
    if (updateVehicle.fulfilled.match(result)) {
      toast.success('Véhicule mis à jour.');
      onClose();
    } else {
      setErrors(result.payload?.fieldErrors || { general: [result.payload?.message] });
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Mon véhicule" description="Ces informations ne nécessitent pas de nouvelle vérification.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[{ v: 'moto', l: 'Moto', i: Bike }, { v: 'voiture', l: 'Voiture', i: Car }].map((o) => (
            <button
              key={o.v}
              type="button"
              aria-pressed={form.typeVehicule === o.v}
              onClick={() => set('typeVehicule')(o.v)}
              className={`flex min-h-16 items-center justify-center gap-2 rounded-xl border-2 text-sm font-semibold transition ${
                form.typeVehicule === o.v ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-surface-200 text-surface-600'
              }`}
            >
              <o.i size={20} aria-hidden="true" /> {o.l}
            </button>
          ))}
        </div>
        <FormField label="Immatriculation" htmlFor="v-num" error={errors?.numero_vehicule?.[0]}>
          <input id="v-num" className="input-field uppercase" value={form.numeroVehicule || ''} onChange={set('numeroVehicule')} />
        </FormField>
        <FormField label="Numéro de permis" htmlFor="v-permis" error={errors?.permis_de_conduire?.[0]}>
          <input id="v-permis" className="input-field uppercase" value={form.permisDeConduire || ''} onChange={set('permisDeConduire')} />
        </FormField>
        <FormField label="Rayon d'intervention (km)" htmlFor="v-zone" error={errors?.zone_de_livraison_km?.[0]}>
          <input id="v-zone" type="number" min="0" inputMode="numeric" className="input-field" value={form.zoneDeLivraisonKm} onChange={set('zoneDeLivraisonKm')} />
        </FormField>
        {errors?.general && <p className="field-error">{errors.general[0]}</p>}
        <button type="submit" className="btn-primary btn-lg w-full" disabled={loading}>{loading ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
    </BottomSheet>
  );
}

function InfoSheet({ open, onClose, user }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (open) {
      setErrors(null);
      setForm({
        nom: user?.nom || '', prenoms: user?.prenoms || '', telephone: user?.telephone || '',
        indicatifTelephone: user?.indicatif_telephone || '', email: user?.email || '',
      });
    }
  }, [open, user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const emailChanged = form.email.trim() !== (user?.email || '');
    const result = await dispatch(updateProfile({ ...form, email: form.email.trim() }));
    setLoading(false);
    if (updateProfile.fulfilled.match(result)) {
      toast.success(emailChanged ? 'Profil mis à jour. Vérifiez votre nouvelle adresse email.' : 'Profil mis à jour.');
      onClose();
    } else {
      setErrors(result.payload?.fieldErrors || { general: [result.payload?.message] });
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Informations personnelles">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nom" htmlFor="p-nom" error={errors?.nom?.[0]}>
            <input id="p-nom" className="input-field" value={form.nom || ''} onChange={set('nom')} required />
          </FormField>
          <FormField label="Prénoms" htmlFor="p-prenoms" error={errors?.prenoms?.[0]}>
            <input id="p-prenoms" className="input-field" value={form.prenoms || ''} onChange={set('prenoms')} />
          </FormField>
        </div>
        <FormField label="Téléphone" htmlFor="p-tel" error={errors?.telephone?.[0]}>
          <input id="p-tel" type="tel" inputMode="tel" className="input-field" value={form.telephone || ''} onChange={set('telephone')} required />
        </FormField>
        <FormField label="Email" htmlFor="p-email" error={errors?.email?.[0]} hint="Une nouvelle vérification sera demandée si vous le modifiez.">
          <input id="p-email" type="email" inputMode="email" className="input-field" value={form.email || ''} onChange={set('email')} required />
        </FormField>
        {errors?.general && <p className="field-error">{errors.general[0]}</p>}
        <button type="submit" className="btn-primary btn-lg w-full" disabled={loading}>{loading ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
    </BottomSheet>
  );
}

function PasswordSheet({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', password: '', passwordConfirmation: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (open) { setForm({ currentPassword: '', password: '', passwordConfirmation: '' }); setErrors(null); }
  }, [open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { setErrors({ password: ['8 caractères minimum.'] }); return; }
    if (form.password !== form.passwordConfirmation) { setErrors({ password_confirmation: ['Les mots de passe ne correspondent pas.'] }); return; }
    setLoading(true);
    const result = await dispatch(changePassword(form));
    setLoading(false);
    if (changePassword.fulfilled.match(result)) {
      toast.success('Mot de passe modifié. Reconnectez-vous.');
      navigate(ROUTES.LOGIN, { replace: true });
    } else {
      setErrors(result.payload?.fieldErrors || { general: [result.payload?.message] });
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Changer le mot de passe" description="Vous serez déconnecté de tous vos appareils.">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Mot de passe actuel" htmlFor="pw-current" error={errors?.current_password?.[0]}>
          <PasswordInput id="pw-current" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} required />
        </FormField>
        <FormField label="Nouveau mot de passe" htmlFor="pw-new" error={errors?.password?.[0]} hint="8 caractères minimum.">
          <PasswordInput id="pw-new" autoComplete="new-password" value={form.password} onChange={set('password')} required />
        </FormField>
        <FormField label="Confirmer" htmlFor="pw-confirm" error={errors?.password_confirmation?.[0]}>
          <PasswordInput id="pw-confirm" autoComplete="new-password" value={form.passwordConfirmation} onChange={set('passwordConfirmation')} required />
        </FormField>
        {errors?.general && <p className="field-error">{errors.general[0]}</p>}
        <button type="submit" className="btn-primary btn-lg w-full" disabled={loading}>{loading ? 'Modification…' : 'Modifier le mot de passe'}</button>
      </form>
    </BottomSheet>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const livreur = user?.livreur;
  const kyc = KYC[livreur?.statut_validation];
  const push = usePushSubscription();
  const [sheet, setSheet] = useState(null);
  const VehicleIcon = livreur?.type_vehicule === 'voiture' ? Car : Bike;

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Vous êtes déconnecté.');
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const togglePush = async () => {
    const res = await push.toggle();
    if (res.ok) toast.success(res.enabled ? 'Notifications push activées.' : 'Notifications push désactivées.');
    else toast.error(res.message || "Impossible d'activer les notifications.");
  };

  return (
    <div>
      <TopBar title="Profil" />
      <div className="page-container space-y-5 py-4">
        {/* Identite */}
        <section className="card p-5">
          <div className="flex items-center gap-4">
            {livreur?.photo_profil_url ? (
              <img src={livreur.photo_profil_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-600 font-heading text-xl font-bold text-white">{initials(user)}</span>
            )}
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-semibold text-surface-900">{fullName(user)}</p>
              {kyc && <StatusBadge label={kyc.label} tone={kyc.tone} className="mt-1" />}
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            {user?.telephone && <div className="flex items-center gap-2 text-surface-600"><Phone size={15} className="text-surface-400" aria-hidden="true" /><span className="tabular">{user.telephone}</span></div>}
            {user?.email && <div className="flex items-center gap-2 text-surface-600"><Mail size={15} className="text-surface-400" aria-hidden="true" /><span className="truncate">{user.email}</span></div>}
            {livreur?.nom_piece_identite && (
              <div className="flex items-center gap-2 text-surface-600">
                <IdCard size={15} className="text-surface-400" aria-hidden="true" />
                {PIECE_LABEL[livreur.nom_piece_identite] || livreur.nom_piece_identite} · {livreur.numero_piece_identite}
              </div>
            )}
          </dl>
          {livreur?.statut_validation === 'valide' && livreur.valide_le && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-success-700"><ShieldCheck size={14} aria-hidden="true" /> Compte validé le {formatDate(livreur.valide_le)}</p>
          )}
          {livreur?.statut_validation === 'rejete' && livreur.commentaire_rejet && (
            <p className="mt-3 rounded-xl bg-danger-50 p-3 text-xs text-danger-700">Motif : {livreur.commentaire_rejet}</p>
          )}
        </section>

        <AvailabilitySwitch />

        <section>
          <h2 className="section-title">Activité</h2>
          <div className="card divide-y divide-surface-100 overflow-hidden">
            <Row
              icon={VehicleIcon}
              label="Mon véhicule"
              value={livreur ? [livreur.type_vehicule === 'voiture' ? 'Voiture' : 'Moto', livreur.numero_vehicule, livreur.zone_de_livraison_km ? `${livreur.zone_de_livraison_km} km` : null].filter(Boolean).join(' · ') : 'Non renseigné'}
              onClick={() => setSheet('vehicle')}
            />
            <Row icon={ShieldCheck} label="Abonnement marketplace" value="Statut et échéances" to={ROUTES.ABONNEMENT} />
            {push.supported && (
              <div className="flex min-h-14 items-center gap-3 px-4 py-3">
                <span className="icon-tile h-9 w-9 bg-surface-100 text-surface-600"><BellRing size={18} aria-hidden="true" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-900">Notifications push</p>
                  <p className="text-xs text-surface-500">Nouvelles missions, offres acceptées</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={push.enabled}
                  aria-label="Notifications push"
                  onClick={togglePush}
                  disabled={push.loading}
                  className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-60 ${push.enabled ? 'bg-primary-600' : 'bg-surface-300'}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${push.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="section-title">Compte</h2>
          <div className="card divide-y divide-surface-100 overflow-hidden">
            <Row icon={UserRound} label="Informations personnelles" value="Nom, téléphone, email" onClick={() => setSheet('info')} />
            <Row icon={Lock} label="Mot de passe" value="Modifier votre mot de passe" onClick={() => setSheet('password')} />
            <Row icon={LogOut} label="Se déconnecter" onClick={handleLogout} danger />
          </div>
        </section>

        <p className="pb-2 text-center text-xs text-surface-400">TourShop Livreur · v{import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
      </div>

      <VehicleSheet open={sheet === 'vehicle'} onClose={() => setSheet(null)} livreur={livreur} />
      <InfoSheet open={sheet === 'info'} onClose={() => setSheet(null)} user={user} />
      <PasswordSheet open={sheet === 'password'} onClose={() => setSheet(null)} />
    </div>
  );
}
