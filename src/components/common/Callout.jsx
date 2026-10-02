import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Message contextuel (alerte, confirmation, note d'information).
//  - info / success / warning / danger : etats a signaler (bordure de ton)
//  - neutral  : note explicative, sans urgence
//  - emphasis : consigne terrain a ne pas manquer (fond sombre)
// `to` rend tout le bloc cliquable ; `size="sm"` pour les notes sous un formulaire.
const TONES = {
  info: { box: 'border border-primary-200 bg-primary-50', icon: 'text-primary-600', title: 'text-primary-800', text: 'text-primary-700' },
  success: { box: 'border border-success-200 bg-success-50', icon: 'text-success-600', title: 'text-success-800', text: 'text-success-700' },
  warning: { box: 'border border-warning-200 bg-warning-50', icon: 'text-warning-700', title: 'text-warning-800', text: 'text-warning-800' },
  danger: { box: 'border border-danger-200 bg-danger-50', icon: 'text-danger-600', title: 'text-danger-800', text: 'text-danger-700' },
  neutral: { box: 'bg-surface-100', icon: 'text-primary-600', title: 'text-surface-800', text: 'text-surface-600' },
  emphasis: { box: 'bg-surface-900', icon: 'text-accent-300', title: 'text-white', text: 'text-white/85' },
};

export default function Callout({ tone = 'info', icon: Icon, title, children, action, to, size = 'md', role, className = '' }) {
  const t = TONES[tone] || TONES.info;
  const sm = size === 'sm';

  const content = (
    <>
      {Icon && <Icon size={sm ? 16 : 18} className={`mt-0.5 shrink-0 ${t.icon}`} aria-hidden="true" />}
      <div className={`min-w-0 flex-1 leading-relaxed ${sm ? 'text-xs' : 'text-sm'}`}>
        {title && <p className={`font-semibold ${t.title}`}>{title}</p>}
        {children && <div className={`${title ? 'mt-0.5 ' : ''}${t.text}`}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {to && <ChevronRight size={18} className={`mt-0.5 shrink-0 ${t.icon}`} aria-hidden="true" />}
    </>
  );

  const classes = `flex items-start rounded-xl ${sm ? 'gap-2.5 p-3' : 'gap-3 p-3.5'} ${t.box} ${className}`;

  if (to) {
    return <Link to={to} className={`${classes} transition active:scale-[0.99]`}>{content}</Link>;
  }
  return <div className={classes} role={role}>{content}</div>;
}
