import { Download } from 'lucide-react';
import { Editable } from '../../context/EditContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { CmsButton } from '../common/CmsButton.jsx';
import { CmsImage } from '../common/CmsImage.jsx';
import { BrandIcon } from '../common/Icon.jsx';
import { SmartLink } from '../common/SmartLink.jsx';
import { SectionFrame } from './SectionFrame.jsx';
import { cx } from '../../utils/links.js';

export default function Hero({ section }) {
  const d = section.data;
  const { settings } = useSite();
  const centered = d.layout === 'centered';
  const resumeUrl = settings?.resume?.url;

  const socials = [
    d.githubUrl && { name: 'github', url: d.githubUrl, label: 'GitHub', field: 'githubUrl' },
    d.linkedinUrl && { name: 'linkedin', url: d.linkedinUrl, label: 'LinkedIn', field: 'linkedinUrl' },
  ].filter(Boolean);

  const text = (
    <div className={cx('animate-fade-up', centered && 'mx-auto max-w-3xl text-center')}>
      {d.availability?.show && d.availability.text && (
        <Editable field="availability" as="p" className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          {d.availability.text}
        </Editable>
      )}
      {d.greeting && (
        <Editable field="greeting" as="p" className="font-mono text-sm text-primary sm:text-base">
          {d.greeting}
        </Editable>
      )}
      <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
        <Editable field="name" as="span" className="block">
          {d.name}
        </Editable>
        {d.title && (
          <Editable field="title" as="span" className="mt-2 block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-3xl text-transparent sm:text-5xl lg:text-[3.4rem] lg:leading-tight">
            {d.title}
          </Editable>
        )}
      </h1>
      {d.intro && (
        <Editable field="intro" as="p" className={cx('mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg', centered && 'mx-auto')}>
          {d.intro}
        </Editable>
      )}
      <div className={cx('mt-9 flex flex-wrap items-center gap-3', centered && 'justify-center')}>
        <CmsButton button={d.primaryButton} field="primaryButton" />
        <CmsButton button={d.secondaryButton} field="secondaryButton" />
      </div>
      {(socials.length > 0 || (d.showResume && resumeUrl)) && (
        <div className={cx('mt-8 flex flex-wrap items-center gap-2', centered && 'justify-center')}>
          {socials.map((s) => (
            <Editable key={s.name} field={s.field} as="span">
              <SmartLink to={s.url} newTab aria-label={s.label} className="grid h-10 w-10 place-items-center rounded-theme border border-line text-muted transition hover:border-primary hover:text-primary">
                <BrandIcon name={s.name} size={18} />
              </SmartLink>
            </Editable>
          ))}
          {d.showResume && resumeUrl && (
            <Editable field="resumeLabel" as="span">
              <SmartLink to={resumeUrl} newTab className="btn btn-ghost !px-3 text-muted">
                <Download size={16} aria-hidden="true" /> {d.resumeLabel || settings?.resume?.label}
              </SmartLink>
            </Editable>
          )}
        </div>
      )}
    </div>
  );

  // Without a photo, visitors get a full-width intro; the editor still shows a placeholder to click.
  const showImage = Boolean(d.image?.url) || section._editing;
  const image = showImage && (
    <div className={cx('relative mx-auto w-full', centered ? 'mb-10 max-w-[180px]' : 'max-w-sm lg:max-w-md')}>
      <div className="absolute -inset-4 -z-10 rounded-full bg-gradient-to-tr from-primary/25 via-secondary/15 to-transparent blur-3xl" aria-hidden="true" />
      <CmsImage
        image={d.image}
        field="image"
        eager
        width={700}
        placeholder="avatar"
        aspect={centered || d.image?.shape === 'circle' ? '1 / 1' : '4 / 5'}
        className="ring-1 ring-line"
      />
    </div>
  );

  return (
    <SectionFrame section={section} className="isolate overflow-hidden !pt-12 sm:!pt-20" label="Introduction">
      <div className="hero-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-32 top-10 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" aria-hidden="true" />
      {centered ? (
        <>
          {image}
          {text}
        </>
      ) : (
        <div className={cx('grid items-center gap-12', showImage && 'lg:grid-cols-[1.25fr_1fr]')}>
          {text}
          {image}
        </div>
      )}
    </SectionFrame>
  );
}
