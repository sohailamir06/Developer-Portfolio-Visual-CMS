import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, EyeOff, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { useAsync } from '../../utils/hooks.js';
import { pagePath, toSlug } from '../utils.js';
import { resetLinkCache } from '../components/LinkFields.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, IconButton, Input, Modal, PageHeader, Select, Spinner, useUi } from '../components/ui.jsx';

const PAGE_TYPES = [
  ['custom', 'Custom page'],
  ['about', 'About'],
  ['projects', 'Projects'],
  ['skills', 'Skills'],
  ['experience', 'Experience'],
  ['contact', 'Contact'],
  ['resume', 'Résumé'],
];

function NewPageModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', slug: '', pageType: 'custom', template: 'standard' });
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const page = await adminApi.pages.create({ ...form, slug: form.slug.replace(/-+$/, '') });
      resetLinkCache();
      onCreated(page);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New page"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="new-page" loading={busy}>
            Create & edit
          </Button>
        </>
      }
    >
      <form id="new-page" onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <Field label="Title" required>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: slugEdited ? f.slug : toSlug(e.target.value) }))}
            required
            maxLength={120}
          />
        </Field>
        <Field label="URL slug" hint={`The page will live at ${window.location.origin}/${form.slug || '…'}`} required>
          <Input
            value={form.slug}
            onChange={(e) => {
              setSlugEdited(true);
              setForm((f) => ({ ...f, slug: toSlug(e.target.value) }));
            }}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Page type">
            <Select value={form.pageType} onChange={(e) => setForm((f) => ({ ...f, pageType: e.target.value }))} options={PAGE_TYPES} />
          </Field>
          <Field label="Start with">
            <Select value={form.template} onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))} options={[['standard', 'Suggested sections'], ['blank', 'Blank page']]} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export default function Pages() {
  const navigate = useNavigate();
  const { confirm, toast } = useUi();
  const { data: pages, loading, error, reload, setData } = useAsync(() => adminApi.pages.list(), []);
  const [creating, setCreating] = useState(false);

  const remove = async (p) => {
    if (!(await confirm({ title: `Delete “${p.title}”?`, message: 'The page and its revision history will be permanently deleted.', confirmLabel: 'Delete page', danger: true }))) return;
    try {
      await adminApi.pages.remove(p._id);
      setData((list) => list.filter((x) => x._id !== p._id));
      resetLinkCache();
      toast('Page deleted');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Pages"
        description="Edit page content visually. Changes stay in draft until you publish."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
            New page
          </Button>
        }
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : !pages?.length ? (
        <EmptyState icon={FileText} title="No pages" action={<Button onClick={() => setCreating(true)}>Create a page</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {pages.map((p) => (
              <li key={p._id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
                  <FileText size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/pages/${p._id}/edit`} className="block truncate font-medium hover:text-blue-700">
                    {p.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {pagePath(p.slug)} · {p.pageType}
                    {p.publishedAt && ` · published ${new Date(p.publishedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.status === 'published' ? <Badge color="green">Published</Badge> : <Badge color="slate"><EyeOff size={10} /> Not published</Badge>}
                  {p.hasUnpublishedChanges && p.status === 'published' && <Badge color="amber">Draft changes</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" icon={Pencil} onClick={() => navigate(`/admin/pages/${p._id}/edit`)}>
                    Edit
                  </Button>
                  {p.status === 'published' && (
                    <a href={pagePath(p.slug)} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="View live page">
                      <ExternalLink size={15} />
                    </a>
                  )}
                  {p.pageType !== 'home' && <IconButton icon={Trash2} label={`Delete ${p.title}`} variant="danger-ghost" onClick={() => remove(p)} />}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <NewPageModal open={creating} onClose={() => setCreating(false)} onCreated={(page) => navigate(`/admin/pages/${page._id}/edit`)} />
    </>
  );
}
