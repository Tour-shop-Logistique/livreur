import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

const priceFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export const formatPrice = (value, currency = 'FCFA') => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return `${priceFormatter.format(n)} ${currency}`;
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

export const fullName = (user) =>
  [user?.prenoms, user?.nom].filter(Boolean).join(' ') || user?.name || 'Livreur';

export const initials = (user) => {
  const parts = [user?.prenoms, user?.nom].filter(Boolean);
  if (parts.length === 0) return 'L';
  return parts.map((p) => p.trim().charAt(0).toUpperCase()).join('').slice(0, 2);
};
