import { Link } from 'react-router-dom';

const TONES = {
  primary: 'bg-primary-50 text-primary-600',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  neutral: 'bg-surface-100 text-surface-600',
};

export default function StatCard({ icon: Icon, label, value, hint, tone = 'primary', to }) {
  const content = (
    <>
      <span className={`icon-tile h-9 w-9 ${TONES[tone] || TONES.primary}`}>
        {Icon && <Icon size={18} aria-hidden="true" />}
      </span>
      <div className="mt-3 min-w-0">
        <p className="tabular truncate text-xl font-bold leading-tight text-surface-900">{value}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-surface-500">{label}</p>
        {hint && <p className="mt-1 truncate text-[11px] text-surface-400">{hint}</p>}
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="card block p-4 transition hover:shadow-raised active:scale-[0.98]">
        {content}
      </Link>
    );
  }
  return <div className="card p-4">{content}</div>;
}
