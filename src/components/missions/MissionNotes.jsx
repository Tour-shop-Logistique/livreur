import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { NotebookPen, Plus } from 'lucide-react';
import BottomSheet from '../common/BottomSheet';
import FormField from '../common/FormField';
import FilePicker from '../common/FilePicker';
import ButtonLabel from '../common/ButtonLabel';
import missionService from '../../services/missionService';
import { apiErrorMessage } from '../../services/api';
import { formatDateTime } from '../../utils/format';

// Notes libres du livreur sur une mission (PARCOURS_LIVREUR_API.md §4.6) :
// visibles par le backoffice et l'agence. Ajout possible tant que la mission
// est `assignee` (422 "Mission non modifiable." sinon).
const MAX = 1000;

export default function MissionNotes({ missionId, editable }) {
  const [notes, setNotes] = useState(null);
  const [open, setOpen] = useState(false);
  const [contenu, setContenu] = useState('');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    missionService.fetchNotes(missionId)
      .then((data) => setNotes(data?.notes ?? []))
      .catch(() => setNotes([]));
  }, [missionId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (open) { setContenu(''); setPhoto(null); setError(null); }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!contenu.trim()) { setError('Saisissez votre note.'); return; }
    setSaving(true);
    try {
      const data = await missionService.addNote(missionId, { contenu: contenu.trim(), photo });
      if (data?.note) setNotes((list) => [data.note, ...(list || [])]);
      else load();
      toast.success('Note ajoutée.');
      setOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, "Impossible d'ajouter la note."));
    } finally {
      setSaving(false);
    }
  };

  if (!editable && !notes?.length) return null;

  return (
    <section className="card p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-surface-900">
          <NotebookPen size={16} className="text-surface-400" aria-hidden="true" /> Mes notes
        </h2>
        {editable && (
          <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(true)}>
            <Plus size={14} aria-hidden="true" /> Ajouter
          </button>
        )}
      </div>
      {notes === null && <div className="h-10 animate-pulse rounded-xl bg-surface-100" />}
      {notes?.length === 0 && (
        <p className="text-xs text-surface-500">Signalez un imprévu (client absent, adresse erronée…) : la note est visible par le backoffice et l'agence.</p>
      )}
      {notes?.length > 0 && (
        <ul className="divide-y divide-surface-100">
          {notes.map((n) => (
            <li key={n.id} className="py-2.5">
              <p className="whitespace-pre-line text-sm text-surface-800">{n.contenu}</p>
              {n.photo_url && (
                <a href={n.photo_url} target="_blank" rel="noreferrer" className="mt-2 block w-24 overflow-hidden rounded-lg border border-surface-200">
                  <img src={n.photo_url} alt="Photo jointe" className="h-24 w-24 object-cover" />
                </a>
              )}
              <p className="mt-1 text-caption text-surface-500">{formatDateTime(n.created_at)}</p>
            </li>
          ))}
        </ul>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nouvelle note" description="Visible par le backoffice et l'agence concernée.">
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Note" htmlFor="note-contenu" error={error} hint={`${contenu.length}/${MAX}`}>
            <textarea
              id="note-contenu"
              rows={4}
              maxLength={MAX}
              className="input-field"
              placeholder="Ex. Client absent, rappelé à 14h"
              value={contenu}
              onChange={(e) => { setContenu(e.target.value); setError(null); }}
              autoFocus
            />
          </FormField>
          <FormField label="Photo" optional>
            <FilePicker id="note-photo" value={photo} onChange={setPhoto} capture="environment" label="Joindre une photo" />
          </FormField>
          <button type="submit" aria-busy={saving} className="btn-primary btn-lg w-full" disabled={saving}>
            <ButtonLabel loading={saving} loadingLabel="Envoi…">Enregistrer la note</ButtonLabel>
          </button>
        </form>
      </BottomSheet>
    </section>
  );
}
