import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, History, Layers, Monitor, MoreHorizontal, PanelRight, Rocket, Save, Settings2, Smartphone, Tablet, Undo2,
} from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { clone, newId, pagePath, toSlug } from '../utils.js';
import { resetLinkCache } from '../components/LinkFields.jsx';
import { Badge, Button, ErrorBox, Field, IconButton, Input, Spinner, useUi } from '../components/ui.jsx';
import SeoFields from '../components/SeoFields.jsx';
import RevisionHistory from '../components/RevisionHistory.jsx';
import SectionList, { AddSectionModal } from './SectionList.jsx';
import PropertiesPanel from './PropertiesPanel.jsx';
import PreviewFrame, { DEVICES } from './PreviewFrame.jsx';
import { SECTION_META } from './sectionFields.js';
import { cx } from '../../utils/links.js';

const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const draftOf = (page) => ({ title: page.draft.title, seo: page.draft.seo || {}, sections: page.draft.sections || [] });

function PageSettingsPanel({ page, draft, setDraft, onSlugSaved, onTogglePublished }) {
  const { toast, confirm } = useUi();
  const [slug, setSlug] = useState(page.slug);
  const [busy, setBusy] = useState(false);
  const isHome = page.pageType === 'home';

  const saveSlug = async () => {
    const clean = slug.replace(/-+$/, '');
    if (!clean || clean === page.slug) return;
    if (page.status === 'published' && !(await confirm({ title: 'Change page URL?', message: `Visitors and search engines using /${page.slug} will be redirected to /${clean} automatically.`, confirmLabel: 'Change URL' }))) return;
    setBusy(true);
    try {
      onSlugSaved(await adminApi.pages.updateMeta(page._id, { slug: clean }));
      resetLinkCache();
      toast('URL updated. Remember to update navigation links that point to the old URL.');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Page settings</p>
        <h2 className="text-sm font-semibold">{draft.title}</h2>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <Field label="Page title" hint="Shown in the browser tab and search results (unless an SEO title is set).">
          <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} maxLength={120} />
        </Field>
        <Field label="URL" hint={isHome ? 'The home page is always served at /.' : 'Changing the URL creates a redirect from the old one.'}>
          <div className="flex gap-2">
            <Input value={isHome ? '/' : slug} disabled={isHome} onChange={(e) => setSlug(toSlug(e.target.value))} />
            {!isHome && (
              <Button onClick={saveSlug} loading={busy} disabled={slug.replace(/-+$/, '') === page.slug}>
                Update
              </Button>
            )}
          </div>
        </Field>
        {!isHome && (
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="font-medium">Visibility</p>
            <p className="mb-2 text-xs text-slate-500">{page.status === 'published' ? 'This page is live. Unpublishing hides it and removes it from the navigation.' : 'This page is not visible to visitors yet.'}</p>
            {page.status === 'published' && (
              <Button size="sm" variant="danger-ghost" onClick={onTogglePublished}>
                Unpublish page
              </Button>
            )}
          </div>
        )}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Search & social</h3>
          <SeoFields value={draft.seo} onChange={(seo) => setDraft((d) => ({ ...d, seo }))} fallbackTitle={draft.title} path={pagePath(page.slug)} />
        </div>
      </div>
    </div>
  );
}

