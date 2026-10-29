import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

export const DEVICES = {
  desktop: { label: 'Desktop', width: 1280 },
  tablet: { label: 'Tablet', width: 768 },
  mobile: { label: 'Mobile', width: 390 },
};

/**
 * Renders the real public site inside an iframe at the chosen device width, scaled to fit.
 * Unsaved editor state is pushed in via postMessage; clicks on editable elements come back out.
 */
export default function PreviewFrame({ pageId, page, selected, device, onSelect, scrollToSection }) {
  const wrapRef = useRef(null);
  const frameRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const latest = useRef({ page, selected });
  latest.current = { page, selected };

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setBox({ width: entry.contentRect.width, height: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === 'cms:ready') {
        setReady(true);
        e.source.postMessage({ type: 'cms:update', ...latest.current }, window.location.origin);
      }
      if (e.data?.type === 'cms:select') onSelect({ sectionId: e.data.sectionId, field: e.data.field });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onSelect]);

  useEffect(() => {
    if (ready) frameRef.current?.contentWindow?.postMessage({ type: 'cms:update', page, selected }, window.location.origin);
  }, [ready, page, selected]);

  useEffect(() => {
    if (ready && scrollToSection) frameRef.current?.contentWindow?.postMessage({ type: 'cms:scrollTo', sectionId: scrollToSection.id }, window.location.origin);
  }, [ready, scrollToSection]);

  const deviceWidth = DEVICES[device].width;
  const available = Math.max(box.width - 32, 200);
  const scale = Math.min(1, available / deviceWidth);
  const frameHeight = Math.max((box.height - 32) / scale, 400);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-slate-200/70">
      <div className="absolute left-1/2 top-4 origin-top -translate-x-1/2" style={{ width: deviceWidth * scale, height: frameHeight * scale }}>
        <iframe
          ref={frameRef}
          title="Page preview"
          src={`/preview/${pageId}?embed=1`}
          className="origin-top-left rounded-md bg-white shadow-xl ring-1 ring-slate-300"
          style={{ width: deviceWidth, height: frameHeight, transform: `scale(${scale})` }}
        />
      </div>
      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading preview…
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-white">
        {DEVICES[device].label} · {deviceWidth}px{scale < 1 && ` · shown at ${Math.round(scale * 100)}%`}
      </div>
    </div>
  );
}
