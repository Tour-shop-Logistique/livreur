import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Zap, Info } from 'lucide-react';
import BottomSheet from '../common/BottomSheet';
import Callout from '../common/Callout';
import RouteLine from './RouteLine';
import { expressRoute } from './missionRoute';
import { clearIncoming } from '../../store/slices/missionsSlice';
import { MISSION_TYPE_LABEL } from '../../utils/missionFlow';
import { ROUTES } from '../../routes';

// "Nouvelle mission express" : mise en avant d'une mission tout juste publiee
// sur le reseau (WebSocket Mission/nouvelle_disponible, §7.2), quand le livreur
// est disponible et libre. Le modele est par offres (§4.5) : pas d'"accepter",
// le livreur propose son tarif et le client choisit.
export default function NewMissionSheet() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mission = useSelector((state) => {
    const { incoming, available } = state.missions;
    return incoming ? available.items.find((m) => String(m.id) === String(incoming)) || null : null;
  });

  // Mission deja prise entre-temps (retiree de la liste) : rien a afficher.
  if (!mission) return null;

  const close = () => dispatch(clearIncoming());
  const propose = () => {
    dispatch(clearIncoming());
    navigate(`${ROUTES.MISSIONS}?onglet=disponibles&offre=${mission.id}`);
  };

  return (
    <BottomSheet
      open
      onClose={close}
      title="Nouvelle mission express"
      description={mission.expedition?.reference}
      footer={(
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={close}>Plus tard</button>
          <button type="button" className="btn-accent flex-[2]" onClick={propose}>Proposer un tarif</button>
        </div>
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="icon-tile h-11 w-11 bg-accent-50 text-accent-600">
            <Zap size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-surface-900">{MISSION_TYPE_LABEL[mission.type] || 'Mission'} express</p>
            <p className="text-xs text-surface-500">Ouverte à tous les livreurs du réseau</p>
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 p-4">
          <RouteLine {...expressRoute(mission)} />
        </div>

        <Callout tone="neutral" size="sm" icon={Info}>
          Le client compare les offres et choisit. Paiement en espèces à la clôture de la mission.
        </Callout>
      </div>
    </BottomSheet>
  );
}
