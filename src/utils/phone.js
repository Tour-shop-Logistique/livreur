import { Metadata } from 'libphonenumber-js/min';

// L'API stocke le telephone en deux champs, comme pour client-app :
// `indicatif_telephone` ("+225") et `telephone` = numero NATIONAL, tel que saisi
// ("0575081162", zero initial conserve pour la Cote d'Ivoire). La connexion par
// telephone envoie donc lui aussi le numero national seul.
export const nationalPhone = (raw) => String(raw || '').replace(/[\s.\-()]/g, '');

// Longueurs valides du numero national pour un pays (meme metadonnees que
// client-app) — sert uniquement a l'indication "10 chiffres" sous le champ.
export function getPhoneLengthHint(country) {
  if (!country) return '';
  try {
    const metadata = new Metadata();
    metadata.selectNumberingPlan(country.toUpperCase());
    const lengths = metadata.numberingPlan.possibleLengths();
    if (!lengths?.length) return '';
    const min = lengths[0];
    const max = lengths[lengths.length - 1];
    return min === max ? `${min} chiffres` : `${min} à ${max} chiffres`;
  } catch {
    return '';
  }
}

// Affichage : "+225 0575081162".
export const displayPhone = (indicatif, national) => [indicatif, national].filter(Boolean).join(' ');
