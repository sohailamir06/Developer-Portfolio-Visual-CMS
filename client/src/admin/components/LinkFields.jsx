import { useEffect, useId, useState } from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { isExternal, isSafeUrl, pagePath } from '../../utils/links.js';
import { Badge, Field, Input, Select, Toggle } from './ui.jsx';

let pagesPromise;
/** Internal destinations offered as suggestions (pages + projects). Cached for the session. */
function useInternalLinks() {
  const [links, setLinks] = useState([]);
  useEffect(() => {
    pagesPromise ??= Promise.all([adminApi.pages.list(), adminApi.projects.list()])
      .then(([pages, projects]) => [
        ...pages.map((p) => ({ url: pagePath(p.slug), label: `Page · ${p.title}` })),
        ...projects.map((p) => ({ url: `/projects/${p.slug}`, label: `Project · ${p.title}` })),
      ])
      .catch(() => {
        pagesPromise = undefined;
        return [];
      });
    let active = true;
    pagesPromise.then((l) => active && setLinks(l));
    return () => {
      active = false;
    };
  }, []);
  return links;
}

export const resetLinkCache = () => {
  pagesPromise = undefined;
};

/** URL input with internal page suggestions and the same safety rule the server enforces. */
export function LinkInput({ value, onChange, placeholder = '/page or https://…', allowEmpty = true, id }) {
  const listId = useId();
  const links = useInternalLinks();
  const invalid = value && !isSafeUrl(value);
  const kind = !value ? null : isExternal(value) ? 'external' : value.startsWith('#') ? 'anchor' : 'internal';
  return (
    <div className="space-y-1">
      <div className="relative">
        <Input id={id} value={value || ''} onChange={(e) => onChange(e.target.value.trim())} placeholder={placeholder} list={listId} invalid={invalid || (!allowEmpty && !value)} className="pr-20" />
        {kind && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
            <Badge color={kind === 'external' ? 'amber' : 'blue'}>
              {kind === 'external' ? <ExternalLink size={10} /> : <LinkIcon size={10} />}
              {kind}
            </Badge>
          </span>
        )}
        <datalist id={listId}>
          {links.map((l) => (
            <option key={l.url} value={l.url}>
              {l.label}
            </option>
          ))}
        </datalist>
      </div>
      {invalid && <p className="text-xs text-red-600">Not allowed. Use https://…, /path, #anchor, mailto: or tel:</p>}
    </div>
  );
}

const BUTTON_STYLES = [
  ['primary', 'Primary (filled)'],
  ['secondary', 'Secondary (tinted)'],
  ['outline', 'Outline'],
  ['ghost', 'Text only'],
];

/** Editor for a CMS button object: label, URL, internal/external, new tab, style, visibility. */
export function ButtonField({ value = {}, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <Toggle size="sm" label="Show button" checked={value.visible !== false} onChange={(v) => set({ visible: v })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Button text">
          <Input value={value.label || ''} onChange={(e) => set({ label: e.target.value })} maxLength={80} placeholder="e.g. View projects" />
        </Field>
        <Field label="Style">
          <Select value={value.style || 'primary'} onChange={(e) => set({ style: e.target.value })} options={BUTTON_STYLES} />
        </Field>
      </div>
      <Field label="Destination" hint="Pick a page from the list or paste an external URL.">
        <LinkInput value={value.url} onChange={(url) => set({ url, newTab: isExternal(url) && !value.url ? true : value.newTab })} />
      </Field>
      <Toggle size="sm" label="Open in a new tab" checked={Boolean(value.newTab)} onChange={(v) => set({ newTab: v })} />
    </div>
  );
}
