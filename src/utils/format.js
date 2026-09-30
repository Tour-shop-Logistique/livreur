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

export const fullName = (user) =>
  [user?.prenoms, user?.nom].filter(Boolean).join(' ') || user?.name || 'Livreur';

export const initials = (user) => {
  const parts = [user?.prenoms, user?.nom].filter(Boolean);
  if (parts.length === 0) return 'L';
  return parts.map((p) => p.trim().charAt(0).toUpperCase()).join('').slice(0, 2);
};
