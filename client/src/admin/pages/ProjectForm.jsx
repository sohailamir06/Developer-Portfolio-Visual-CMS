import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, History, Plus, Save, Trash2 } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { toSlug } from '../utils.js';
import RichTextEditor from '../components/RichTextEditor.jsx';
import ImageField from '../components/ImageField.jsx';
import SeoFields from '../components/SeoFields.jsx';
import RevisionHistory from '../components/RevisionHistory.jsx';
import { LinkInput, resetLinkCache } from '../components/LinkFields.jsx';
import { TagInput } from '../components/ListInputs.jsx';
import { Button, Card, ErrorBox, Field, IconButton, Input, PageHeader, Select, Spinner, Textarea, Toggle, useUi } from '../components/ui.jsx';

const EMPTY = {
  title: '', slug: '', summary: '', content: '', featuredImage: {}, gallery: [], technologies: [], category: '',
  demoUrl: '', repoUrl: '', featured: false, status: 'draft', seo: {},
};

const pick = (p) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, p[k] ?? EMPTY[k]]));

export default function ProjectForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { toast } = useUi();
  const [form, setForm] = useState(isNew ? EMPTY : null);
  const [original, setOriginal] = useState(null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = await adminApi.projects.get(id);
      setForm(pick(p));
      setOriginal(p);
    } catch (err) {
      setError(toApiError(err));
    }
  }, [id]);

  useEffect(() => {
    if (!isNew) load();
  }, [isNew, load]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const fieldError = (path) => error?.details?.find((d) => d.path === path || d.path?.startsWith(`${path}.`))?.message;

  const submit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    const body = { ...form, slug: form.slug ? form.slug.replace(/-+$/, '') : undefined };
    try {
      const saved = isNew ? await adminApi.projects.create(body) : await adminApi.projects.update(id, body);
      resetLinkCache();
      toast(isNew ? 'Project created' : 'Project saved');
      if (isNew) navigate(`/admin/projects/${saved._id}`, { replace: true });
      setForm(pick(saved));
      setOriginal(saved);
    } catch (err) {
      setError(toApiError(err));
      toast('Please fix the highlighted fields', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return error ? <ErrorBox error={error} onRetry={load} /> : <Spinner />;

  const moveGallery = (i, d) => {
    const g = [...form.gallery];
    [g[i], g[i + d]] = [g[i + d], g[i]];
    set({ gallery: g });
  };

  return (
    <form onSubmit={submit}>
      <PageHeader
        title={isNew ? 'New project' : form.title || 'Edit project'}
        actions={
          <>
            <Button icon={ArrowLeft} onClick={() => navigate('/admin/projects')}>
              Back
            </Button>
            {!isNew && (
              <Button icon={History} onClick={() => setHistory(true)}>
                History
              </Button>
            )}
            {original?.status === 'published' && (
              <a href={`/projects/${original.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-white">
                <ExternalLink size={16} /> View
              </a>
            )}
            <Button type="submit" variant="primary" icon={Save} loading={saving}>
              Save
            </Button>
          </>
        }
      />
      <ErrorBox error={error} />
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <Field label="Title" required error={fieldError('title')}>
              <Input value={form.title} onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: toSlug(e.target.value) }) })} required maxLength={150} />
            </Field>
            <Field label="URL slug" hint={`/projects/${form.slug || '…'}${!isNew && original?.status === 'published' ? ' · changing it redirects the old URL' : ''}`} error={fieldError('slug')}>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: toSlug(e.target.value) });
                }}
              />
            </Field>
            <Field label="Short description" hint="Shown on project cards." error={fieldError('summary')}>
              <Textarea rows={3} value={form.summary} onChange={(e) => set({ summary: e.target.value })} maxLength={500} />
            </Field>
            <Field label="Full description" error={fieldError('content')}>
              <RichTextEditor value={form.content} onChange={(content) => set({ content })} minHeight={240} />
            </Field>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-sm font-semibold">Images</h2>
            <Field label="Featured image">
              <ImageField value={form.featuredImage} onChange={(featuredImage) => set({ featuredImage })} options={['alt']} />
            </Field>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-700">Gallery</p>
              {form.gallery.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1">
                    <ImageField value={img} onChange={(v) => set({ gallery: form.gallery.map((g, j) => (j === i ? v : g)) })} options={['alt', 'caption']} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <IconButton icon={ArrowUp} label="Move up" disabled={i === 0} onClick={() => moveGallery(i, -1)} />
                    <IconButton icon={ArrowDown} label="Move down" disabled={i === form.gallery.length - 1} onClick={() => moveGallery(i, 1)} />
                    <IconButton icon={Trash2} label="Remove image" variant="danger-ghost" onClick={() => set({ gallery: form.gallery.filter((_, j) => j !== i) })} />
                  </div>
                </div>
              ))}
              <Button size="sm" icon={Plus} onClick={() => set({ gallery: [...form.gallery, { url: '', alt: '', caption: '' }] })}>
                Add gallery image
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold">Search & social</h2>
            <SeoFields value={form.seo} onChange={(seo) => set({ seo })} fallbackTitle={form.title} path={`/projects/${form.slug}`} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <Field label="Status" hint="Draft projects are never shown publicly.">
              <Select value={form.status} onChange={(e) => set({ status: e.target.value })} options={[['draft', 'Draft'], ['published', 'Published']]} />
            </Field>
            <Toggle label="Featured" description="Show in “Featured projects” sections." checked={form.featured} onChange={(featured) => set({ featured })} />
          </Card>
          <Card className="space-y-4 p-5">
            <Field label="Category" hint="Used for filtering, e.g. Web App, API, Mobile.">
              <Input value={form.category} onChange={(e) => set({ category: e.target.value })} maxLength={60} />
            </Field>
            <Field label="Technologies" hint="Press Enter after each one.">
              <TagInput value={form.technologies} onChange={(technologies) => set({ technologies })} />
            </Field>
            <Field label="Live demo URL" hint="Leave empty to hide the button." error={fieldError('demoUrl')}>
              <LinkInput value={form.demoUrl} onChange={(demoUrl) => set({ demoUrl })} placeholder="https://…" />
            </Field>
            <Field label="Source code URL" hint="Leave empty to hide the button." error={fieldError('repoUrl')}>
              <LinkInput value={form.repoUrl} onChange={(repoUrl) => set({ repoUrl })} placeholder="https://github.com/…" />
            </Field>
          </Card>
        </div>
      </div>
      {!isNew && (
        <RevisionHistory
          open={history}
          onClose={() => setHistory(false)}
          load={() => adminApi.projects.revisions(id)}
          restore={(rev) => adminApi.revisions.restore(rev._id)}
          restoreHint="The project will be reset to this saved version immediately (the current version stays in history)."
          onRestored={load}
        />
      )}
    </form>
  );
}
