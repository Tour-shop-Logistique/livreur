import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

// Devise dynamique (CHANGEMENTS_APPS_CLIENT_LIVREUR §1) : `user.devise` (ISO 4217)
// vient du backoffice de rattachement — plus de XOF code en dur. La devise par
// defaut est synchronisee depuis le store (cf. store/index.js).
const FALLBACK_CURRENCY = 'XOF';
let defaultCurrency = FALLBACK_CURRENCY;

export const setDefaultCurrency = (code) => {
  defaultCurrency = (typeof code === 'string' && code.trim()) ? code.trim().toUpperCase() : FALLBACK_CURRENCY;
};

export const getDefaultCurrency = () => defaultCurrency;

// Les francs CFA (UEMOA / CEMAC) s'affichent "FCFA" ; sinon le symbole Intl (€, $…).
const CFA = new Set(['XOF', 'XAF']);

// Libelle court d'une devise : 'FCFA', '€', 'GNF'…
export const currencyLabel = (code = defaultCurrency) => {
  const c = String(code || defaultCurrency).toUpperCase();
  if (CFA.has(c)) return 'FCFA';
  try {
    const part = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((p) => p.type === 'currency');
    return part?.value || c;
  } catch {
    return c; // code inconnu d'Intl : on affiche le code tel quel
  }
};

const decimalsFor = (code) => {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits;
  } catch {
    return 0;
  }
};

// `currency` : code ISO (defaut : devise de l'utilisateur) ou '' pour le nombre seul.
export const formatPrice = (value, currency) => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  const code = currency === undefined ? defaultCurrency : currency;
  const digits = code ? (CFA.has(String(code).toUpperCase()) ? 0 : Math.min(decimalsFor(code), Number.isInteger(n) ? 0 : 2)) : 0;
  const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(n);
  return code ? `${number} ${currencyLabel(code)}` : number;
};

const toDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value) => {
  const d = toDate(value);
  return d ? format(d, 'd MMM yyyy', { locale: fr }) : '—';
};

export const formatDateTime = (value) => {
  const d = toDate(value);
  if (!d) return '—';
  if (isToday(d)) return `Aujourd'hui, ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Hier, ${format(d, 'HH:mm')}`;
  return format(d, 'd MMM yyyy, HH:mm', { locale: fr });
};

export const formatRelative = (value) => {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true, locale: fr }) : '';
};

// Forme courte pour les listes : "à l'instant", "5 min", "2 h", "hier", "3 j", "12 sept.".
export const formatRelativeShort = (value) => {
  const d = toDate(value);
  if (!d) return '';
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  if (isToday(d)) return `${Math.floor(minutes / 60)} h`;
  if (isYesterday(d)) return 'hier';
  const days = Math.floor(minutes / 1440);
  return days < 7 ? `${days} j` : format(d, 'd MMM', { locale: fr });
};

// Duree ecoulee depuis `from` : "28 min", "1 h 05", "2 j 3 h".
export const formatDuration = (from, to = new Date()) => {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end || end < start) return '—';
  const minutes = Math.max(1, Math.round((end - start) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${String(minutes % 60).padStart(2, '0')}`;
  const days = Math.floor(hours / 24);
  return hours % 24 ? `${days} j ${hours % 24} h` : `${days} j`;
};

// `distance_km` renvoye par les listes "disponibles" filtrees par position.
export const formatDistance = (km) => (
  km == null || Number.isNaN(Number(km)) ? null : `À ${Number(km).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`
);

export const fullName = (user) =>
  [user?.prenoms, user?.nom].filter(Boolean).join(' ') || user?.name || 'Livreur';

export const initials = (user) => {
  const parts = [user?.prenoms, user?.nom].filter(Boolean);
  if (parts.length === 0) return 'L';
  return parts.map((p) => p.trim().charAt(0).toUpperCase()).join('').slice(0, 2);
};
