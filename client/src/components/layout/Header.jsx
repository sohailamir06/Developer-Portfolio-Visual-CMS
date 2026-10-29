import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { SmartLink } from '../common/SmartLink.jsx';
import { CmsButton } from '../common/CmsButton.jsx';
import { cx, isExternal } from '../../utils/links.js';

export function Logo({ settings, className }) {
  const logo = settings?.logo || {};
  return (
    <SmartLink to="/" className={cx('flex items-center gap-2 font-heading text-lg font-bold tracking-tight', className)} aria-label={`${settings?.siteTitle || 'Home'} — home`}>
      {logo.type === 'image' && logo.image ? (
        <img src={logo.image} alt={logo.alt || settings?.siteTitle || ''} className="h-9 w-auto max-w-[160px] object-contain" />
      ) : (
        <>
          <span className="grid h-9 min-w-9 place-items-center rounded-theme bg-primary/15 px-2 font-mono text-sm text-primary ring-1 ring-primary/30">
            {logo.text || 'DN'}
          </span>
          <span className="hidden sm:inline">{settings?.siteTitle}</span>
        </>
      )}
    </SmartLink>
  );
}

export function buildTree(items = []) {
  const roots = items.filter((i) => !i.parentId);
  return roots.map((r) => ({ ...r, children: items.filter((i) => i.parentId === r.id) }));
}

function NavItem({ item, onNavigate }) {
  const [open, setOpen] = useState(false);
  const linkClass = ({ isActive }) =>
    cx('rounded-theme px-3 py-2 text-sm font-medium transition hover:text-primary', isActive ? 'text-primary' : 'text-fg/80');

  const link = isExternal(item.url) || item.url.startsWith('#') ? (
    <SmartLink to={item.url} newTab={item.newTab} className="rounded-theme px-3 py-2 text-sm font-medium text-fg/80 transition hover:text-primary" onClick={onNavigate}>
      {item.label}
    </SmartLink>
  ) : (
    <NavLink to={item.url} end={item.url === '/'} className={linkClass} target={item.newTab ? '_blank' : undefined} onClick={onNavigate}>
      {item.label}
    </NavLink>
  );

  if (!item.children?.length) return link;
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className="flex items-center">
        {link}
        <button type="button" aria-expanded={open} aria-label={`${item.label} submenu`} className="-ml-2 p-1 text-muted hover:text-primary" onClick={() => setOpen((o) => !o)}>
          <ChevronDown size={14} />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-full z-50 min-w-48 pt-2">
          <div className="card flex flex-col p-2 shadow-xl">
            {item.children.map((c) => (
              <SmartLink key={c.id} to={c.url} newTab={c.newTab} onClick={onNavigate} className="rounded-theme px-3 py-2 text-sm text-fg/80 hover:bg-bg hover:text-primary">
                {c.label}
              </SmartLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { settings, navigation, mode, toggleMode } = useSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const tree = useMemo(() => buildTree(navigation.main), [navigation.main]);
  const header = settings?.header || {};
  const layout = settings?.theme?.headerLayout || 'split';

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const contact = header.showContactButton !== false && <CmsButton button={header.contactButton} className="!px-4 !py-2" icon={false} />;
  const toggle = toggleMode && (
    <button type="button" onClick={toggleMode} className="grid h-9 w-9 place-items-center rounded-theme text-muted transition hover:bg-surface hover:text-fg" aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
      {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
  const nav = (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {tree.map((item) => (
        <NavItem key={item.id} item={item} />
      ))}
    </nav>
  );

  return (
    <header
      className={cx(
        'top-0 z-40 w-full border-b transition-colors',
        header.sticky !== false && 'sticky',
        scrolled || open ? 'border-line bg-bg/85 backdrop-blur-md' : 'border-transparent bg-bg/0',
      )}
    >
      <div className={cx('container-site flex items-center gap-4', layout === 'center' ? 'flex-col py-3 lg:gap-2' : 'h-16 justify-between')}>
        {layout === 'center' ? (
          <>
            <div className="flex w-full items-center justify-between lg:justify-center">
              <Logo settings={settings} />
              <MobileButton open={open} setOpen={setOpen} />
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              {nav}
              {toggle}
              {contact}
            </div>
          </>
        ) : (
          <>
            <div className={cx('flex items-center', layout === 'left' && 'gap-6')}>
              <Logo settings={settings} />
              {layout === 'left' && nav}
            </div>
            {layout === 'split' && nav}
            <div className="flex items-center gap-2">
              <div className="hidden lg:block">{toggle}</div>
              <div className="hidden sm:block">{contact}</div>
              <MobileButton open={open} setOpen={setOpen} />
            </div>
          </>
        )}
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-bg lg:hidden">
          <nav aria-label="Mobile" className="container-site flex flex-col gap-1 py-4">
            {tree.map((item) => (
              <div key={item.id} className="flex flex-col">
                <SmartLink to={item.url} newTab={item.newTab} className="rounded-theme px-3 py-3 text-base font-medium hover:bg-surface hover:text-primary">
                  {item.label}
                </SmartLink>
                {item.children?.map((c) => (
                  <SmartLink key={c.id} to={c.url} newTab={c.newTab} className="ml-4 rounded-theme px-3 py-2 text-sm text-muted hover:text-primary">
                    {c.label}
                  </SmartLink>
                ))}
              </div>
            ))}
            <div className="mt-3 flex items-center gap-3 border-t border-line pt-4">
              {contact}
              {toggle}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileButton({ open, setOpen }) {
  return (
    <button
      type="button"
      className="grid h-10 w-10 place-items-center rounded-theme text-fg hover:bg-surface lg:hidden"
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls="mobile-menu"
      onClick={() => setOpen((o) => !o)}
    >
      {open ? <X size={22} /> : <Menu size={22} />}
    </button>
  );
}
