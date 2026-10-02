import { Phone, MessageSquare, Navigation } from 'lucide-react';

// Actions rapides : liens natifs (tel:/sms:) + deep-link Maps. Aucun appel API.
export default function QuickActionsRow({ phone, mapsUrl }) {
  const actions = [
    phone && { key: 'call', icon: Phone, label: 'Appeler', href: `tel:${phone}` },
    phone && { key: 'sms', icon: MessageSquare, label: 'SMS', href: `sms:${phone}` },
    mapsUrl && { key: 'gps', icon: Navigation, label: 'Itinéraire', href: mapsUrl, external: true },
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
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white text-label font-semibold text-surface-700 transition hover:bg-surface-50 active:scale-[0.98]"
        >
          <action.icon size={17} className="text-primary-600" aria-hidden="true" />
          {action.label}
        </a>
      ))}
    </div>
  );
}
