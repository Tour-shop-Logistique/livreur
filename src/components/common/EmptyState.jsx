const TONES = {
  default: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-danger-50 text-danger-600',
};

export default function EmptyState({ icon: Icon, title, description, action, tone = 'default', compact = false }) {
  return (
    <div className={`card flex flex-col items-center justify-center gap-3 px-6 text-center ${compact ? 'py-8' : 'py-12'}`}>
      {Icon && (
        <div className={`icon-tile h-12 w-12 rounded-2xl ${TONES[tone] || TONES.default}`}>
          <Icon size={22} aria-hidden="true" />
        </div>
      )}
      <div className="max-w-xs">
        <p className="font-semibold text-surface-900">{title}</p>
        {description && <p className="mt-1 text-sm leading-relaxed text-surface-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
