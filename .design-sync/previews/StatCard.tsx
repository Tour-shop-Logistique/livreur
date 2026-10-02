import { StatCard, Wallet, Package, CheckCheck, Clock, Route } from 'livreur-app';

export const Tableau = () => (
  <div className="grid max-w-md grid-cols-2 gap-3 bg-surface-50 p-4">
    <StatCard icon={Wallet} label="Solde disponible" value="48 500 FCFA" hint="Retrait possible" tone="success" to="/portefeuille" />
    <StatCard icon={Package} label="Missions en cours" value="3" tone="accent" />
    <StatCard icon={CheckCheck} label="Livrées ce mois" value="62" hint="+8 vs septembre" />
    <StatCard icon={Clock} label="Offres en attente" value="5" tone="warning" />
  </div>
);

export const Neutre = () => (
  <div className="max-w-[200px]">
    <StatCard icon={Route} label="Distance parcourue" value="412 km" tone="neutral" />
  </div>
);
