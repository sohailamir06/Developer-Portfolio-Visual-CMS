import { useEffect, useRef, useState } from 'react';

/**
 * Fades content in the first time it scrolls into view. Content is visible by default
 * (no JS, no IntersectionObserver, reduced motion, printing), so nothing can stay hidden.
 */
export default function Reveal({ children, immediate = false }) {
  const ref = useRef(null);
  const [state, setState] = useState(immediate ? 'shown' : 'idle'); // idle → hidden → shown

  useEffect(() => {
    if (immediate || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    // Only animate sections that start below the fold.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return undefined;
    setState('hidden');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  return (
    <div ref={ref} className={state === 'hidden' ? 'reveal' : state === 'shown' ? 'reveal reveal-in' : undefined}>
      {children}
    </div>
  );
}
