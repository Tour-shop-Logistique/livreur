import { MapPin, UserRound, Building2 } from 'lucide-react';
import QuickActionsRow from './QuickActionsRow';
import { addressLine, mapsLink } from '../../utils/missionFlow';

// Bloc "a qui / ou" d'une etape : identite, adresse, appeler / SMS / itineraire.
export default function ContactCard({ role, contact, highlight = false, isAgency = false }) {
  if (!contact) return null;
  const address = addressLine(contact);
  const Icon = isAgency ? Building2 : UserRound;

  return (
    <div className={`card p-4 ${highlight ? 'ring-2 ring-accent-200' : ''}`}>
      <div className="flex items-start gap-3">
        <span className={`icon-tile h-10 w-10 ${highlight ? 'bg-accent-50 text-accent-600' : 'bg-surface-100 text-surface-600'}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-surface-400">{role}</p>
          <p className="truncate text-[15px] font-semibold text-surface-900">{contact.nom || 'Non renseigné'}</p>
          {contact.telephone && <p className="tabular text-sm text-surface-600">{contact.telephone}</p>}
          {address && (
            <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-snug text-surface-600">
              <MapPin size={14} className="mt-0.5 shrink-0 text-surface-400" aria-hidden="true" />
              {address}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3.5">
        <QuickActionsRow phone={contact.telephone} mapsUrl={mapsLink(contact)} />
      </div>
    </div>
  );
}
