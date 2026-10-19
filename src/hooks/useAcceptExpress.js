import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { acceptExpressMission, fetchActiveMissions } from '../store/slices/missionsSlice';
import { acceptMarketplaceExpress, fetchMarketplaceMine } from '../store/slices/marketplaceSlice';
import { fetchAbonnementStatus } from '../store/slices/abonnementSlice';
import { missionDetailPath, marketplaceDetailPath } from '../routes';

// Acceptation d'une course express a prix impose — premier arrive, premier
// servi : missions d'expedition (CHANGEMENTS_APPS_CLIENT_LIVREUR §2) et
// livraisons marketplace (MARKETPLACE_LIVRAISON_3_MODES.md). "Déjà prise" est
// un cas normal : la course est retiree de la liste et on previent sans bloquer.
// `accept(item, { kind, redirect })` renvoie true, 'taken' ou false (erreur).
// `kind` : 'mission' (defaut) | 'marketplace'.
export default function useAcceptExpress() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const missionPending = useSelector((state) => state.missions.pendingAction);
  const marketplacePending = useSelector((state) => state.marketplace.pendingAction);

  const accept = useCallback(async (item, { kind = 'mission', redirect = true } = {}) => {
    const marketplace = kind === 'marketplace';
    const thunk = marketplace ? acceptMarketplaceExpress : acceptExpressMission;
    const result = await dispatch(thunk(item.id));
    if (thunk.fulfilled.match(result)) {
      toast.success(marketplace ? 'Livraison acceptée. Elle est à vous !' : 'Course acceptée. Elle est à vous !');
      if (marketplace) {
        dispatch(fetchMarketplaceMine());
        // Une premiere livraison acceptee peut demarrer l'abonnement marketplace.
        dispatch(fetchAbonnementStatus());
      } else {
        dispatch(fetchActiveMissions());
      }
      if (redirect) navigate(marketplace ? marketplaceDetailPath(item.id) : missionDetailPath(item.id));
      return true;
    }
    const { message, taken } = result.payload || {};
    if (taken) {
      toast.message('Course déjà prise', { description: 'Un autre livreur a été plus rapide. Elle a été retirée de la liste.' });
      return 'taken';
    }
    toast.error(message || "Impossible d'accepter cette course.");
    return false;
  }, [dispatch, navigate]);

  const isAccepting = useCallback(
    (id) => [missionPending, marketplacePending].some((p) => p != null && String(p) === String(id)),
    [missionPending, marketplacePending],
  );

  return { accept, isAccepting, busy: missionPending != null || marketplacePending != null };
}
