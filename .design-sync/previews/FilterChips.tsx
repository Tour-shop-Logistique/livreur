import { useState } from 'react';
import { FilterChips } from 'livreur-app';

export const Missions = () => {
  const [v, setV] = useState('actives');
  return (
    <div className="max-w-md bg-surface-50 px-4 py-3">
      <FilterChips
        value={v}
        onChange={setV}
        options={[
          { key: 'actives', label: 'Actives', count: 3 },
          { key: 'enlevements', label: 'Enlèvements', count: 1 },
          { key: 'livraisons', label: 'Livraisons', count: 2 },
          { key: 'historique', label: 'Historique' },
        ]}
      />
    </div>
  );
};
