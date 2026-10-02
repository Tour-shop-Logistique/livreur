import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw, Wallet, WifiOff, Info, Landmark,
} from 'lucide-react';
import TopBar from '../../components/common/TopBar';
import IconButton from '../../components/common/IconButton';
import SkeletonCard from '../../components/common/SkeletonCard';
import EmptyState from '../../components/common/EmptyState';
import BottomSheet from '../../components/common/BottomSheet';
import FormField from '../../components/common/FormField';
import Callout from '../../components/common/Callout';
import EarningsStats from '../../components/earnings/EarningsStats';
import StatusBadge from '../../components/missions/StatusBadge';
import { fetchBalance, fetchEarningsHistory, requestWithdrawal } from '../../store/slices/earningsSlice';
import { formatPrice, formatDateTime } from '../../utils/format';
import ButtonLabel from '../../components/common/ButtonLabel';

// Solde reel des missions d'expedition (PARCOURS_LIVREUR_API.md §4.6).
const RETRAIT_STATUT = {
  en_attente: { label: 'En attente', tone: 'waiting' },
  traite: { label: 'Versé', tone: 'success' },
  rejete: { label: 'Rejeté', tone: 'danger' },
};

function WithdrawSheet({ open, onClose, solde, loading, onSubmit }) {
  const [montant, setMontant] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setMontant(''); setNotes(''); setError(null); }
  }, [open]);

  const submit = (e) => {
    e.preventDefault();
    const value = Number(montant);
    if (!value || value <= 0) { setError('Saisissez un montant.'); return; }
    if (solde != null && value > solde) { setError('Le montant dépasse votre solde disponible.'); return; }
    onSubmit({ montant: value, notes: notes.trim() }, setError);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Demander un retrait" description={`Solde disponible : ${formatPrice(solde)}`}>
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Montant" htmlFor="retrait-montant" error={error}>
          <div className="relative">
            <input
              id="retrait-montant" type="number" min="1" inputMode="numeric" placeholder="0"
              className={`input-field tabular pr-16 text-xl font-semibold ${error ? 'input-error' : ''}`}
              value={montant} onChange={(e) => { setMontant(e.target.value); setError(null); }} autoFocus
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-surface-400">FCFA</span>
          </div>
        </FormField>
        {solde > 0 && (
          <button type="button" className="text-sm font-semibold text-primary-600" onClick={() => setMontant(String(solde))}>
            Tout retirer ({formatPrice(solde)})
          </button>
        )}
        <FormField label="Moyen de versement" htmlFor="retrait-notes" optional hint="Ex. Orange Money +225 07 00 00 00 00">
          <input id="retrait-notes" className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mobile money et numéro" />
        </FormField>
        <Callout tone="neutral" size="sm" icon={Info}>
          Votre solde n'est débité qu'une fois le versement effectué par votre backoffice de rattachement.
        </Callout>
        <button type="submit" aria-busy={loading} className="btn-primary btn-lg w-full" disabled={loading}>
          <ButtonLabel loading={loading} loadingLabel="Envoi…">Envoyer la demande</ButtonLabel>
        </button>
      </form>
    </BottomSheet>
  );
}

