import { Editable } from '../../context/EditContext.jsx';
import { CmsButton } from '../common/CmsButton.jsx';
import { SectionFrame } from './SectionFrame.jsx';

export default function CallToAction({ section }) {
  const d = section.data;
  return (
    <SectionFrame section={section} label={d.heading || 'Call to action'}>
      <div className="relative overflow-hidden rounded-theme-lg border border-primary/25 bg-gradient-to-br from-primary/15 via-surface to-secondary/10 px-6 py-14 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
        {d.eyebrow && (
          <Editable field="eyebrow" as="p" className="eyebrow">
            {d.eyebrow}
          </Editable>
        )}
        <Editable field="heading" as="h2" className="section-heading mx-auto max-w-2xl">
          {d.heading}
        </Editable>
        {(d.body || d.subheading) && (
          <Editable field="body" as="p" className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {d.body || d.subheading}
          </Editable>
        )}
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <CmsButton button={d.primaryButton} field="primaryButton" />
          <CmsButton button={d.secondaryButton} field="secondaryButton" />
        </div>
      </div>
    </SectionFrame>
  );
}
