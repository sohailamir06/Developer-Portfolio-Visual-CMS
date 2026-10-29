import { Briefcase, MapPin } from 'lucide-react';
import { publicApi } from '../../services/api.js';
import { cachedFetch, useAsync } from '../../utils/hooks.js';
import { formatMonthYear } from '../../utils/links.js';
import { RichText } from '../common/RichText.jsx';
import { SmartLink } from '../common/SmartLink.jsx';
import { Loading } from '../common/Status.jsx';
import { SectionFrame, SectionHeader, isCentered } from './SectionFrame.jsx';

export default function ExperienceTimeline({ section }) {
  const d = section.data;
  const { data, loading, error } = useAsync(() => cachedFetch('experience', publicApi.experience), []);
  const items = d.limit ? (data || []).slice(0, d.limit) : data || [];

  if (!loading && !error && items.length === 0 && !section._editing) return null;

  return (
    <SectionFrame section={section} label={d.heading || 'Experience'}>
      <SectionHeader data={d} center={isCentered(section)} />
      {loading && <Loading label="Loading experience…" />}
      {error && <p className="text-sm text-muted">Experience could not be loaded.</p>}
      {!loading && items.length === 0 && <p className="text-sm text-muted">No experience entries yet — add them in Admin → Experience.</p>}
      <ol className="relative mx-auto max-w-3xl border-l border-line text-left">
        {items.map((e) => (
          <li key={e._id} className="relative pb-12 pl-8 last:pb-0 sm:pl-10">
            <span className="absolute -left-[9px] top-1.5 grid h-[18px] w-[18px] place-items-center rounded-full border border-primary/50 bg-bg" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-primary" />
            </span>
            <p className="font-mono text-xs uppercase tracking-wider text-primary">
              {formatMonthYear(e.startDate)} — {e.current ? 'Present' : formatMonthYear(e.endDate) || 'Present'}
            </p>
            <h3 className="mt-2 text-xl font-semibold">{e.position}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={14} aria-hidden="true" />
                {e.companyUrl ? (
                  <SmartLink to={e.companyUrl} newTab className="hover:text-primary">
                    {e.company}
                  </SmartLink>
                ) : (
                  e.company
                )}
              </span>
              {e.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} aria-hidden="true" /> {e.location}
                </span>
              )}
              {e.employmentType && <span>{e.employmentType}</span>}
            </p>
            <RichText html={e.description} className="mt-4 text-sm sm:text-base" />
            {e.responsibilities?.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm text-fg/85">
                {e.responsibilities.map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
            {d.showTechnologies && e.technologies?.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies used">
                {e.technologies.map((t) => (
                  <li key={t} className="rounded-md bg-primary/10 px-2 py-1 font-mono text-[11px] text-primary">
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </SectionFrame>
  );
}
