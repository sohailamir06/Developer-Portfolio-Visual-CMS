import { useMemo } from 'react';
import { publicApi } from '../../services/api.js';
import { cachedFetch, useAsync } from '../../utils/hooks.js';
import { Editable } from '../../context/EditContext.jsx';
import { Icon } from '../common/Icon.jsx';
import { Loading } from '../common/Status.jsx';
import { SectionFrame, SectionHeader, isCentered } from './SectionFrame.jsx';
import { cx } from '../../utils/links.js';

function Proficiency({ skill, show }) {
  if (!show) return null;
  if (typeof skill.proficiency === 'number') {
    return (
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line" role="meter" aria-valuenow={skill.proficiency} aria-valuemin={0} aria-valuemax={100} aria-label={`${skill.name} proficiency`}>
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${skill.proficiency}%` }} />
      </div>
    );
  }
  return skill.proficiencyLabel ? <span className="text-xs text-muted">{skill.proficiencyLabel}</span> : null;
}

export default function Skills({ section }) {
  const d = section.data;
  const { data: skills, loading, error } = useAsync(() => cachedFetch('skills', publicApi.skills), []);

  const groups = useMemo(() => {
    const wanted = (d.categories || []).map((c) => c.toLowerCase());
    const map = new Map();
    for (const s of skills || []) {
      if (wanted.length && !wanted.includes(s.category.toLowerCase())) continue;
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category).push(s);
    }
    return [...map.entries()];
  }, [skills, d.categories]);

  if (!loading && !error && groups.length === 0 && !section._editing) return null;

  return (
    <SectionFrame section={section} label={d.heading || 'Skills'}>
      <SectionHeader data={d} center={isCentered(section)} />
      {loading && <Loading label="Loading skills…" className="py-8" />}
      {error && <p className="text-sm text-muted">Skills could not be loaded.</p>}
      {!loading && groups.length === 0 && <p className="text-sm text-muted">No skills yet — add some in Admin → Skills.</p>}

      <Editable field="layout" className={cx(d.layout === 'grid' && 'grid gap-5 sm:grid-cols-2 lg:grid-cols-4', d.layout === 'list' && 'space-y-8', d.layout === 'pills' && 'space-y-6')}>
        {d.layout === 'pills' ? (
          <ul className={cx('flex flex-wrap gap-2.5', isCentered(section) && 'justify-center')}>
            {groups.flatMap(([, list]) => list).map((s) => (
              <li key={s._id} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm transition hover:border-primary/60">
                <Icon name={s.icon} size={16} className="text-primary" alt="" />
                {s.name}
              </li>
            ))}
          </ul>
        ) : (
          groups.map(([category, list]) => (
            <div key={category} className={cx(d.layout === 'grid' && 'card p-6')}>
              <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-primary">{category}</h3>
              <ul className={cx(d.layout === 'list' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3.5')}>
                {list.map((s) => (
                  <li key={s._id} className={cx(d.layout === 'list' && 'card px-4 py-3')}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-theme bg-primary/10 text-primary">
                        <Icon name={s.icon} size={16} alt="" />
                      </span>
                      <span className="flex-1 text-sm font-medium">{s.name}</span>
                      {typeof s.proficiency !== 'number' && <Proficiency skill={s} show={d.showProficiency} />}
                    </div>
                    {typeof s.proficiency === 'number' && <Proficiency skill={s} show={d.showProficiency} />}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Editable>
    </SectionFrame>
  );
}
