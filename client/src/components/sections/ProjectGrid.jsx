import { useMemo, useState } from 'react';
import { publicApi } from '../../services/api.js';
import { cachedFetch, useAsync } from '../../utils/hooks.js';
import { Editable } from '../../context/EditContext.jsx';
import { CmsButton } from '../common/CmsButton.jsx';
import { Loading } from '../common/Status.jsx';
import { SectionFrame, SectionHeader, isCentered } from './SectionFrame.jsx';
import ProjectCard from './ProjectCard.jsx';
import { cx } from '../../utils/links.js';

export default function ProjectGrid({ section }) {
  const d = section.data;
  const featuredOnly = d.mode === 'featured';
  const { data, loading, error } = useAsync(
    () => cachedFetch(`projects:${featuredOnly}`, () => publicApi.projects(featuredOnly ? { featured: 'true' } : {})),
    [featuredOnly],
  );
  const [filter, setFilter] = useState('All');

  const categories = useMemo(() => ['All', ...new Set((data || []).map((p) => p.category).filter(Boolean))], [data]);
  const projects = useMemo(
    () => (data || []).filter((p) => filter === 'All' || p.category === filter).slice(0, d.limit || 12),
    [data, filter, d.limit],
  );

  if (!loading && !error && (data || []).length === 0 && !section._editing) return null;

  return (
    <SectionFrame section={section} label={d.heading || 'Projects'}>
      <SectionHeader data={d} center={isCentered(section)} />
      {d.showFilters && categories.length > 2 && (
        <div role="group" aria-label="Filter projects" className={cx('mb-8 flex flex-wrap gap-2', isCentered(section) && 'justify-center')}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
              className={cx('rounded-full border px-4 py-1.5 text-sm transition', filter === c ? 'border-primary bg-primary/10 text-primary' : 'border-line text-muted hover:text-fg')}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      {loading && <Loading label="Loading projects…" />}
      {error && <p className="text-sm text-muted">Projects could not be loaded right now.</p>}
      {!loading && !error && projects.length === 0 && <p className="text-sm text-muted">No published projects yet.</p>}
      <Editable field="mode" className={cx('grid gap-6 sm:grid-cols-2', d.columns === '3' && 'lg:grid-cols-3')}>
        {projects.map((p) => (
          <ProjectCard key={p._id} project={p} />
        ))}
      </Editable>
      {d.viewAllButton?.visible && (
        <div className="mt-12 text-center">
          <CmsButton button={d.viewAllButton} field="viewAllButton" />
        </div>
      )}
    </SectionFrame>
  );
}
