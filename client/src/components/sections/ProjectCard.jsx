import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CmsImage } from '../common/CmsImage.jsx';
import { BrandIcon } from '../common/Icon.jsx';
import { SmartLink } from '../common/SmartLink.jsx';

export default function ProjectCard({ project }) {
  const href = `/projects/${project.slug}`;
  return (
    <article className="group card relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
      <Link to={href} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <CmsImage
          image={{ ...project.featuredImage, alt: project.featuredImage?.alt || project.title, shape: 'square' }}
          width={640}
          aspect="16 / 10"
          imgClassName="transition duration-500 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        {(project.category || project.featured || project.year) && (
          <div className="mb-3 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest">
            {project.category && <span className="text-primary">{project.category}</span>}
            {project.year && <span className="text-muted">{project.year}</span>}
            {project.featured && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">Featured</span>}
          </div>
        )}
        <h3 className="text-xl font-semibold leading-snug">
          <Link to={href} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {project.title}
          </Link>
        </h3>
        {project.role && <p className="mt-1.5 text-xs font-medium text-fg/70">My role: {project.role}</p>}
        {project.summary && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{project.summary}</p>}
        {project.highlights?.[0] && (
          <p className="mt-3 flex gap-2 text-sm text-fg/85">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            {project.highlights[0]}
          </p>
        )}
        {project.technologies?.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Technologies">
            {project.technologies.slice(0, 6).map((t) => (
              <li key={t} className="rounded-md bg-bg px-2 py-1 font-mono text-[11px] text-fg/75 ring-1 ring-line">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="relative z-10 mt-auto flex items-center gap-1 pt-6">
          <Link to={href} className="mr-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
            View details <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
          {project.demoUrl && (
            <SmartLink to={project.demoUrl} newTab className="grid h-9 w-9 place-items-center rounded-theme text-muted hover:bg-bg hover:text-primary" aria-label={`${project.title} live demo`} title="Live demo">
              <ExternalLink size={17} />
            </SmartLink>
          )}
          {project.repoUrl && (
            <SmartLink to={project.repoUrl} newTab className="grid h-9 w-9 place-items-center rounded-theme text-muted hover:bg-bg hover:text-primary" aria-label={`${project.title} source code`} title="Source code">
              <BrandIcon name="github" size={17} />
            </SmartLink>
          )}
        </div>
      </div>
    </article>
  );
}
