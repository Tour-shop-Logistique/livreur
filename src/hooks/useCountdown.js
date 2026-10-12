import { useEffect, useState } from 'react';
import { secondsLeft } from '../utils/missionFlow';

// Secondes restantes avant `expireLe`, rafraichies chaque seconde (null si
// aucune echeance). Sert aux propositions a accepter sous 15 min.
export default function useCountdown(expireLe) {
  const [left, setLeft] = useState(() => secondsLeft(expireLe));

  useEffect(() => {
    setLeft(secondsLeft(expireLe));
    if (!expireLe) return undefined;
    const t = setInterval(() => {
      const s = secondsLeft(expireLe);
      setLeft(s);
      if (s === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [expireLe]);

  return left;
}

export const formatCountdown = (s) => (s == null ? '' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
