import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { adminApi, toApiError } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { EditContext } from '../context/EditContext.jsx';
import { SiteShell } from '../components/layout/PublicLayout.jsx';
import { PageRenderer } from '../components/sections/index.jsx';
import { ErrorState, Loading } from '../components/common/Status.jsx';
import { useDocumentMeta } from '../utils/hooks.js';

/**
 * Admin-only draft preview.
 *  - Standalone (/preview/:id): renders the last *saved* draft with a banner.
 *  - Embedded (?embed=1, inside the editor iframe): renders the editor's unsaved state received
 *    via postMessage and reports clicks on editable elements back to the editor.
 */
export default function Preview() {
  const { pageId } = useParams();
  const [params] = useSearchParams();
  const embedded = params.get('embed') === '1';
  const { user, checking } = useAuth();
  const [page, setPage] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  useDocumentMeta({ title: 'Preview', noindex: true });

  useEffect(() => {
    if (!user || embedded) return;
    adminApi.pages
      .preview(pageId)
      .then(setPage)
      .catch((e) => setError(toApiError(e)));
  }, [user, pageId, embedded]);

  useEffect(() => {
    if (!embedded) return undefined;
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (e.data?.type === 'cms:update') {
        setPage(e.data.page);
        setSelected(e.data.selected || null);
      }
      if (e.data?.type === 'cms:scrollTo' && e.data.sectionId) {
        document.querySelector(`[data-cms-section="${CSS.escape(e.data.sectionId)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'cms:ready' }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [embedded]);

  // In the editor, links must not navigate away from the preview.
  useEffect(() => {
    if (!embedded) return undefined;
    const block = (e) => {
      if (e.target.closest('a, button[type="submit"]')) e.preventDefault();
    };
    document.addEventListener('click', block, true);
    return () => document.removeEventListener('click', block, true);
  }, [embedded]);

  const select = useCallback(
    (sectionId, field) => {
      setSelected({ sectionId, field });
      window.parent.postMessage({ type: 'cms:select', sectionId, field }, window.location.origin);
    },
    [],
  );
  const editValue = useMemo(() => (embedded ? { selected, select } : null), [embedded, selected, select]);

  if (checking) return <Loading className="min-h-screen" />;
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <ErrorState title="Sign in required" message="Draft previews are only available to administrators." className="!py-6" />
        <Link to="/admin/login" className="btn btn-primary">
          Sign in
        </Link>
      </div>
    );
  }
  if (error) return <ErrorState message={error.message} className="min-h-screen" />;
  if (!page) return <Loading label="Loading preview…" className="min-h-screen" />;

  return (
    <EditContext.Provider value={editValue}>
      {!embedded && (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-black">
          <Eye size={16} aria-hidden="true" /> Draft preview of “{page.title}” — visitors do not see these changes until you publish.
          <Link to={`/admin/pages/${pageId}/edit`} className="underline">
            Back to editor
          </Link>
        </div>
      )}
      <div className={embedded ? 'cms-editing' : undefined}>
        <SiteShell>
          <PageRenderer sections={page.sections} />
        </SiteShell>
      </div>
    </EditContext.Provider>
  );
}
