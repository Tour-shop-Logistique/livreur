import { SkeletonCard } from 'livreur-app';

export const Liste = () => (
  <div className="max-w-md bg-surface-50 p-4">
    <SkeletonCard count={2} />
  </div>
);
