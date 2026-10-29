import { Component } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cx } from '../../utils/links.js';

export function Loading({ label = 'Loading…', className }) {
  return (
    <div role="status" className={cx('flex items-center justify-center gap-3 py-16 text-muted', className)}>
      <Loader2 className="animate-spin" size={20} aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }) {
  return (
    <div role="alert" className={cx('mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center', className)}>
      <AlertTriangle className="text-accent" size={28} aria-hidden="true" />
      <h2 className="text-lg font-semibold">{title}</h2>
      {message && <p className="text-sm text-muted">{message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-outline mt-2" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Isolates a single section: bad or unexpected content hides that section instead of crashing the page. */
export class SectionBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err) {
    console.error(`Section "${this.props.name}" failed to render:`, err);
  }

  render() {
    if (this.state.failed) {
      return this.props.showError ? (
        <div className="container-site py-8 text-center text-sm text-muted">This section could not be displayed.</div>
      ) : null;
    }
    return this.props.children;
  }
}
