import { useEffect, useState } from 'react';
import { isToday } from 'date-fns';
import earningsService from '../services/earningsService';
import { fromServerStats } from '../utils/stats';

// Gains et courses du jour pour l'accueil, tires de la serie journaliere de
// GET /livreur/statistiques (§4.8). `null` tant que non charge ou indisponible.
export default function useTodayStats(refreshKey) {
  const [today, setToday] = useState(null);

  useEffect(() => {
    let cancelled = false;
    earningsService.fetchStatistics('7j')
      .then((data) => {
        if (cancelled) return;
        const { days } = fromServerStats(data);
        if (!days) {
          setToday(null);
          return;
        }
        const day = days.find((d) => isToday(d.date));
        setToday(day ? { gains: day.gains, missions: day.missions } : { gains: 0, missions: 0 });
      })
      .catch(() => {
        if (!cancelled) setToday(null);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  return today;
}
