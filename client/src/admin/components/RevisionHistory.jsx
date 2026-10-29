import { useCallback, useEffect, useRef, useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import { toApiError } from '../../services/api.js';
import { Badge, Button, EmptyState, ErrorBox, Modal, Spinner, useUi } from './ui.jsx';

/**
 * Lists revisions from `load()` and restores one via `restore(revision)`.
 * `restoreHint` tells the admin what restoring does for this content type.
 */
export default function RevisionHistory({ open, onClose, load, restore, restoreHint, onRestored }) {
  const { confirm, toast } = useUi();
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [busy, setBusy] = useState(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    loadRef
      .current()
      .then((items) => setState({ loading: false, items, error: null }))
      .catch((err) => setState({ loading: false, items: [], error: toApiError(err) }));
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const doRestore = async (rev) => {
    const ok = await confirm({ title: `Restore version ${rev.version}?`, message: restoreHint, confirmLabel: 'Restore' });
    if (!ok) return;
    setBusy(rev._id);
    try {
      const result = await restore(rev);
      toast(`Version ${rev.version} restored`);
      onRestored?.(result);
      onClose();
    } catch (err) {
      toast(toApiError(err).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Revision history" size="md">
      <ErrorBox error={state.error} onRetry={refresh} />
      {state.loading ? (
        <Spinner />
      ) : state.items.length === 0 ? (
        <EmptyState icon={History} title="No revisions yet" description="A revision is saved every time you publish or save changes." />
      ) : (
        <ol className="divide-y divide-slate-100">
          {state.items.map((rev, i) => (
            <li key={rev._id} className="flex items-center gap-3 py-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">v{rev.version}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {new Date(rev.createdAt).toLocaleString()} {i === 0 && <Badge color="green">Latest</Badge>}{' '}
                  <Badge color={rev.action === 'publish' ? 'blue' : rev.action === 'restore' ? 'amber' : 'slate'}>{rev.action}</Badge>
                </p>
                <p className="truncate text-xs text-slate-500">
                  {rev.author?.name ? `by ${rev.author.name}` : ''} {rev.note && `· ${rev.note}`}
                </p>
              </div>
              <Button size="sm" icon={RotateCcw} loading={busy === rev._id} onClick={() => doRestore(rev)}>
                Restore
              </Button>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