export default function EarningsPage() {
  const dispatch = useDispatch();
  const { balance, history, withdrawal } = useSelector((state) => state.earnings);
  const userSolde = useSelector((state) => state.auth.user?.solde_livreur);
  const marketplaceItems = useSelector((state) => state.marketplace.mine.items);
  const [sheetOpen, setSheetOpen] = useState(false);

  const solde = balance.value ?? (userSolde != null ? Number(userSolde) : null);

  const load = () => {
    dispatch(fetchBalance());
    dispatch(fetchEarningsHistory());
  };

  useEffect(() => {
    dispatch(fetchEarningsHistory());
  }, [dispatch]);

  const { totalCredits, pendingWithdrawals } = useMemo(() => {
    let credits = 0;
    let pending = 0;
    history.items.forEach((h) => {
      if (h.type === 'credit') credits += Number(h.montant) || 0;
      if (h.type === 'retrait' && h.detail?.statut === 'en_attente') pending += Math.abs(Number(h.montant) || 0);
    });
    return { totalCredits: credits, pendingWithdrawals: pending };
  }, [history.items]);

  const handleWithdraw = async (payload, setError) => {
    const result = await dispatch(requestWithdrawal(payload));
    if (requestWithdrawal.fulfilled.match(result)) {
      toast.success('Demande de retrait enregistrée.');
      setSheetOpen(false);
    } else {
      setError(result.payload);
    }
  };

  return (
    <div>
      <TopBar
        title="Mes gains"
        right={<IconButton icon={RefreshCw} size={19} label="Actualiser" onClick={load} spinning={history.status === 'loading'} />}
      />

      <div className="page-container space-y-5 py-4">
        {/* Solde */}
        <section className="card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-surface-500">
            <span className="icon-tile h-8 w-8 bg-success-50 text-success-600"><Wallet size={16} aria-hidden="true" /></span>
            Solde disponible
          </div>
          <p className="tabular mt-2 font-heading text-3xl font-bold text-surface-900">{solde != null ? formatPrice(solde) : '—'}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-surface-50 p-3">
              <dt className="text-xs text-surface-500">Gains cumulés</dt>
              <dd className="tabular font-semibold text-surface-900">{formatPrice(totalCredits)}</dd>
            </div>
            <div className="rounded-xl bg-surface-50 p-3">
              <dt className="text-xs text-surface-500">Retraits en attente</dt>
              <dd className="tabular font-semibold text-surface-900">{formatPrice(pendingWithdrawals)}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={() => setSheetOpen(true)}
            disabled={!solde || solde <= 0}
          >
            <Landmark size={18} aria-hidden="true" /> Demander un retrait
          </button>
        </section>

        <p className="flex gap-2 px-1 text-xs leading-relaxed text-surface-500">
          <Info size={15} className="mt-px shrink-0 text-surface-400" aria-hidden="true" />
          Chaque mission d'expédition clôturée crédite automatiquement votre solde. Les courses marketplace sont réglées directement avec le vendeur et n'apparaissent pas ici.
        </p>

        {history.loaded && history.status !== 'error' && (
          <EarningsStats historyItems={history.items} marketplaceItems={marketplaceItems} />
        )}

        {/* Historique */}
        <section>
          <h2 className="section-title">Historique</h2>
          {history.status === 'loading' && history.items.length === 0 && <SkeletonCard count={3} />}
          {history.status === 'error' && history.items.length === 0 && (
            <EmptyState
              icon={WifiOff} tone="error" title="Chargement impossible" description={history.error}
              action={<button type="button" className="btn-secondary btn-sm" onClick={load}><RefreshCw size={14} /> Réessayer</button>}
            />
          )}
          {history.loaded && history.status !== 'error' && history.items.length === 0 && (
            <EmptyState icon={Wallet} title="Aucun mouvement" description="Vos gains apparaîtront ici après votre première mission clôturée." />
          )}
          {history.items.length > 0 && (
            <ul className="card divide-y divide-surface-100">
              {history.items.map((h, i) => {
                const credit = h.type === 'credit';
                const reference = h.detail?.mission?.expedition?.reference;
                const statut = RETRAIT_STATUT[h.detail?.statut];
                return (
                  <li key={h.detail?.id || i} className="flex items-center gap-3 p-4">
                    <span className={`icon-tile h-10 w-10 ${credit ? 'bg-success-50 text-success-600' : 'bg-surface-100 text-surface-600'}`}>
                      {credit ? <ArrowDownLeft size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-surface-900">
                        {credit ? `Mission ${reference || 'clôturée'}` : 'Demande de retrait'}
                      </p>
                      <p className="text-xs text-surface-500">{formatDateTime(h.date)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className={`tabular text-sm font-bold ${credit ? 'text-success-700' : 'text-surface-900'}`}>
                        {credit ? '+' : '−'}{formatPrice(Math.abs(Number(h.montant)))}
                      </p>
                      {!credit && statut && <StatusBadge label={statut.label} tone={statut.tone} size="sm" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <WithdrawSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        solde={solde}
        loading={withdrawal.status === 'loading'}
        onSubmit={handleWithdraw}
      />
    </div>
  );
}
