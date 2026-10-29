import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, Plus, Rocket, Save, Trash2 } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { useAsync } from '../../utils/hooks.js';
import { pagePath } from '../utils.js';
import SeoFields from '../components/SeoFields.jsx';
import ImageField from '../components/ImageField.jsx';
import { LinkInput } from '../components/LinkFields.jsx';
import { Badge, Button, Card, ErrorBox, Field, IconButton, Input, Modal, PageHeader, Select, Spinner, Tabs, Textarea, Toggle, useUi } from '../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function SeoModal({ item, onClose, onSaved }) {
  const { toast } = useUi();
  const [seo, setSeo] = useState(item.seo || {});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const save = async (publish) => {
    setBusy(publish ? 'publish' : 'save');
    setError(null);
    try {
      if (item.kind === 'page') {
        await adminApi.pages.updateSeo(item.id, seo);
        if (publish) await adminApi.pages.publish(item.id, 'SEO update');
        toast(publish ? 'SEO saved and published' : 'Saved to draft — publish the page to apply');
      } else {
        const full = await adminApi.projects.get(item.id);
        const { _id, __v, createdAt, updatedAt, publishedAt, ...body } = full;
        await adminApi.projects.update(item.id, { ...body, seo });
        toast('Project SEO saved');
      }
      onSaved();
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`SEO · ${item.title}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          {item.kind === 'page' ? (
            <>
              <Button icon={Save} onClick={() => save(false)} loading={busy === 'save'}>
                Save draft
              </Button>
              <Button variant="success" icon={Rocket} onClick={() => save(true)} loading={busy === 'publish'}>
                Save & publish
              </Button>
            </>
          ) : (
            <Button variant="primary" icon={Save} onClick={() => save(false)} loading={busy === 'save'}>
              Save
            </Button>
          )}
        </>
      }
    >
      <ErrorBox error={error} />
      {item.kind === 'page' && item.hasOtherChanges && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">This page also has other unpublished draft changes. “Save & publish” will publish those too.</p>
      )}
      <SeoFields value={seo} onChange={setSeo} fallbackTitle={item.title} path={item.path} />
    </Modal>
  );
}

function Defaults() {
  const { toast } = useUi();
  const { data: settings, loading, error, setData } = useAsync(() => adminApi.settings.get(), []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const seo = settings.seo;
  const set = (patch) => setData((s) => ({ ...s, seo: { ...s.seo, ...patch } }));
  const save = async () => {
    setBusy(true);
    setErr(null);
    const { _id, __v, key, createdAt, updatedAt, updatedBy, version, ...body } = settings;
    try {
      setData(await adminApi.settings.update(body));
      toast('SEO defaults saved');
    } catch (e) {
      setErr(toApiError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="max-w-2xl space-y-4 p-5">
      <ErrorBox error={err} />
      <Field label="Title template" hint="%s is replaced with the page title, e.g. “%s | Jane Doe”.">
        <Input value={seo.titleTemplate} onChange={(e) => set({ titleTemplate: e.target.value })} />
      </Field>
      <Field label="Default meta description" hint="Used when a page has no description of its own.">
        <Textarea rows={3} value={seo.defaultDescription} onChange={(e) => set({ defaultDescription: e.target.value })} maxLength={320} />
      </Field>
      <Field label="Default social sharing image">
        <ImageField value={{ url: seo.ogImage }} onChange={(img) => set({ ogImage: img.url })} options={[]} />
      </Field>
      <Field label="X / Twitter handle">
        <Input value={seo.twitterHandle} onChange={(e) => set({ twitterHandle: e.target.value })} placeholder="@handle" />
      </Field>
      <Toggle label="Allow search engines to index the site" description="Turn off while the site is under construction." checked={seo.allowIndexing} onChange={(allowIndexing) => set({ allowIndexing })} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={Save} onClick={save} loading={busy}>
          Save defaults
        </Button>
        <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          sitemap.xml <ExternalLink size={13} />
        </a>
        <a href="/robots.txt" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          robots.txt <ExternalLink size={13} />
        </a>
      </div>
    </Card>
  );
}

function Redirects({ redirects, onChange }) {
  const { toast, confirm } = useUi();
  const [form, setForm] = useState({ from: '', to: '', statusCode: 301 });
  const [error, setError] = useState(null);
  const add = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.seo.createRedirect({ ...form, statusCode: Number(form.statusCode) });
      setForm({ from: '', to: '', statusCode: 301 });
      onChange();
      toast('Redirect added');
    } catch (err) {
      setError(toApiError(err));
    }
  };
  const remove = async (r) => {
    if (!(await confirm({ title: 'Delete redirect?', message: `${r.from} will no longer redirect.`, confirmLabel: 'Delete', danger: true }))) return;
    await adminApi.seo.deleteRedirect(r._id).catch((err) => toast(toApiError(err).message, 'error'));
    onChange();
  };
  return (
    <Card className="p-5">
      <p className="mb-4 text-sm text-slate-600">Redirects are created automatically when a published page or project URL changes. You can also add your own.</p>
      <form onSubmit={add} className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_120px_auto]">
        <Input value={form.from} onChange={(e) => setForm((f) => ({ ...f, from: e.target.value.trim() }))} placeholder="/old-path" aria-label="From path" required />
        <LinkInput value={form.to} onChange={(to) => setForm((f) => ({ ...f, to }))} placeholder="/new-path or https://…" />
        <Select value={form.statusCode} onChange={(e) => setForm((f) => ({ ...f, statusCode: e.target.value }))} options={[[301, '301 Permanent'], [302, '302 Temporary']]} aria-label="Type" />
        <Button type="submit" icon={Plus}>
          Add
        </Button>
      </form>
      <ErrorBox error={error} />
      {redirects.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">No redirects.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {redirects.map((r) => (
            <li key={r._id} className="flex flex-wrap items-center gap-2 py-2">
              <code className="rounded bg-slate-100 px-1.5">{r.from}</code>→<code className="rounded bg-slate-100 px-1.5">{r.to}</code>
              <Badge>{r.statusCode}</Badge>
              {r.auto && <Badge color="blue">auto</Badge>}
              <span className="text-xs text-slate-400">{r.hits} hits</span>
              <IconButton icon={Trash2} label="Delete redirect" variant="danger-ghost" className="ml-auto" onClick={() => remove(r)} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Seo() {
  const { user } = useAuth();
  const [tab, setTab] = useState('content');
  const [editing, setEditing] = useState(null);
  const { data, loading, error, reload } = useAsync(() => adminApi.seo.overview(), []);

  const rows = data
    ? [
        ...data.pages.map((p) => ({ kind: 'page', id: p._id, title: p.draft?.title, path: pagePath(p.slug), seo: p.draft?.seo, live: p.status === 'published', hasOtherChanges: p.hasUnpublishedChanges })),
        ...data.projects.map((p) => ({ kind: 'project', id: p._id, title: p.title, path: `/projects/${p.slug}`, seo: p.seo, live: p.status === 'published', summary: p.summary })),
      ]
    : [];

  return (
    <>
      <PageHeader title="SEO" description="Control how your pages appear in search engines and when shared on social media." />
      <Tabs
        tabs={[['content', 'Pages & projects'], ['redirects', 'Redirects', data?.redirects.length], ...(user?.role === 'admin' ? [['defaults', 'Site defaults']] : [])]}
        value={tab}
        onChange={setTab}
        className="mb-5"
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : tab === 'defaults' ? (
        <Defaults />
      ) : tab === 'redirects' ? (
        <Redirects redirects={data.redirects} onChange={reload} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Content</th>
                <th className="px-4 py-2.5 font-semibold">SEO title</th>
                <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Description</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const missing = !r.seo?.description && !(r.kind === 'project' && r.summary);
                return (
                  <tr key={`${r.kind}-${r.id}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-slate-500">
                        {r.kind} · {r.path} {!r.live && <Badge>not live</Badge>} {r.seo?.noindex && <Badge color="red">noindex</Badge>}
                      </p>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">{r.seo?.title || <span className="text-slate-400">— uses title</span>}</td>
                    <td className="hidden max-w-[320px] truncate px-4 py-3 md:table-cell">
                      {r.seo?.description ? <span className="text-slate-600">{r.seo.description}</span> : missing ? <Badge color="amber">Missing</Badge> : <span className="text-slate-400">— uses summary</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <IconButton icon={Pencil} label={`Edit SEO for ${r.title}`} onClick={() => setEditing(r)} />
                        {r.kind === 'page' && (
                          <Link to={`/admin/pages/${r.id}/edit`} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Open in editor">
                            <ExternalLink size={15} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {editing && (
        <SeoModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}
