import ImageField from './ImageField.jsx';
import { LinkInput } from './LinkFields.jsx';
import { Field, Input, Textarea, Toggle } from './ui.jsx';

function Counter({ value = '', max }) {
  const n = value.length;
  return <span className={n > max ? 'text-red-600' : 'text-slate-400'}>{n}/{max}</span>;
}

/** SEO metadata editor with a search-result preview. */
export default function SeoFields({ value = {}, onChange, fallbackTitle, path }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="truncate text-xs text-emerald-700">{window.location.origin}{path}</p>
        <p className="truncate text-base text-blue-800">{value.title || fallbackTitle || 'Page title'}</p>
        <p className="line-clamp-2 text-xs text-slate-600">{value.description || 'Add a meta description to control how this page appears in search results.'}</p>
      </div>
      <Field label={<span className="flex justify-between">SEO title <Counter value={value.title} max={60} /></span>} hint="Leave empty to use the page title.">
        <Input value={value.title || ''} onChange={(e) => set({ title: e.target.value })} maxLength={120} placeholder={fallbackTitle} />
      </Field>
      <Field label={<span className="flex justify-between">Meta description <Counter value={value.description} max={160} /></span>}>
        <Textarea rows={3} value={value.description || ''} onChange={(e) => set({ description: e.target.value })} maxLength={320} />
      </Field>
      <Field label="Social sharing image" hint="Shown when the link is shared. 1200×630 works best.">
        <ImageField value={{ url: value.image }} onChange={(img) => set({ image: img.url })} options={[]} />
      </Field>
      <Field label="Canonical URL" hint="Only set this if the content lives at another URL too.">
        <LinkInput value={value.canonical} onChange={(canonical) => set({ canonical })} placeholder="https://…" />
      </Field>
      <Toggle size="sm" label="Hide from search engines (noindex)" checked={Boolean(value.noindex)} onChange={(noindex) => set({ noindex })} />
    </div>
  );
}
