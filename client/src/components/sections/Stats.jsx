import { Editable } from '../../context/EditContext.jsx';
import { SectionFrame, SectionHeader, isCentered } from './SectionFrame.jsx';
import { cx } from '../../utils/links.js';

export default function Stats({ section }) {
  const d = section.data;
  const items = d.items || [];
  return (
    <SectionFrame section={section} label={d.heading || 'Statistics'}>
      <SectionHeader data={d} center={isCentered(section)} />
      <Editable
        field="items"
        as="dl"
        className={cx('grid gap-4', items.length >= 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3', !items.length && 'min-h-16')}
      >
        {items.map((s, i) => (
          <div key={i} className="card p-6 text-left">
            <dd className="font-heading text-4xl font-bold text-primary">{s.value}</dd>
            <dt className="mt-2 font-medium">{s.label}</dt>
            {s.description && <dd className="mt-1 text-sm text-muted">{s.description}</dd>}
          </div>
        ))}
        {!items.length && section._editing && <p className="text-sm text-muted">Add statistics in the properties panel.</p>}
      </Editable>
    </SectionFrame>
  );
}
