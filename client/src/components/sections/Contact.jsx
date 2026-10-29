import { Mail, MapPin, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { Editable } from '../../context/EditContext.jsx';
import ContactForm from '../forms/ContactForm.jsx';
import { SocialLinks } from '../layout/Footer.jsx';
import { SectionFrame } from './SectionFrame.jsx';
import { cx } from '../../utils/links.js';

export default function Contact({ section }) {
  const d = section.data;
  const { settings } = useSite();
  const c = settings?.contact || {};

  const details = [
    d.showEmail && c.email && { icon: Mail, label: 'Email', value: c.email, href: `mailto:${c.email}` },
    d.showPhone && c.phone && { icon: Phone, label: 'Phone', value: c.phone, href: `tel:${c.phone.replace(/\s+/g, '')}` },
    c.location && { icon: MapPin, label: 'Location', value: c.location },
  ].filter(Boolean);

  return (
    <SectionFrame section={section} label={d.heading || 'Contact'}>
      <div className={cx('grid gap-12', d.showForm && 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')}>
        <div className={cx(!d.showForm && 'mx-auto max-w-2xl text-center')}>
          {d.eyebrow && (
            <Editable field="eyebrow" as="p" className="eyebrow">
              {d.eyebrow}
            </Editable>
          )}
          <Editable field="heading" as="h2" className="section-heading">
            {d.heading}
          </Editable>
          {d.body && (
            <Editable field="body" as="p" className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              {d.body}
            </Editable>
          )}
          {details.length > 0 && (
            <ul className="mt-8 space-y-4 text-left">
              {details.map(({ icon: I, label, value, href }) => (
                <li key={label} className="flex items-center gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-theme bg-primary/10 text-primary">
                    <I size={18} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-muted">{label}</span>
                    {href ? (
                      <a href={href} className="font-medium hover:text-primary">
                        {value}
                      </a>
                    ) : (
                      <span className="font-medium">{value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {d.showSocial && <SocialLinks social={settings?.social} className={cx('mt-8', !d.showForm && 'justify-center')} />}
        </div>
        {d.showForm && (
          <Editable field="submitLabel">
            <ContactForm submitLabel={d.submitLabel} successMessage={d.successMessage} />
          </Editable>
        )}
      </div>
    </SectionFrame>
  );
}