export default function PageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, confirm } = useUi();

  const [page, setPage] = useState(null);
  const [draft, setDraftState] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [busy, setBusy] = useState(null); // 'save' | 'publish' | 'discard'
  const [selected, setSelected] = useState(null); // { sectionId, field }
  const [scrollTo, setScrollTo] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [panel, setPanel] = useState('preview'); // mobile/tablet: which panel is visible
  const [adding, setAdding] = useState(false);
  const [history, setHistory] = useState(false);
  const [menu, setMenu] = useState(false);
  const [defaults, setDefaults] = useState({});

  const load = useCallback(async () => {
    try {
      const [p, types] = await Promise.all([adminApi.pages.get(id), adminApi.sectionTypes()]);
      setPage(p);
      setDraftState(draftOf(p));
      setDefaults(types);
      setDirty(false);
      setLoadError(null);
    } catch (err) {
      setLoadError(toApiError(err));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const setDraft = useCallback((updater) => {
    setDraftState((d) => (typeof updater === 'function' ? updater(d) : updater));
    setDirty(true);
  }, []);

  const setSections = useCallback((fn) => setDraft((d) => ({ ...d, sections: fn(d.sections) })), [setDraft]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const save = useCallback(
    async ({ quiet } = {}) => {
      setBusy('save');
      setSaveError(null);
      try {
        const updated = await adminApi.pages.saveDraft(id, draft);
        setPage(updated);
        setDraftState(draftOf(updated));
        setDirty(false);
        if (!quiet) toast('Draft saved — the public site is unchanged until you publish.');
        return updated;
      } catch (err) {
        const e = toApiError(err);
        setSaveError(e);
        toast(e.message, 'error');
        return null;
      } finally {
        setBusy(null);
      }
    },
    [id, draft, toast],
  );

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !busy) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, busy, save]);

  const publish = async () => {
    if (!(await confirm({ title: 'Publish this page?', message: 'Visitors will see the current draft immediately. The previous version is kept in the revision history.', confirmLabel: 'Publish' }))) return;
    if (dirty && !(await save({ quiet: true }))) return;
    setBusy('publish');
    try {
      const updated = await adminApi.pages.publish(id);
      setPage(updated);
      setDraftState(draftOf(updated));
      setDirty(false);
      toast('Published! Your changes are now live.');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const discard = async () => {
    setMenu(false);
    if (!(await confirm({ title: 'Discard all draft changes?', message: 'The draft will be reset to the currently published version. This cannot be undone.', confirmLabel: 'Discard changes', danger: true }))) return;
    setBusy('discard');
    try {
      const updated = await adminApi.pages.discard(id);
      setPage(updated);
      setDraftState(draftOf(updated));
      setDirty(false);
      setSelected(null);
      toast('Draft reset to the published version');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const openPreview = async () => {
    if (dirty && !(await save({ quiet: true }))) return;
    window.open(`/preview/${id}`, '_blank', 'noopener');
  };

  const unpublish = async () => {
    if (!(await confirm({ title: 'Unpublish page?', message: 'The page will no longer be visible to visitors.', confirmLabel: 'Unpublish', danger: true }))) return;
    try {
      setPage(await adminApi.pages.unpublish(id));
      toast('Page unpublished');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  // ---------------- Section operations ----------------
  const selectSection = useCallback((sectionId, field = null) => {
    setSelected(sectionId ? { sectionId, field } : null);
    if (sectionId) setScrollTo({ id: sectionId, t: Date.now() });
  }, []);

  const onPreviewSelect = useCallback((sel) => {
    setSelected(sel);
    setPanel('properties');
  }, []);

  const addSection = (type) => {
    const base = defaults[type] || { data: {}, style: {} };
    const section = { id: newId(), type, visible: true, data: clone(base.data), style: clone(base.style) };
    setSections((list) => {
      const idx = list.findIndex((s) => s.id === selected?.sectionId);
      const next = [...list];
      next.splice(idx >= 0 ? idx + 1 : next.length, 0, section);
      return next;
    });
    setAdding(false);
    selectSection(section.id);
    setPanel('properties');
  };

  const updateSection = (updated) => setSections((list) => list.map((s) => (s.id === updated.id ? updated : s)));
  const toggleSection = (sid) => setSections((list) => list.map((s) => (s.id === sid ? { ...s, visible: !s.visible } : s)));
  const duplicateSection = (sid) => {
    const copyId = newId();
    setSections((list) => {
      const idx = list.findIndex((s) => s.id === sid);
      const next = [...list];
      next.splice(idx + 1, 0, { ...clone(list[idx]), id: copyId });
      return next;
    });
    selectSection(copyId);
  };
  const deleteSection = async (sid) => {
    const s = draft.sections.find((x) => x.id === sid);
    const label = SECTION_META[s?.type]?.label || 'section';
    if (!(await confirm({ title: `Delete ${label} section?`, message: 'It will be removed from the draft. You can discard changes or restore a revision if this was a mistake.', confirmLabel: 'Delete', danger: true }))) return;
    setSections((list) => list.filter((x) => x.id !== sid));
    if (selected?.sectionId === sid) setSelected(null);
  };

  const previewPage = useMemo(() => (draft ? { title: draft.title, sections: draft.sections } : null), [draft]);
  const loadRevisions = useCallback(() => adminApi.pages.revisions(id), [id]);
  const selectedSection = draft?.sections.find((s) => s.id === selected?.sectionId) || null;

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <ErrorBox error={loadError} onRetry={load} />
        <Button className="mt-4" icon={ArrowLeft} onClick={() => navigate('/admin/pages')}>
          Back to pages
        </Button>
      </div>
    );
  }
  if (!page || !draft) return <Spinner className="min-h-screen" label="Loading editor…" />;

  const status = dirty ? (
    <Badge color="amber">Unsaved changes</Badge>
  ) : page.status !== 'published' ? (
    <Badge color="slate">Not published</Badge>
  ) : page.hasUnpublishedChanges ? (
    <Badge color="blue">Draft saved · not live</Badge>
  ) : (
    <Badge color="green">Live</Badge>
  );

  const leftPanel = (
    <SectionList
      sections={draft.sections}
      selectedId={selected?.sectionId}
      onSelect={(sid) => {
        selectSection(sid);
        setPanel('properties');
      }}
      onReorder={(list) => setSections(() => list)}
      onToggle={toggleSection}
      onDuplicate={duplicateSection}
      onDelete={deleteSection}
      onAddClick={() => setAdding(true)}
    />
  );

  const rightPanel = selectedSection ? (
    <PropertiesPanel
      key={selectedSection.id}
      section={selectedSection}
      selectedField={selected?.field}
      onChange={updateSection}
      onToggle={() => toggleSection(selectedSection.id)}
      onDuplicate={() => duplicateSection(selectedSection.id)}
      onDelete={() => deleteSection(selectedSection.id)}
    />
  ) : (
    <PageSettingsPanel page={page} draft={draft} setDraft={setDraft} onSlugSaved={setPage} onTogglePublished={unpublish} />
  );

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <IconButton
          icon={ArrowLeft}
          label="Back to pages"
          onClick={async () => {
            if (dirty && !(await confirm({ title: 'Leave without saving?', message: 'Your unsaved changes will be lost.', confirmLabel: 'Leave', danger: true }))) return;
            navigate('/admin/pages');
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-sm font-semibold">{draft.title}</h1>
            {status}
          </div>
          <p className="truncate text-[11px] text-slate-500">
            {pagePath(page.slug)} · v{page.version} {page.draftSavedAt && `· draft saved ${new Date(page.draftSavedAt).toLocaleTimeString()}`}
          </p>
        </div>

        <div className="order-3 flex w-full items-center justify-center gap-1 rounded-lg bg-slate-100 p-1 sm:order-none sm:w-auto" role="group" aria-label="Preview device">
          {Object.entries(DEVICES).map(([key, d]) => {
            const I = DEVICE_ICONS[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={device === key}
                onClick={() => {
                  setDevice(key);
                  setPanel('preview');
                }}
                className={cx('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition', device === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
              >
                <I size={14} /> <span className="hidden md:inline">{d.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton icon={Settings2} label="Page settings & SEO" onClick={() => { setSelected(null); setPanel('properties'); }} />
          <IconButton icon={History} label="Revision history" onClick={() => setHistory(true)} />
          <div className="relative">
            <IconButton icon={MoreHorizontal} label="More actions" onClick={() => setMenu((m) => !m)} />
            {menu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg" onMouseLeave={() => setMenu(false)}>
                <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-40" onClick={discard} disabled={!page.published || (!dirty && !page.hasUnpublishedChanges)}>
                  <Undo2 size={15} /> Discard changes
                </button>
                {page.status === 'published' && (
                  <a href={pagePath(page.slug)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-50">
                    <Eye size={15} /> View live page
                  </a>
                )}
              </div>
            )}
          </div>
          <Button size="sm" icon={Eye} onClick={openPreview} className="hidden sm:inline-flex">
            Preview
          </Button>
          <Button size="sm" icon={Save} onClick={() => save()} loading={busy === 'save'} disabled={!dirty || Boolean(busy)}>
            <span className="hidden sm:inline">Save draft</span>
          </Button>
          <Button size="sm" variant="success" icon={Rocket} onClick={publish} loading={busy === 'publish'} disabled={Boolean(busy) || (!dirty && !page.hasUnpublishedChanges && page.status === 'published')}>
            Publish
          </Button>
        </div>
      </header>
      {saveError && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2">
          <ErrorBox error={saveError} />
        </div>
      )}

      {/* Workspace: three columns on large screens, one panel at a time below that */}
      <div className="flex min-h-0 flex-1">
        <aside className={cx('w-full shrink-0 border-r border-slate-200 bg-white lg:block lg:w-72', panel === 'sections' ? 'block' : 'hidden')}>{leftPanel}</aside>
        <section className={cx('min-w-0 flex-1 lg:block', panel === 'preview' ? 'block' : 'hidden')} aria-label="Preview">
          <PreviewFrame pageId={id} page={previewPage} selected={selected} device={device} onSelect={onPreviewSelect} scrollToSection={scrollTo} />
        </section>
        <aside className={cx('w-full shrink-0 border-l border-slate-200 bg-white lg:block lg:w-[380px]', panel === 'properties' ? 'block' : 'hidden')}>{rightPanel}</aside>
      </div>

      <nav className="grid grid-cols-3 border-t border-slate-200 bg-white lg:hidden" aria-label="Editor panels">
        {[
          ['sections', 'Sections', Layers],
          ['preview', 'Preview', Eye],
          ['properties', selectedSection ? 'Properties' : 'Page', PanelRight],
        ].map(([key, label, I]) => (
          <button key={key} type="button" onClick={() => setPanel(key)} aria-pressed={panel === key} className={cx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', panel === key ? 'text-blue-600' : 'text-slate-500')}>
            <I size={18} /> {label}
          </button>
        ))}
      </nav>

      <AddSectionModal open={adding} onClose={() => setAdding(false)} onAdd={addSection} />
      <RevisionHistory
        open={history}
        onClose={() => setHistory(false)}
        load={loadRevisions}
        restore={(rev) => adminApi.pages.restore(id, rev._id)}
        restoreHint="The selected published version will be loaded into the draft. Review it, then publish to make it live. Unsaved changes will be replaced."
        onRestored={(updated) => {
          setPage(updated);
          setDraftState(draftOf(updated));
          setDirty(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
