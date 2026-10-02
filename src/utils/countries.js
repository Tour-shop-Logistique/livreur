import { getCountryCallingCode } from 'libphonenumber-js/min';
import countriesData from '../data/countries.json';

// Source de verite unique pour les pays (code ISO 3166-1 alpha-2 + nom FR) :
// `src/data/countries.json` est copie a l'identique depuis client-app (lui-meme
// aligne sur agence-partenaire / backoffice-app / tourshop-backend) pour que les
// listes de pays ne divergent pas d'une app a l'autre. L'indicatif telephonique
// vient des metadonnees libphonenumber (meme lib que client-app).

// Code ISO -> emoji drapeau (regional indicator symbols), sans image a charger.
export function getFlagEmoji(code) {
  if (!code || code.length !== 2) return '';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

const dialCode = (code) => {
  try {
    return `+${getCountryCallingCode(code)}`;
  } catch {
    return null; // territoire sans plan de numerotation connu
  }
};

// { code, nom, indicatif, flag } — seuls les pays avec un indicatif connu sont
// proposes (un livreur doit pouvoir saisir un telephone).
export const COUNTRIES = countriesData
  .map(({ code, name }) => ({ code, nom: name, indicatif: dialCode(code), flag: getFlagEmoji(code) }))
  .filter((c) => c.indicatif);

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export const DEFAULT_COUNTRY = BY_CODE.get('CI');

export const findCountry = (code) => BY_CODE.get(String(code || '').toUpperCase()) || DEFAULT_COUNTRY;

export const getCountryName = (code) => BY_CODE.get(String(code || '').toUpperCase())?.nom || code || '';

// Recherche insensible aux accents / tirets / apostrophes ("cote d ivoire"
// trouve "Côte-d'Ivoire"), ainsi que par indicatif ("225") ou code ISO.
const normalize = (str) => String(str)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[-'\s]+/g, ' ')
  .trim();

export const searchCountries = (query) => {
  const q = normalize(query);
  if (!q) return COUNTRIES;
  const digits = q.replace(/\D/g, '');
  return COUNTRIES.filter((c) => normalize(c.nom).includes(q)
    || c.code.toLowerCase() === q
    || (digits && c.indicatif.slice(1).startsWith(digits)));
};
