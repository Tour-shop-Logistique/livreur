import { contactOf } from './missionFlow';

// Filtre "missions de ma ville" (cahier des charges §5) applique cote app : l'API
// renvoie toutes les missions express du reseau, sans filtre geographique
// (demande backend B3). Le choix est memorise sur l'appareil.

const STORAGE_KEY = 'livreur_ville_express';

// Ville ou se deroule la mission : chez l'expediteur pour un enlevement, chez le
// destinataire pour une livraison a domicile.
export const missionCity = (mission) => {
  const exp = mission?.expedition || {};
  const ville = contactOf(exp, mission?.type === 'enlevement' ? 'expediteur' : 'destinataire').ville;
  return typeof ville === 'string' && ville.trim() ? ville.trim() : null;
};

// Comparaison insensible a la casse et aux accents ("Bouaké" = "bouake").
export const sameCity = (a, b) => Boolean(a && b) && a.localeCompare(b, 'fr', { sensitivity: 'base' }) === 0;

export const loadPreferredCity = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const savePreferredCity = (ville) => {
  try {
    if (ville) localStorage.setItem(STORAGE_KEY, ville);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // stockage indisponible (navigation privee) : non bloquant
  }
};

// Villes presentes dans la liste, avec leur nombre de missions, triees par volume.
// La ville choisie reste proposee meme sans mission en cours (compteur a 0).
export const cityOptions = (missions, selected) => {
  const counts = [];
  missions.forEach((m) => {
    const ville = missionCity(m);
    if (!ville) return;
    const entry = counts.find((c) => sameCity(c.ville, ville));
    if (entry) entry.count += 1;
    else counts.push({ ville, count: 1 });
  });
  if (selected && !counts.some((c) => sameCity(c.ville, selected))) counts.push({ ville: selected, count: 0 });
  return counts.sort((a, b) => b.count - a.count || a.ville.localeCompare(b.ville, 'fr'));
};
