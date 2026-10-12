import { startOfDay, subDays, format, parseISO } from 'date-fns';

// Statistiques personnelles (cahier des charges §5). Source principale :
// GET /livreur/statistiques (PARCOURS_LIVREUR_API.md §4.8), convertie par
// `fromServerStats`. En secours (route indisponible), calcul cote app a partir
// des donnees deja chargees :
//  - GET /livreur/solde/historique : un credit par mission d'expedition cloturee
//    (PARCOURS_LIVREUR_API.md §4.6), avec la mission en `detail.mission` ;
//  - livraisons marketplace du livreur (statut terminee/livree) : aucune somme
//    ne transite par TourShop, elles sont comptees mais pas ajoutees aux gains.

export const STATS_PERIODS = [
  { key: '7j', label: '7 jours', days: 7 },
  { key: '30j', label: '30 jours', days: 30 },
  { key: 'tout', label: 'Tout', days: null },
];

const dayKey = (d) => format(d, 'yyyy-MM-dd');
const isDone = (l) => l?.statut === 'terminee' || l?.statut === 'livree';

// Reponse de /livreur/statistiques -> meme forme que computeStats (+ offres, annulees).
export function fromServerStats(data) {
  const missions = data?.missions || {};
  const gains = data?.gains || {};
  const offres = data?.offres || null;
  const days = Array.isArray(data?.par_jour)
    ? data.par_jour.map((d) => ({ date: parseISO(d.date), gains: Number(d.gains) || 0, missions: Number(d.missions) || 0 }))
    : null;
  return {
    missions: Number(missions.terminees) || 0,
    gains: Number(gains.total) || 0,
    moyenne: Math.round(Number(gains.moyenne_par_mission) || 0),
    byType: { enlevement: Number(missions.enlevements) || 0, livraison: Number(missions.livraisons) || 0 },
    annulees: Number(missions.annulees) || 0,
    marketplace: Number(data?.marketplace?.terminees) || 0,
    offres: offres && {
      proposees: Number(offres.proposees) || 0,
      acceptees: Number(offres.acceptees) || 0,
      taux: Number(offres.taux_acceptation) || 0,
    },
    days,
  };
}

export function computeStats(historyItems, marketplaceItems, periodKey, now = new Date()) {
  const period = STATS_PERIODS.find((p) => p.key === periodKey) || STATS_PERIODS[0];
  const since = period.days ? startOfDay(subDays(now, period.days - 1)) : null;
  const inPeriod = (value) => {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return false;
    return !since || d >= since;
  };

  const credits = historyItems.filter((h) => h.type === 'credit' && inPeriod(h.date));
  const gains = credits.reduce((sum, h) => sum + (Number(h.montant) || 0), 0);
  const byType = { enlevement: 0, livraison: 0 };
  credits.forEach((h) => {
    const type = h.detail?.mission?.type;
    if (type in byType) byType[type] += 1;
  });

  // Date de cloture marketplace non exposee au livreur : derniere mise a jour
  // de la livraison, a defaut sa date d'assignation.
  const marketplace = marketplaceItems.filter((l) => isDone(l) && inPeriod(l.updated_at || l.assignee_le)).length;

  // Serie journaliere (jours a zero inclus), seulement pour une periode bornee.
  let days = null;
  if (period.days) {
    const totals = new Map();
    credits.forEach((h) => {
      const key = dayKey(new Date(h.date));
      const cur = totals.get(key) || { gains: 0, missions: 0 };
      totals.set(key, { gains: cur.gains + (Number(h.montant) || 0), missions: cur.missions + 1 });
    });
    days = Array.from({ length: period.days }, (_, i) => {
      const date = startOfDay(subDays(now, period.days - 1 - i));
      return { date, ...(totals.get(dayKey(date)) || { gains: 0, missions: 0 }) };
    });
  }

  return {
    missions: credits.length,
    gains,
    moyenne: credits.length ? Math.round(gains / credits.length) : 0,
    byType,
    marketplace,
    days,
  };
}
