import { Award, BadgeCheck, ExternalLink, Trophy } from 'lucide-react';
import { Editable } from '../../context/EditContext.jsx';
import { SmartLink } from '../common/SmartLink.jsx';
import { SectionFrame, SectionHeader, isCentered } from './SectionFrame.jsx';

const KINDS = {
  certificate: { icon: BadgeCheck, label: 'Certificate' },
  award: { icon: Trophy, label: 'Award' },
  achievement: { icon: Award, label: 'Achievement' },
};

export default function Certifications({ section }) {
  const d = section.data;
  const items = (d.items || []).filter((i) => i.title);
  if (!items.length && !section._editing) return null;

  return (
    <SectionFrame section={section} label={d.heading || 'Certifications'}>
      <SectionHeader data={d} center={isCentered(section)} />
      <Editable field="items" as="ul" className="grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c, i) => {
          const kind = KINDS[c.kind] || KINDS.certificate;
          return (
            <li key={i} className="card flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-theme bg-primary/10 text-primary" aria-hidden="true">
                  <kind.icon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    {kind.label}
                    {c.date && ` · ${c.date}`}
                  </p>
                  <h3 className="mt-1 font-semibold leading-snug">{c.title}</h3>
                  {c.issuer && <p className="mt-0.5 text-sm text-muted">{c.issuer}</p>}
                </div>
              </div>
              {c.description && <p className="mt-3 text-sm leading-relaxed text-fg/85">{c.description}</p>}
              {c.credentialUrl && (
                <SmartLink to={c.credentialUrl} newTab className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-primary hover:underline">
                  View credential <ExternalLink size={14} aria-hidden="true" />
                </SmartLink>
              )}
            </li>
          );
        })}
        {!items.length && <li className="text-sm text-muted">Add certificates and awards in the panel on the right.</li>}
      </Editable>
    </SectionFrame>
  );
}
