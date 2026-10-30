import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, X } from 'lucide-react';
import { publicApi, toApiError } from '../services/api.js';
import { useDocumentMeta } from '../utils/hooks.js';
import { useSite } from '../context/SiteContext.jsx';
import { CmsImage } from '../components/common/CmsImage.jsx';
import { RichText } from '../components/common/RichText.jsx';
import { BrandIcon } from '../components/common/Icon.jsx';
import { SmartLink } from '../components/common/SmartLink.jsx';
import { ErrorState, Loading } from '../components/common/Status.jsx';
import { findRedirect } from './PageRoute.jsx';
import NotFound from './NotFound.jsx';
import { track } from '../utils/track.js';

function ProjectMeta({ project }) {
  const { settings } = useSite();
  const template = settings?.seo?.titleTemplate || '%s';
  useDocumentMeta({
    title: template.replace('%s', project.seo?.title || project.title),
    description: project.seo?.description || project.summary,
    image: project.seo?.image || project.featuredImage?.url || settings?.seo?.ogImage,
    canonical: project.seo?.canonical,
    noindex: project.seo?.noindex || settings?.seo?.allowIndexing === false,
    type: 'article',
  });
  return null;
}

function Lightbox({ image, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={image.alt || 'Image'} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={onClose}>
      <button type="button" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close" onClick={onClose}>
        <X size={20} />
      </button>
      <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img src={image.url} alt={image.alt || ''} className="max-h-[85vh] w-auto rounded-lg object-contain" />
        {image.caption && <figcaption className="mt-3 text-center text-sm text-white/80">{image.caption}</figcaption>}
      </figure>
    </div>
  );
}

export default function ProjectDetails() {
  const { slug } = useParams();
  const location = useLocation();
  const [state, setState] = useState({ loading: true });
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let active = true;
    setState({ loading: true });
    window.scrollTo(0, 0);
    publicApi
      .project(slug)
      .then((project) => {
        if (!active) return;
        setState({ loading: false, project });
        track('view', location.pathname);
      })
      .catch(async (err) => {
        const error = toApiError(err);
        const redirect = error.status === 404 ? await findRedirect(location.pathname) : null;
        if (active) setState({ loading: false, error, redirect });
      });
    return () => {
      active = false;
    };
  }, [slug, location.pathname]);

  if (state.loading) return <Loading className="min-h-[60vh]" />;
  if (state.redirect?.to) return <Navigate to={state.redirect.to} replace />;
  if (state.error?.status === 404) return <NotFound />;
  if (state.error) return <ErrorState message={state.error.message} className="min-h-[60vh]" />;

  const p = state.project;
  return (
    <article>
      <ProjectMeta project={p} />
      <header className="container-site pb-10 pt-10 sm:pt-16">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-primary">
          <ArrowLeft size={16} aria-hidden="true" /> All projects
        </Link>
        <div className="mt-8 max-w-3xl">
          {p.category && <p className="eyebrow">{p.category}</p>}
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{p.title}</h1>
          {p.summary && <p className="mt-5 text-lg leading-relaxed text-muted">{p.summary}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {p.demoUrl && (
              <SmartLink to={p.demoUrl} newTab className="btn btn-primary">
                Live demo <ExternalLink size={15} aria-hidden="true" />
              </SmartLink>
            )}
            {p.repoUrl && (
              <SmartLink to={p.repoUrl} newTab className="btn btn-outline">
                <BrandIcon name="github" size={16} /> Source code
              </SmartLink>
            )}
          </div>
        </div>
      </header>

      {p.featuredImage?.url && (
        <div className="container-site">
          <CmsImage image={{ ...p.featuredImage, alt: p.featuredImage.alt || p.title }} eager width={1400} aspect="16 / 9" className="ring-1 ring-line" />
        </div>
      )}

      <div className="container-site grid gap-12 py-16 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {p.highlights?.length > 0 && (
            <section aria-label="Key highlights" className="card mb-10 border-accent/30 bg-accent/[0.06] p-6">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">Key highlights</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {p.highlights.map((h, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed sm:text-base">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <RichText html={p.content} className="text-base sm:text-lg" />
        </div>
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {(p.role || p.year) && (
            <dl className="space-y-4">
              {p.role && (
                <div>
                  <dt className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">My role</dt>
                  <dd className="font-medium">{p.role}</dd>
                </div>
              )}
              {p.year && (
                <div>
                  <dt className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">Year</dt>
                  <dd className="font-medium">{p.year}</dd>
                </div>
              )}
            </dl>
          )}
          {p.technologies?.length > 0 && (
            <div>
              <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">Tech stack</h2>
              <ul className="flex flex-wrap gap-2">
                {p.technologies.map((t) => (
                  <li key={t} className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {p.category && (
            <div>
              <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">Category</h2>
              <p>{p.category}</p>
            </div>
          )}
        </aside>
      </div>

      {p.gallery?.length > 0 && (
        <section className="container-site pb-16" aria-label="Gallery">
          <h2 className="mb-6 text-2xl font-semibold">Gallery</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.gallery.map((img, i) => (
              <button key={`${img.url}-${i}`} type="button" className="group overflow-hidden rounded-theme-lg text-left ring-1 ring-line" onClick={() => setLightbox(img)} aria-label={`Open image: ${img.alt || `screenshot ${i + 1}`}`}>
                <CmsImage image={{ ...img, caption: '' }} width={700} aspect="4 / 3" imgClassName="transition duration-500 group-hover:scale-105" />
              </button>
            ))}
          </div>
        </section>
      )}

      {(p.prev || p.next) && (
        <nav aria-label="More projects" className="container-site grid gap-4 border-t border-line py-10 sm:grid-cols-2">
          {p.prev ? (
            <Link to={`/projects/${p.prev.slug}`} className="card group p-5 transition hover:border-primary/50">
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <ArrowLeft size={14} aria-hidden="true" /> Previous
              </span>
              <span className="mt-1 block font-semibold group-hover:text-primary">{p.prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {p.next && (
            <Link to={`/projects/${p.next.slug}`} className="card group p-5 text-right transition hover:border-primary/50">
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                Next <ArrowRight size={14} aria-hidden="true" />
              </span>
              <span className="mt-1 block font-semibold group-hover:text-primary">{p.next.title}</span>
            </Link>
          )}
        </nav>
      )}
      {lightbox && <Lightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </article>
  );
}
