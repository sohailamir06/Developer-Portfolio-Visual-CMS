import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../utils/hooks.js';

export default function NotFound() {
  useDocumentMeta({ title: 'Page not found', noindex: true });
  return (
    <section className="container-site flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-md text-muted">The page you are looking for doesn’t exist or may have moved.</p>
      <Link to="/" className="btn btn-primary mt-8">
        Back to home
      </Link>
    </section>
  );
}
