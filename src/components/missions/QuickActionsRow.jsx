import { Phone, MessageSquare, Navigation } from 'lucide-react';

// Actions rapides : liens natifs (tel:/sms:) + deep-link Maps. Aucun appel API.
export default function QuickActionsRow({ phone, mapsUrl }) {
  const actions = [
    // Design "Plume" : appeler en bleu plein, SMS en cyan, itineraire en bleu clair.
    phone && { key: 'call', icon: Phone, label: 'Appeler', href: `tel:${phone}`, cls: 'bg-primary-600 text-white hover:bg-primary-700' },
    phone && { key: 'sms', icon: MessageSquare, label: 'SMS', href: `sms:${phone}`, cls: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
    mapsUrl && { key: 'gps', icon: Navigation, label: 'Itinéraire', href: mapsUrl, external: true, cls: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
  ].filter(Boolean);

  if (actions.length === 0) return null;

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}>
      {actions.map((action) => (
        <a
          key={action.key}
          href={action.href}
          target={action.external ? '_blank' : undefined}
          rel={action.external ? 'noreferrer' : undefined}
          className={`flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl text-label font-bold transition active:scale-[0.98] ${action.cls}`}
        >
          <action.icon size={18} aria-hidden="true" />
          {action.label}
        </a>
      ))}
    </div>
  );
}
