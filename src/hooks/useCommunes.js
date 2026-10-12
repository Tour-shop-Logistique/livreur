import { useEffect, useState } from 'react';
import communeService from '../services/communeService';

// Communes actives d'un pays, configurees par le backoffice (GET /communes).
// Cache memoire par pays : la liste change rarement.
// status : 'none' (pas de pays) | 'loading' | 'idle' | 'error'.
const cache = new Map();

export default function useCommunes(codePays) {
  const code = (codePays || '').toUpperCase();
  const [state, setState] = useState(() => ({
    communes: cache.get(code) ?? [],
    status: !code ? 'none' : cache.has(code) ? 'idle' : 'loading',
  }));

  useEffect(() => {
    if (!code) {
      setState({ communes: [], status: 'none' });
      return undefined;
    }
    if (cache.has(code)) {
      setState({ communes: cache.get(code), status: 'idle' });
      return undefined;
    }
    let cancelled = false;
    setState({ communes: [], status: 'loading' });
    communeService
      .listCommunes(code)
      .then((d) => {
        const list = d?.communes ?? d?.data ?? [];
        cache.set(code, list);
        if (!cancelled) setState({ communes: list, status: 'idle' });
      })
      .catch(() => !cancelled && setState({ communes: [], status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [code]);

  return state;
}
