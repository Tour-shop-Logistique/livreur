import { MissionStepper, EXPEDITION_STEPS, MARKETPLACE_STEPS } from 'livreur-app';

export const Enlevement = () => (
  <div className="card max-w-sm p-4">
    <MissionStepper steps={EXPEDITION_STEPS.enlevement} current={1} />
  </div>
);

export const Livraison = () => (
  <div className="card max-w-sm p-4">
    <MissionStepper steps={EXPEDITION_STEPS.livraison} current={2} />
  </div>
);

export const Marketplace = () => (
  <div className="card max-w-sm p-4">
    <MissionStepper steps={MARKETPLACE_STEPS} current={0} />
  </div>
);
