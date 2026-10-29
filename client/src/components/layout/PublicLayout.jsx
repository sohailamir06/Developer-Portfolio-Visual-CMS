import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { ErrorState, Loading } from '../common/Status.jsx';

export function SiteShell({ children }) {
  const { settings, error, reload } = useSite();
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
