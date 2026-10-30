import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useEditing } from '../../context/EditContext.jsx';
import { ErrorState, Loading } from '../common/Status.jsx';
import { isResumeLink, track } from '../../utils/track.js';

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/90 text-fg shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
      aria-label="Back to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}

export function SiteShell({ children }) {
  const { settings, error, reload } = useSite();
  const editing = useEditing();

  // Count CV downloads from any link on the site (hero, header, résumé page…).
  useEffect(() => {
    if (editing) return undefined;
    const onClick = (e) => {
      const a = e.target.closest?.('a[href]');
      if (a && isResumeLink(a.getAttribute('href'), settings?.resume?.url)) track('resume', '/resume');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [editing, settings?.resume?.url]);

  if (error && !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ErrorState title="The site is temporarily unavailable" message={error.message} onRetry={reload} />
      </div>
    );
  }
  if (!settings) return <Loading className="min-h-screen" />;
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      {!editing && <BackToTop />}
    </div>
  );
}

export default function PublicLayout() {
  return (
    <SiteShell>
      <Outlet />
    </SiteShell>
  );
}
