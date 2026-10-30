import { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { publicApi, toApiError } from '../services/api.js';
import { useDocumentMeta } from '../utils/hooks.js';
import { useSite } from '../context/SiteContext.jsx';
import { PageRenderer } from '../components/sections/index.jsx';
import { ErrorState, Loading } from '../components/common/Status.jsx';
import NotFound from './NotFound.jsx';
import { track } from '../utils/track.js';

/** Resolves a redirect for a missing path; returns { to } or null. */
export async function findRedirect(path) {
  try {
    return await publicApi.resolveRedirect(path);
  } catch {
    return null;
  }
}

export function PageMeta({ page }) {
  const { settings } = useSite();
  const isHome = page.pageType === 'home';
  const template = settings?.seo?.titleTemplate || '%s';
  const base = page.seo?.title || (isHome ? settings?.siteTitle : page.title);
  useDocumentMeta({
    title: isHome && !page.seo?.title ? base : template.replace('%s', base),
    description: page.seo?.description || settings?.seo?.defaultDescription || settings?.tagline,
    image: page.seo?.image || settings?.seo?.ogImage,
    canonical: page.seo?.canonical,
    noindex: page.seo?.noindex || settings?.seo?.allowIndexing === false,
  });
  return null;
}

/** Every public page (home, about, projects, …) is resolved by slug, so slugs stay configurable. */
export default function PageRoute({ slug: fixedSlug }) {
  const params = useParams();
  const location = useLocation();
  const slug = fixedSlug || params.slug;
  const [state, setState] = useState({ loading: true, page: null, error: null, redirect: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, page: null, error: null, redirect: null });
    publicApi
      .page(slug)
      .then((page) => {
        if (!active) return;
        setState({ loading: false, page, error: null, redirect: null });
        track('view', location.pathname);
      })
      .catch(async (err) => {
        const e = toApiError(err);
        const redirect = e.status === 404 ? await findRedirect(location.pathname) : null;
        if (active) setState({ loading: false, page: null, error: e, redirect });
      });
    return () => {
      active = false;
    };
  }, [slug, location.pathname]);

  useEffect(() => {
    if (state.redirect?.to && /^https?:/i.test(state.redirect.to)) window.location.replace(state.redirect.to);
  }, [state.redirect]);

  if (state.loading) return <Loading className="min-h-[60vh]" />;
  if (state.redirect?.to) return /^https?:/i.test(state.redirect.to) ? <Loading /> : <Navigate to={state.redirect.to} replace />;
  if (state.error?.status === 404) return <NotFound />;
  if (state.error) return <ErrorState message={state.error.message} onRetry={() => window.location.reload()} className="min-h-[60vh]" />;

  return (
    <>
      <PageMeta page={state.page} />
      <PageRenderer sections={state.page.sections} />
    </>
  );
}
