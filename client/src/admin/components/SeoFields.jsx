import ImageField from './ImageField.jsx';
import { LinkInput } from './LinkFields.jsx';
import { Field, Input, MoreOptions, Textarea, Toggle } from './ui.jsx';

function Counter({ value = '', max }) {
  const n = value.length;
  return <span className={n > max ? 'text-red-600' : 'text-slate-400'}>{n > max ? `${n}/${max} — a bit long` : `${n}/${max}`}</span>;
}

/** How a page appears in Google and when shared — explained in plain language. */
export default function SeoFields({ value = {}, onChange, fallbackTitle, path }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-700">How it may look in Google</p>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="truncate text-xs text-emerald-700">
            {window.location.origin}
            {path}
          </p>
          <p className="truncate text-base text-blue-800">{value.title || fallbackTitle || 'Page title'}</p>
          <p className="line-clamp-2 text-xs text-slate-600">{value.description || 'Add a short description below — otherwise Google picks some text from the page.'}</p>
        </div>
      </div>
      <Field
        label={
          <span className="flex w-full justify-between gap-2">
            Title in search results <Counter value={value.title} max={60} />
          </span>
        }
        hint="Leave empty to use the page name."
        help="The blue headline people see in Google and in the browser tab. Around 50–60 characters works best."
      >
        <Input value={value.title || ''} onChange={(e) => set({ title: e.target.value })} maxLength={120} placeholder={fallbackTitle} />
      </Field>
      <Field
        label={
          <span className="flex w-full justify-between gap-2">
            Description in search results <Counter value={value.description} max={160} />
          </span>
        }
        help="One or two sentences shown under the title in Google and in link previews on LinkedIn, WhatsApp, etc. Around 150 characters works best."
      >
        <Textarea rows={3} value={value.description || ''} onChange={(e) => set({ description: e.target.value })} maxLength={320} />
      </Field>
      <Field label="Picture when the link is shared" hint="Shown on LinkedIn, X, WhatsApp… A wide picture (1200×630) works best.">
        <ImageField value={{ url: value.image }} onChange={(img) => set({ image: img.url })} options={[]} />
      </Field>
      <MoreOptions title="Advanced search settings">
        <Toggle
          size="sm"
          label="Hide this page from Google"
          description="Visitors with the link can still open it; it just won’t appear in search results."
          checked={Boolean(value.noindex)}
          onChange={(noindex) => set({ noindex })}
        />
        <Field
          label="Original address (canonical link)"
          help="Only needed if the same content is also published on another website. Paste that address so Google knows which one is the original. Most people leave this empty."
        >
          <LinkInput value={value.canonical} onChange={(canonical) => set({ canonical })} placeholder="Leave empty unless you know you need it" />
        </Field>
      </MoreOptions>
    </div>
  );
}
