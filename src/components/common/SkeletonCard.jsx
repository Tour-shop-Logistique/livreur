// Squelettes de chargement (perception de performance) — purement visuel.
export default function SkeletonCard({ count = 3 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-4 p-4">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-2/5" />
              <div className="skeleton h-2.5 w-1/4" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-2.5 w-4/5" />
            <div className="skeleton h-2.5 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
