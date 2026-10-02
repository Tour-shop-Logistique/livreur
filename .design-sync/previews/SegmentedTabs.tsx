import { useState } from 'react';
import { SegmentedTabs } from 'livreur-app';

export const Demandes = () => {
  const [v, setV] = useState('express');
  return (
    <div className="max-w-md">
      <SegmentedTabs
        value={v}
        onChange={setV}
        tabs={[
          { key: 'express', label: 'Express', count: 4 },
          { key: 'marketplace', label: 'Marketplace', count: 2 },
          { key: 'offres', label: 'Mes offres' },
        ]}
      />
    </div>
  );
};

export const DeuxOnglets = () => {
  const [v, setV] = useState('historique');
  return (
    <div className="max-w-md">
      <SegmentedTabs value={v} onChange={setV} tabs={[{ key: 'en_cours', label: 'En cours', count: 3 }, { key: 'historique', label: 'Historique' }]} />
    </div>
  );
};
