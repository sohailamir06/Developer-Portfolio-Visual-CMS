import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, FileText, ImageIcon, Search, Trash2, Upload } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { cx } from '../../utils/links.js';
import { Badge, Button, EmptyState, ErrorBox, Field, Input, Modal, Spinner, Textarea, useUi } from './ui.jsx';

const ACCEPT = {
  image: 'image/jpeg,image/png,image/gif,image/webp,image/avif',
  document: 'application/pdf',
  all: 'image/jpeg,image/png,image/gif,image/webp,image/avif,application/pdf',
};

const formatBytes = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Upload zone used by the library and directly inside image fields. */
export function useUploader({ onUploaded, accept = 'all' }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const upload = useCallback(
    async (fileList) => {
      const files = [...fileList];
      if (!files.length) return;
      const allowed = ACCEPT[accept].split(',');
      const bad = files.find((f) => !allowed.includes(f.type));
      if (bad) {
        setError({ message: `"${bad.name}" is not a supported file type.` });
        return;
      }
      setError(null);
      setProgress(0);
      try {
        const created = await adminApi.media.upload(files, (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)));
        onUploaded?.(created);
      } catch (err) {
        setError(toApiError(err));
      } finally {
        setProgress(null);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [accept, onUploaded],
  );

  const input = <input ref={inputRef} type="file" className="hidden" accept={ACCEPT[accept]} multiple onChange={(e) => upload(e.target.files)} />;
  return { upload, progress, error, input, open: () => inputRef.current?.click(), clearError: () => setError(null) };
}

export default function MediaLibrary({ mode = 'manage', type = 'all', onSelect }) {
  const { toast, confirm } = useUi();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [state, setState] = useState({ loading: true, items: [], total: 0, provider: '', maxFileMb: 5 });
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await adminApi.media.list({ q: debounced || undefined, type, limit: 100 });
      setState({ loading: false, ...res });
      setError(null);
    } catch (err) {
      setError(toApiError(err));
      setState((s) => ({ ...s, loading: false }));
    }
  }, [debounced, type]);

  useEffect(() => {
    load();
  }, [load]);

  const uploader = useUploader({
    accept: type,
    onUploaded: (created) => {
      toast(`Uploaded ${created.length} file${created.length > 1 ? 's' : ''}`);
      setState((s) => ({ ...s, items: [...created, ...s.items], total: s.total + created.length }));
      setSelected(created[0]);
    },
  });

  const remove = async (item) => {
    const ok = await confirm({ title: 'Delete file?', message: `“${item.originalName}” will be permanently removed.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await adminApi.media.remove(item._id);
    } catch (err) {
      const e = toApiError(err);
      if (e.status !== 409) return toast(e.message, 'error');
      const force = await confirm({
        title: 'This file is in use',
        danger: true,
        confirmLabel: 'Delete anyway',
        message: (
          <>
            <p>It is referenced by:</p>
            <ul className="mt-2 list-inside list-disc">
              {e.details.map((d, i) => (
                <li key={i}>{d.label}</li>
              ))}
            </ul>
            <p className="mt-3">Deleting it will leave a broken image in those places.</p>
          </>
        ),
      });
      if (!force) return;
      try {
        await adminApi.media.remove(item._id, true);
      } catch (err2) {
        return toast(toApiError(err2).message, 'error');
      }
    }
    toast('File deleted');
    setSelected(null);
    setState((s) => ({ ...s, items: s.items.filter((i) => i._id !== item._id), total: s.total - 1 }));
  };

  const onSaved = (updated) => {
    setState((s) => ({ ...s, items: s.items.map((i) => (i._id === updated._id ? updated : i)) }));
    setSelected(updated);
  };

  return (
    <div
      className={cx('relative', dragOver && 'ring-2 ring-blue-500 ring-offset-4')}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        uploader.upload(e.dataTransfer.files);
      }}
    >
      {uploader.input}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, alt text or caption" className="pl-9" aria-label="Search media" />
        </div>
        <Button variant="primary" icon={Upload} onClick={uploader.open} loading={uploader.progress !== null}>
          {uploader.progress !== null ? `Uploading ${uploader.progress}%` : 'Upload'}
        </Button>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Drag files here or click Upload. JPEG, PNG, GIF, WebP, AVIF{type !== 'image' && ' or PDF'} · max {state.maxFileMb} MB · storage: <Badge color={state.provider === 'cloudinary' ? 'green' : 'slate'}>{state.provider || '…'}</Badge>
      </p>
      <div className="space-y-3">
        <ErrorBox error={uploader.error} />
        <ErrorBox error={error} onRetry={load} />
      </div>

      <div className={cx('mt-3 grid gap-5', selected && mode === 'manage' && 'lg:grid-cols-[1fr_320px]')}>
        <div>
          {state.loading && !state.items.length ? (
            <Spinner />
          ) : state.items.length === 0 ? (
            <EmptyState icon={ImageIcon} title={debounced ? 'No files match your search' : 'No files yet'} description="Upload images to use them across your site." action={<Button icon={Upload} onClick={uploader.open}>Upload files</Button>} />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {state.items.map((item) => {
                const isSel = selected?._id === item._id;
                return (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      onDoubleClick={() => mode === 'pick' && onSelect?.(item)}
                      className={cx('group relative block w-full overflow-hidden rounded-lg border bg-slate-100 text-left transition', isSel ? 'border-blue-600 ring-2 ring-blue-600' : 'border-slate-200 hover:border-slate-400')}
                      aria-pressed={isSel}
                      aria-label={item.alt || item.originalName}
                    >
                      <div className="aspect-square">
                        {item.mimeType.startsWith('image/') ? (
                          <img src={item.url} alt={item.alt} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-400">
                            <FileText size={36} />
                          </div>
                        )}
                      </div>
                      <div className="truncate bg-white px-2 py-1.5 text-[11px] text-slate-600">{item.originalName}</div>
                      {isSel && (
                        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected && mode === 'manage' && <MediaDetails key={selected._id} item={selected} onSaved={onSaved} onDelete={() => remove(selected)} />}
      </div>

      {mode === 'pick' && (
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
          <span className="truncate text-sm text-slate-600">{selected ? selected.originalName : 'Select a file'}</span>
          <Button variant="primary" disabled={!selected} onClick={() => onSelect?.(selected)}>
            Use selected
          </Button>
        </div>
      )}
    </div>
  );
}

function MediaDetails({ item, onSaved, onDelete }) {
  const { toast } = useUi();
  const [alt, setAlt] = useState(item.alt || '');
  const [caption, setCaption] = useState(item.caption || '');
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    adminApi.media.usage(item._id).then(setUsage).catch(() => setUsage([]));
  }, [item._id]);

  const save = async () => {
    setSaving(true);
    try {
      onSaved(await adminApi.media.update(item._id, { alt, caption }));
      toast('Details saved');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const absoluteUrl = item.url.startsWith('/') ? window.location.origin + item.url : item.url;

  return (
    <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-4 lg:self-start">
      {item.mimeType.startsWith('image/') ? (
        <img src={item.url} alt={item.alt} className="max-h-56 w-full rounded-lg bg-slate-100 object-contain" />
      ) : (
        <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-slate-100 p-4 text-sm text-blue-700 underline">
          <FileText size={18} /> Open PDF
        </a>
      )}
      <dl className="grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div>
          <dt className="font-semibold text-slate-700">Size</dt>
          <dd>{formatBytes(item.size)}</dd>
        </div>
        {item.width && (
          <div>
            <dt className="font-semibold text-slate-700">Dimensions</dt>
            <dd>
              {item.width} × {item.height}
            </dd>
          </div>
        )}
        <div className="col-span-2">
          <dt className="font-semibold text-slate-700">Uploaded</dt>
          <dd>{new Date(item.createdAt).toLocaleString()}</dd>
        </div>
      </dl>
      <Field label="Alternative text" hint="Describe the image for screen readers and search engines.">
        <Input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} />
      </Field>
      <Field label="Caption">
        <Textarea rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={save} loading={saving}>
          Save details
        </Button>
        <Button
          size="sm"
          icon={Copy}
          onClick={() => navigator.clipboard?.writeText(absoluteUrl).then(() => toast('URL copied', 'info'))}
        >
          Copy URL
        </Button>
        <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={onDelete}>
          Delete
        </Button>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-slate-700">Used in</h3>
        {usage === null ? (
          <p className="text-xs text-slate-400">Checking…</p>
        ) : usage.length ? (
          <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
            {usage.map((u, i) => (
              <li key={i}>• {u.label}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Not used anywhere — safe to delete.</p>
        )}
      </div>
    </aside>
  );
}

export function MediaPickerModal({ open, onClose, onSelect, type = 'image', title = 'Choose from Media Library' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      {open && (
        <MediaLibrary
          mode="pick"
          type={type}
          onSelect={(m) => {
            onSelect(m);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
