import { Mail, MapPin, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { SmartLink } from '../common/SmartLink.jsx';
import { SocialIcon, platformLabel } from '../common/Icon.jsx';
import { Logo } from './Header.jsx';
import { cx } from '../../utils/links.js';

export function SocialLinks({ social = [], className, size = 18 }) {
  if (!social.length) return null;
  return (
    <ul className={cx('flex flex-wrap items-center gap-2', className)}>
      {social.map((s) => (
        <li key={`${s.platform}-${s.url}`}>
          <SmartLink
            to={s.url}
            newTab={!s.url.startsWith('mailto:')}
            className="grid h-10 w-10 place-items-center rounded-theme border border-line text-muted transition hover:border-primary hover:text-primary"
            aria-label={s.label || platformLabel(s.platform)}
            title={s.label || platformLabel(s.platform)}
          >
            <SocialIcon platform={s.platform} size={size} />
          </SmartLink>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  const { settings, navigation } = useSite();
  if (!settings) return null;
  const footer = settings.footer || {};
  const contact = settings.contact || {};
  const copyright = (footer.copyright || '').replace('{year}', new Date().getFullYear());
  const columns = settings.theme?.footerLayout !== 'simple';
  const links = (navigation.footer || []).filter((i) => !i.parentId);

  const contactList = footer.showContact !== false && (contact.email || contact.phone || contact.location) && (
    <ul className="space-y-2 text-sm text-muted">
      {contact.email && (
        <li>
          <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 hover:text-primary">
            <Mail size={15} aria-hidden="true" /> {contact.email}
          </a>
        </li>
      )}
      {contact.phone && (
        <li>
          <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2 hover:text-primary">
            <Phone size={15} aria-hidden="true" /> {contact.phone}
          </a>
        </li>
      )}
      {contact.location && (
        <li className="inline-flex items-center gap-2">
          <MapPin size={15} aria-hidden="true" /> {contact.location}
        </li>
      )}
    </ul>
  );

  const nav = footer.showNavigation !== false && links.length > 0 && (
    <nav aria-label="Footer">
      <ul className={cx('text-sm', columns ? 'space-y-2' : 'flex flex-wrap gap-x-6 gap-y-2')}>
        {links.map((l) => (
          <li key={l.id}>
            <SmartLink to={l.url} newTab={l.newTab} className="text-muted transition hover:text-primary">
              {l.label}
            </SmartLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <footer className="mt-auto border-t border-line bg-surface/40">
      {columns ? (
        <div className="container-site grid gap-10 py-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo settings={settings} />
            {footer.intro && <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{footer.intro}</p>}
            {footer.showSocial !== false && <SocialLinks social={settings.social} className="mt-6" />}
          </div>
          {nav && (
            <div className="md:col-span-3">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-fg/70">Navigate</h2>
              {nav}
            </div>
          )}
          {contactList && (
            <div className="md:col-span-4">
              <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-fg/70">Contact</h2>
              {contactList}
            </div>
          )}
        </div>
      ) : (
        <div className="container-site flex flex-col items-center gap-6 py-10 text-center">
          <Logo settings={settings} />
          {footer.intro && <p className="max-w-md text-sm text-muted">{footer.intro}</p>}
          {nav}
          {footer.showSocial !== false && <SocialLinks social={settings.social} />}
        </div>
      )}
      {copyright && (
        <div className="border-t border-line">
          <p className="container-site py-5 text-center text-xs text-muted">{copyright}</p>
        </div>
      )}
    </footer>
  );
}
