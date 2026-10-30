import { CalendarDays, GraduationCap, MapPin } from 'lucide-react';
import { Editable } from '../../context/EditContext.jsx';
import { CmsImage } from '../common/CmsImage.jsx';
import { SectionFrame, SectionHeader, isCentered } from './SectionFrame.jsx';

export default function Education({ section }) {
  const d = section.data;
  const items = (d.items || []).filter((i) => i.institution || i.degree);
  if (!items.length && !section._editing) return null;

  return (
    <SectionFrame section={section} label={d.heading || 'Education'}>
      <SectionHeader data={d} center={isCentered(section)} />
      <Editable field="items" as="ol" className="mx-auto grid max-w-4xl gap-5 text-left">
        {items.map((e, i) => (
          <li key={i} className="card group relative flex flex-col gap-5 p-6 transition hover:border-primary/40 sm:flex-row sm:p-7">
            <div className="shrink-0">
              {e.logo?.url ? (
                <CmsImage image={{ ...e.logo, fit: 'contain', alt: e.logo.alt || e.institution }} width={128} className="h-14 w-14 bg-white p-1.5" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-theme bg-primary/10 text-primary" aria-hidden="true">
                  <GraduationCap size={26} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <div>
                  <h3 className="text-lg font-semibold leading-snug">{e.degree || e.institution}</h3>
                  {e.degree && e.institution && <p className="mt-0.5 font-medium text-primary">{e.institution}</p>}
                </div>
                {e.grade && <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{e.grade}</span>}
              </div>
              {(e.period || e.location) && (
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  {e.period && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} aria-hidden="true" /> {e.period}
                    </span>
                  )}
                  {e.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} aria-hidden="true" /> {e.location}
                    </span>
                  )}
                </p>
              )}
              {e.description && <p className="mt-3 text-sm leading-relaxed text-fg/85">{e.description}</p>}
              {e.highlights?.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm text-fg/85">
                  {e.highlights.map((h, j) => (
                    <li key={j} className="flex gap-2.5">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
        {!items.length && <li className="text-sm text-muted">Add your degrees and schools in the panel on the right.</li>}
      </Editable>
    </SectionFrame>
  );
}
