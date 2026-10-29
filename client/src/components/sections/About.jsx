import { CheckCircle2 } from 'lucide-react';
import { Editable } from '../../context/EditContext.jsx';
import { CmsButton } from '../common/CmsButton.jsx';
import { CmsImage } from '../common/CmsImage.jsx';
import { RichText } from '../common/RichText.jsx';
import { SectionFrame, SectionHeader } from './SectionFrame.jsx';
import { cx } from '../../utils/links.js';

export default function About({ section }) {
  const d = section.data;
  const hasImage = Boolean(d.image?.url) || section._editing;

  return (
    <SectionFrame section={section} label={d.heading || 'About'}>
      <div className={cx('grid gap-12', hasImage && 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start')}>
        {hasImage && (
          <div className="relative mx-auto w-full max-w-sm">
            <CmsImage image={d.image} field="image" width={600} aspect="4 / 5" placeholder="avatar" className="ring-1 ring-line" />
            {d.yearsExperience && (
              <Editable field="yearsExperience" className="card absolute -bottom-5 -right-3 px-5 py-4 text-left shadow-xl sm:-right-6">
                <span className="block font-heading text-3xl font-bold text-primary">{d.yearsExperience}</span>
                <span className="text-xs text-muted">years of experience</span>
              </Editable>
            )}
          </div>
        )}
        <div>
          <SectionHeader data={d} className="!mb-6" />
          <RichText html={d.body} field="body" className="text-base sm:text-lg" />
          {!hasImage && d.yearsExperience && (
            <Editable field="yearsExperience" as="p" className="mt-6 text-sm text-muted">
              <span className="font-heading text-2xl font-bold text-primary">{d.yearsExperience}</span> years of experience
            </Editable>
          )}
          {d.strengths?.length > 0 && (
            <Editable field="strengths" as="ul" className="mt-8 grid gap-3 sm:grid-cols-2">
              {d.strengths.map((s, i) => (
                <li key={`${s}-${i}`} className="flex items-start gap-3 text-sm sm:text-base">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <span>{s}</span>
                </li>
              ))}
            </Editable>
          )}
          {d.stats?.length > 0 && (
            <Editable field="stats" as="dl" className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {d.stats.map((s, i) => (
                <div key={i} className="card px-4 py-5">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-heading text-2xl font-bold text-primary">{s.value}</dd>
                  <dd className="mt-1 text-xs text-muted">{s.label}</dd>
                </div>
              ))}
            </Editable>
          )}
          <div className="mt-10">
            <CmsButton button={d.resumeButton} field="resumeButton" />
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}
