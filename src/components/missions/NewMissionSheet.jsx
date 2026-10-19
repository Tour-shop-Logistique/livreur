import { useDispatch, useSelector } from 'react-redux';
import { Zap, Check } from 'lucide-react';
import BottomSheet from '../common/BottomSheet';
import ButtonLabel from '../common/ButtonLabel';
import RouteLine from './RouteLine';
import { expressRoute } from './missionRoute';
import { clearIncoming } from '../../store/slices/missionsSlice';
import { MISSION_TYPE_LABEL, missionPrice, missionPayerLabel } from '../../utils/missionFlow';
import { formatPrice, formatDistance, currencyLabel } from '../../utils/format';
import useAcceptExpress from '../../hooks/useAcceptExpress';

// "Nouvelle course express" : mise en avant d'une course tout juste publiee
// sur le reseau (WebSocket Mission/nouvelle_disponible, §7.2), quand le livreur
// est disponible et libre. Prix impose par le backend (`montant_fixe`) :
// premier arrive, premier servi (CHANGEMENTS_APPS_CLIENT_LIVREUR §2).
// Design "Plume" : bandeau lime, gain en tres grand, action lime.
export default function NewMissionSheet() {
  const dispatch = useDispatch();
  const { accept, isAccepting } = useAcceptExpress();
  const mission = useSelector((state) => {
    const { incoming, available } = state.missions;
    return incoming ? available.items.find((m) => String(m.id) === String(incoming)) || null : null;
  });

  // Course deja prise entre-temps (retiree de la liste) : rien a afficher.
  if (!mission) return null;

  const loading = isAccepting(mission.id);
  const price = missionPrice(mission);
  const close = () => { if (!loading) dispatch(clearIncoming()); };
  const onAccept = async () => {
    await accept(mission);
    dispatch(clearIncoming());
  };

  return (
    <BottomSheet
      open
      onClose={close}
      title={mission.expedition?.reference || 'Nouvelle course'}
      description={`${MISSION_TYPE_LABEL[mission.type] || 'Mission'} · Express`}
      footer={(
        <div className="flex gap-2.5">
          <button type="button" className="btn-secondary btn-lg px-5" onClick={close} disabled={loading}>Plus tard</button>
          <button type="button" className="btn-accent btn-lg flex-1 text-[1.0625rem]" onClick={onAccept} disabled={loading} aria-busy={loading}>
            <ButtonLabel loading={loading} loadingLabel="Acceptation…">
              <Check size={20} strokeWidth={2.8} aria-hidden="true" /> Accepter · {formatPrice(price)}
            </ButtonLabel>
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        {/* Alerte */}
        <div className="flex items-center gap-3 rounded-2xl bg-accent-400 px-3.5 py-3 text-accent-900">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[0.7rem] bg-accent-900 text-accent-300">
            <Zap size={18} fill="currentColor" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-extrabold">Nouvelle course express</p>
            <p className="text-[0.8125rem]">Premier arrivé, premier servi</p>
          </div>
        </div>

        {/* Gain */}
        <div className="flex items-end justify-between gap-3">
          <span className="text-sm font-semibold text-surface-500">Vous gagnez</span>
          <span className="tabular font-heading text-[2.125rem] font-extrabold leading-none tracking-tight text-navy-950">
            {formatPrice(price, '')} <span className="font-sans text-sm font-bold text-surface-500">{currencyLabel()}</span>
          </span>
        </div>

        {mission.distance_km != null && (
          <div className="rounded-2xl bg-primary-50 px-3.5 py-2.5">
            <p className="text-caption font-bold uppercase tracking-[0.05em] text-primary-700">Vous → départ</p>
            <p className="tabular font-heading text-base font-bold text-navy-950">{formatDistance(mission.distance_km)?.replace(/^À /, '')}</p>
          </div>
        )}

        <div className="rounded-2xl border border-[#e3e7ef] p-3.5">
          <RouteLine {...expressRoute(mission)} />
        </div>

        <p className="text-[0.8125rem] leading-relaxed text-surface-500">
          Payé par {missionPayerLabel(mission).toLowerCase()}, crédité automatiquement sur votre solde à la clôture.
        </p>
      </div>
    </BottomSheet>
  );
}
