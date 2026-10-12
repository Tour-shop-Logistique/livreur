import { useEffect, useState } from 'react';

// Position GPS suivie en continu (watchPosition) tant que `enabled` est vrai.
// Reste locale a l'appareil : rien n'est envoye au serveur.
export default function useLivePosition(enabled) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setError(null);
      },
      (err) => setError(err.code === err.PERMISSION_DENIED ? 'Localisation refusée. Autorisez-la dans les réglages du navigateur.' : err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return { position: enabled ? position : null, error: enabled ? error : null };
}
