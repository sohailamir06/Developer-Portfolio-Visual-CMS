import { Quote } from 'lucide-react';
import { Editable } from '../../context/EditContext.jsx';
import { CmsImage } from '../common/CmsImage.jsx';
import { SectionFrame, SectionHeader, isCentered } from './SectionFrame.jsx';

export default function Testimonials({ section }) {
  const d = section.data;
  const items = (d.items || []).filter((i) => i.quote);
  if (!items.length && !section._editing) return null;
  return (
    <SectionFrame section={section} label={d.heading || 'Testimonials'}>
      <SectionHeader data={d} center={isCentered(section)} />
      <Editable field="items" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <figure key={i} className="card flex flex-col p-6 text-left">
            <Quote size={22} className="text-primary/70" aria-hidden="true" />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-fg/90">“{t.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              {t.avatar?.url && <CmsImage image={{ ...t.avatar, shape: 'circle' }} width={96} className="h-10 w-10" placeholder="none" />}
              <span>
                <span className="block text-sm font-semibold">{t.name}</span>
                {t.role && <span className="block text-xs text-muted">{t.role}</span>}
              </span>
            </figcaption>
          </figure>
        ))}
        {!items.length && <p className="text-sm text-muted">Add testimonials in the properties panel.</p>}
      </Editable>
    </SectionFrame>
  );
}
