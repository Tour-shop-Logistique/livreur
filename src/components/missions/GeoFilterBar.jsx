import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import FilterChips from '../common/FilterChips';
import BottomSheet from '../common/BottomSheet';
import FormField from '../common/FormField';
import useGeolocation from '../../hooks/useGeolocation';
import { setGeoFilter, fetchAvailableMissions } from '../../store/slices/missionsSlice';
import { fetchMarketplaceAvailable } from '../../store/slices/marketplaceSlice';

// Filtre geographique des listes "disponibles" (PARCOURS §4.5, MARKETPLACE §7.1),
// commun aux missions express et aux livraisons marketplace :
//  - Ma ville    : aucune option, l'API filtre sur la `ville` du profil
//  - Pres de moi : latitude/longitude -> `distance_km`, rayon du profil, tri par distance
//  - Autre ville : parametre `ville` (livreur en deplacement), memorise sur l'appareil
export default function GeoFilterBar() {
  const dispatch = useDispatch();
  const { ville, lat, lng } = useSelector((state) => state.missions.geoFilter);
  const profileCity = useSelector((state) => state.auth.user?.livreur?.ville);
  const { position, loading, error, locate } = useGeolocation();
  const waitingPosition = useRef(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityInput, setCityInput] = useState('');

  const apply = (filter) => {
    dispatch(setGeoFilter(filter));
    dispatch(fetchAvailableMissions());
    dispatch(fetchMarketplaceAvailable());
  };

  useEffect(() => {
    if (!waitingPosition.current) return;
    if (position) {
      waitingPosition.current = false;
      apply({ ville, lat: position.lat, lng: position.lng });
    } else if (error) {
      waitingPosition.current = false;
      toast.error('Position indisponible', { description: error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, error]);

  const near = lat != null && lng != null;
  const value = near ? 'near' : ville ? 'city' : '';
  const options = [
    { key: '', label: profileCity ? `Ma ville · ${profileCity}` : 'Ma zone' },
    { key: 'near', label: loading ? 'Localisation…' : 'Près de moi' },
    ...(ville ? [{ key: 'city', label: ville }] : []),
    { key: 'other', label: 'Autre ville…' },
  ];

  const onChange = (key) => {
    if (key === '') apply({});
    else if (key === 'near') {
      waitingPosition.current = true;
      locate();
    } else if (key === 'city') apply({ ville });
    else if (key === 'other') {
      setCityInput(ville || '');
      setCityOpen(true);
    }
  };

  const submitCity = (e) => {
    e.preventDefault();
    const v = cityInput.trim();
    setCityOpen(false);
    apply({ ville: v });
  };

  return (
    <>
      <FilterChips options={options} value={value} onChange={onChange} />
      <BottomSheet open={cityOpen} onClose={() => setCityOpen(false)} title="Autre ville" description="Voir les courses d'une autre ville que celle de votre profil (en déplacement).">
        <form onSubmit={submitCity} className="space-y-4">
          <FormField label="Ville" htmlFor="geo-ville">
            <input id="geo-ville" className="input-field" maxLength={100} placeholder="Ex. Bouaké" value={cityInput} onChange={(e) => setCityInput(e.target.value)} autoFocus />
          </FormField>
          <button type="submit" className="btn-primary btn-lg w-full">Afficher cette ville</button>
        </form>
      </BottomSheet>
    </>
  );
}
