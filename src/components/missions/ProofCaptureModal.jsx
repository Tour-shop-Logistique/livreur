import { useEffect, useState } from 'react';
import { MapPin, Loader2, ShieldCheck } from 'lucide-react';
import BottomSheet from '../common/BottomSheet';
import SignaturePad from '../common/SignaturePad';
import FilePicker from '../common/FilePicker';
import CodeInput from '../common/CodeInput';
import useGeolocation from '../../hooks/useGeolocation';

// Capture de preuve commune aux etapes du workflow :
//  - enlevement/confirm : photo + signature + geo, tous facultatifs mais recommandes
//  - livraison/validate : code a 4 chiffres OBLIGATOIRE + preuve facultative
//  - marketplace/valider: code OBLIGATOIRE + photo facultative (pas de signature/geo)
export default function ProofCaptureModal({
  open, onClose, onSubmit, loading, error,
  title, description, submitLabel = 'Valider',
  requireCode = false, codeLabel = 'Code de validation',
  withSignature = true, withGeo = true, photoLabel = 'Photo du colis',
}) {
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [code, setCode] = useState('');
  const { position, loading: locating, error: geoError, locate } = useGeolocation();

  useEffect(() => {
    if (open) {
      setPhoto(null);
      setSignature(null);
      setCode('');
      if (withGeo) locate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const codeOk = !requireCode || /^\d{4}$/.test(code);
  const canSubmit = codeOk && !loading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      code: requireCode ? code : undefined,
      photo: photo || undefined,
      signature: withSignature ? signature || undefined : undefined,
      lat: withGeo ? position?.lat : undefined,
      lng: withGeo ? position?.lng : undefined,
    });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={(
        <button type="submit" form="proof-form" className="btn-accent btn-lg w-full" disabled={!canSubmit}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Envoi…</> : submitLabel}
        </button>
      )}
    >
      <form id="proof-form" onSubmit={handleSubmit} className="space-y-5">
        {requireCode && (
          <div className="rounded-2xl bg-surface-50 p-4">
            <p className="mb-3 text-center text-sm font-medium text-surface-700">{codeLabel}</p>
            <CodeInput length={4} value={code} onChange={setCode} autoFocus invalid={Boolean(error)} label={codeLabel} />
            {error && <p className="field-error mt-3 text-center" role="alert">{error}</p>}
          </div>
        )}

        <div>
          <p className="label">{photoLabel} <span className="font-normal text-surface-400">(facultatif)</span></p>
          <FilePicker id="proof-photo" value={photo} onChange={setPhoto} capture="environment" label="Prendre une photo" />
        </div>

        {withSignature && (
          <div>
            <p className="label">Signature <span className="font-normal text-surface-400">(facultatif)</span></p>
            <SignaturePad onChange={setSignature} />
          </div>
        )}

        {withGeo && (
          <p className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2.5 text-xs text-surface-600">
            {locating
              ? <Loader2 size={14} className="animate-spin text-primary-600" aria-hidden="true" />
              : <MapPin size={14} className={position ? 'text-success-600' : 'text-surface-400'} aria-hidden="true" />}
            {position
              ? 'Position GPS enregistrée avec la preuve'
              : locating ? 'Localisation en cours…' : geoError ? 'Position indisponible (non bloquant)' : 'Position non capturée'}
          </p>
        )}

        {!requireCode && error && <p className="field-error" role="alert">{error}</p>}

        <p className="flex items-start gap-2 text-xs leading-relaxed text-surface-500">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-success-600" aria-hidden="true" />
          Les preuves (photo, signature, position) protègent le livreur en cas de litige. Elles sont horodatées automatiquement.
        </p>
      </form>
    </BottomSheet>
  );
}
