import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, Plus, Save, Trash2 } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { useSite } from '../../context/SiteContext.jsx';
import { buildPalette, contrastRatio } from '../../utils/theme.js';
import { platformLabel } from '../../components/common/Icon.jsx';
import ImageField from '../components/ImageField.jsx';
import { ButtonField, LinkInput } from '../components/LinkFields.jsx';
import RevisionHistory from '../components/RevisionHistory.jsx';
import { Button, Card, ErrorBox, Field, IconButton, Input, PageHeader, Select, Spinner, Tabs, Textarea, Toggle, useUi } from '../components/ui.jsx';

const PLATFORMS = ['github', 'linkedin', 'x', 'youtube', 'instagram', 'facebook', 'dribbble', 'medium', 'devto', 'stackoverflow', 'website', 'email'];

const PRESETS = [
  { name: 'Ocean (default)', mode: 'dark', primary: '#38bdf8', secondary: '#818cf8', accent: '#34d399', background: '#0b1120' },
  { name: 'Violet', mode: 'dark', primary: '#a78bfa', secondary: '#f472b6', accent: '#facc15', background: '#0f0a1e' },
  { name: 'Emerald', mode: 'dark', primary: '#34d399', secondary: '#22d3ee', accent: '#fbbf24', background: '#06130f' },
  { name: 'Classic blue (light)', mode: 'light', primary: '#2563eb', secondary: '#0f172a', accent: '#0ea5e9', background: '#ffffff' },
  { name: 'Warm (light)', mode: 'light', primary: '#ea580c', secondary: '#7c2d12', accent: '#0d9488', background: '#fffbf5' },
];

function ColorField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5" aria-label={label} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} className="font-mono" pattern="^#[0-9a-fA-F]{6}$" />
      </div>
    </Field>
  );
}

function ThemePreview({ theme }) {
  const p = useMemo(() => buildPalette(theme, theme.mode), [theme]);
  const rgb = (k) => `rgb(${p[k].join(' ')})`;
  const ratio = contrastRatio(p.text, p.bg).toFixed(1);
  const radius = { none: 0, sm: 4, md: 8, lg: 12, xl: 20 }[theme.radius] ?? 12;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200" style={{ background: rgb('bg'), color: rgb('text') }}>
      <div className="p-5">
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: rgb('primary') }}>
          Preview
        </p>
        <p className="mt-1 text-xl font-bold">Full-Stack Developer</p>
        <p className="mt-1 text-sm" style={{ color: rgb('muted') }}>
          Body text and muted text on your background.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-4 py-2 text-sm font-semibold" style={{ background: rgb('primary'), color: rgb('on-primary'), borderRadius: theme.buttonStyle === 'pill' ? 999 : radius }}>
            Primary button
          </span>
          <span className="border px-4 py-2 text-sm font-semibold" style={{ borderColor: rgb('border'), borderRadius: theme.buttonStyle === 'pill' ? 999 : radius }}>
            Outline
          </span>
        </div>
        <div className="mt-4 p-3 text-sm" style={{ background: rgb('surface'), border: `1px solid ${rgb('border')}`, borderRadius: radius }}>
          Card surface · <span style={{ color: rgb('accent') }}>accent</span> · <span style={{ color: rgb('secondary') }}>secondary</span>
        </div>
      </div>
      <p className="bg-white/90 px-5 py-1.5 text-[11px] text-slate-600">Text contrast {ratio}:1 {ratio >= 4.5 ? '✓ meets WCAG AA' : '— low contrast'}. Accent colours are auto-adjusted for readability.</p>
    </div>
  );
}

export default function Settings() {
  const { toast } = useUi();
  const site = useSite();
  const [s, setS] = useState(null);
  const [tab, setTab] = useState('general');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.settings.get();
      setS(data);
      setDirty(false);
      setError(null);
    } catch (err) {
      setError(toApiError(err));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const set = (section, patch) => {
    setS((x) => ({ ...x, [section]: typeof patch === 'object' && !Array.isArray(patch) && x[section] && typeof x[section] === 'object' && !Array.isArray(x[section]) ? { ...x[section], ...patch } : patch }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const { _id, __v, key, createdAt, updatedAt, updatedBy, version, ...body } = s;
    try {
      setS(await adminApi.settings.update(body));
      setDirty(false);
      site.reload?.();
      toast('Settings saved — changes are live.');
    } catch (err) {
      setError(toApiError(err));
      toast('Some settings are invalid', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!s) return error ? <ErrorBox error={error} onRetry={load} /> : <Spinner />;
  const t = s.theme;

  return (
    <>
      <PageHeader
        title="Website settings"
        description="Branding, theme, contact details, header and footer. Changes apply site-wide when saved."
        actions={
          <>
            <Button icon={History} onClick={() => setHistory(true)}>
              History
            </Button>
            <Button variant="primary" icon={Save} onClick={save} loading={saving} disabled={!dirty}>
              Save settings
            </Button>
          </>
        }
      />
      <Tabs
        tabs={[
          ['general', 'Branding'],
          ['theme', 'Theme'],
          ['contact', 'Contact & social'],
          ['layout', 'Header & footer'],
          ['resume', 'Résumé'],
        ]}
        value={tab}
        onChange={setTab}
        className="mb-5"
      />
      <ErrorBox error={error} />

      {tab === 'general' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4 p-5">
            <Field label="Site title" required>
              <Input value={s.siteTitle} onChange={(e) => { setS((x) => ({ ...x, siteTitle: e.target.value })); setDirty(true); }} maxLength={120} />
            </Field>
            <Field label="Tagline">
              <Input value={s.tagline} onChange={(e) => { setS((x) => ({ ...x, tagline: e.target.value })); setDirty(true); }} maxLength={200} />
            </Field>
            <Field label="Favicon" hint="Square PNG, 64×64 or larger.">
              <ImageField value={{ url: s.favicon }} onChange={(img) => { setS((x) => ({ ...x, favicon: img.url })); setDirty(true); }} options={[]} />
            </Field>
          </Card>
          <Card className="space-y-4 p-5">
            <Field label="Logo type">
              <Select value={s.logo.type} onChange={(e) => set('logo', { type: e.target.value })} options={[['text', 'Initials / text badge'], ['image', 'Image logo']]} />
            </Field>
            {s.logo.type === 'text' ? (
              <Field label="Logo text" hint="Short initials work best, e.g. JD.">
                <Input value={s.logo.text} onChange={(e) => set('logo', { text: e.target.value })} maxLength={40} />
              </Field>
            ) : (
              <Field label="Logo image">
                <ImageField value={{ url: s.logo.image, alt: s.logo.alt }} onChange={(img) => set('logo', { image: img.url, alt: img.alt || '' })} options={['alt']} />
              </Field>
            )}
          </Card>
        </div>
      )}

      {tab === 'theme' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card className="space-y-5 p-5">
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(({ name, ...preset }) => (
                  <button key={name} type="button" onClick={() => set('theme', preset)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:border-blue-400">
                    <span className="flex">
                      {[preset.background, preset.primary, preset.accent].map((c) => (
                        <span key={c} className="-ml-1 h-4 w-4 rounded-full ring-2 ring-white first:ml-0" style={{ background: c }} />
                      ))}
                    </span>
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Default mode">
                <Select value={t.mode} onChange={(e) => set('theme', { mode: e.target.value })} options={[['dark', 'Dark'], ['light', 'Light']]} />
              </Field>
              <div className="pt-6">
                <Toggle label="Let visitors switch light/dark" checked={t.allowToggle} onChange={(allowToggle) => set('theme', { allowToggle })} />
              </div>
              <ColorField label="Primary colour" value={t.primary} onChange={(primary) => set('theme', { primary })} />
              <ColorField label="Secondary colour" value={t.secondary} onChange={(secondary) => set('theme', { secondary })} />
              <ColorField label="Accent colour" value={t.accent} onChange={(accent) => set('theme', { accent })} />
              <ColorField label="Background colour" value={t.background} onChange={(background) => set('theme', { background })} />
              <Field label="Typography">
                <Select value={t.fontPreset} onChange={(e) => set('theme', { fontPreset: e.target.value })} options={[['modern', 'Modern (Inter)'], ['technical', 'Technical (Space Grotesk + mono)'], ['classic', 'Classic (serif headings)'], ['system', 'System fonts (fastest)']]} />
              </Field>
              <Field label="Button style">
                <Select value={t.buttonStyle} onChange={(e) => set('theme', { buttonStyle: e.target.value })} options={[['solid', 'Solid'], ['soft', 'Soft / tinted'], ['pill', 'Pill (fully rounded)']]} />
              </Field>
              <Field label="Corner radius">
                <Select value={t.radius} onChange={(e) => set('theme', { radius: e.target.value })} options={[['none', 'Square'], ['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large'], ['xl', 'Extra large']]} />
              </Field>
              <Field label="Header layout">
                <Select value={t.headerLayout} onChange={(e) => set('theme', { headerLayout: e.target.value })} options={[['split', 'Logo left · menu centre · button right'], ['left', 'Logo and menu left'], ['center', 'Centred logo, menu below']]} />
              </Field>
              <Field label="Footer layout">
                <Select value={t.footerLayout} onChange={(e) => set('theme', { footerLayout: e.target.value })} options={[['columns', 'Columns'], ['simple', 'Simple centred']]} />
              </Field>
            </div>
            {t.background && (t.mode === 'dark') !== (Number.parseInt(t.background.slice(1, 3), 16) < 128) && (
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">The background colour doesn’t match the {t.mode} mode, so a default {t.mode} background will be used.</p>
            )}
          </Card>
          <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
            <ThemePreview theme={t} />
          </div>
        </div>
      )}

      {tab === 'contact' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4 p-5">
            <h2 className="text-sm font-semibold">Contact details</h2>
            <Field label="Email address" hint="Shown publicly in the contact section and footer.">
              <Input type="email" value={s.contact.email} onChange={(e) => set('contact', { email: e.target.value })} />
            </Field>
            <Field label="Phone (optional)">
              <Input value={s.contact.phone} onChange={(e) => set('contact', { phone: e.target.value })} />
            </Field>
            <Field label="Location (optional)">
              <Input value={s.contact.location} onChange={(e) => set('contact', { location: e.target.value })} placeholder="e.g. Berlin, Germany · Remote" />
            </Field>
          </Card>
          <Card className="space-y-3 p-5">
            <h2 className="text-sm font-semibold">Social links</h2>
            {s.social.map((link, i) => (
              <div key={i} className="flex gap-2">
                <Select
                  value={link.platform}
                  onChange={(e) => set('social', s.social.map((l, j) => (j === i ? { ...l, platform: e.target.value } : l)))}
                  options={PLATFORMS.map((p) => [p, platformLabel(p)])}
                  className="w-36 shrink-0"
                  aria-label="Platform"
                />
                <div className="flex-1">
                  <LinkInput value={link.url} onChange={(url) => set('social', s.social.map((l, j) => (j === i ? { ...l, url } : l)))} placeholder={link.platform === 'email' ? 'mailto:you@example.com' : 'https://…'} allowEmpty={false} />
                </div>
                <IconButton icon={Trash2} label="Remove link" variant="danger-ghost" onClick={() => set('social', s.social.filter((_, j) => j !== i))} />
              </div>
            ))}
            <Button size="sm" icon={Plus} onClick={() => set('social', [...s.social, { platform: 'github', url: '', label: '' }])}>
              Add social link
            </Button>
          </Card>
        </div>
      )}

      {tab === 'layout' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4 p-5">
            <h2 className="text-sm font-semibold">Header</h2>
            <Toggle label="Sticky header" description="Header stays visible while scrolling." checked={s.header.sticky} onChange={(sticky) => set('header', { sticky })} />
            <Toggle label="Show contact button" checked={s.header.showContactButton} onChange={(showContactButton) => set('header', { showContactButton })} />
            {s.header.showContactButton && <ButtonField value={s.header.contactButton} onChange={(contactButton) => set('header', { contactButton })} />}
            <p className="text-xs text-slate-500">Menu links are edited under Navigation. Logo under Branding.</p>
          </Card>
          <Card className="space-y-4 p-5">
            <h2 className="text-sm font-semibold">Footer</h2>
            <Field label="Short introduction">
              <Textarea rows={3} value={s.footer.intro} onChange={(e) => set('footer', { intro: e.target.value })} maxLength={400} />
            </Field>
            <Field label="Copyright text" hint="{year} is replaced with the current year.">
              <Input value={s.footer.copyright} onChange={(e) => set('footer', { copyright: e.target.value })} maxLength={200} />
            </Field>
            <Toggle label="Show footer navigation" checked={s.footer.showNavigation} onChange={(showNavigation) => set('footer', { showNavigation })} />
            <Toggle label="Show social links" checked={s.footer.showSocial} onChange={(showSocial) => set('footer', { showSocial })} />
            <Toggle label="Show contact details" checked={s.footer.showContact} onChange={(showContact) => set('footer', { showContact })} />
          </Card>
        </div>
      )}

      {tab === 'resume' && (
        <Card className="max-w-2xl space-y-4 p-5">
          <p className="text-sm text-slate-600">Upload your résumé as a PDF. It is used by the hero download link and the Résumé page.</p>
          <Field label="Résumé file">
            <ImageField type="document" value={{ url: s.resume.url }} onChange={(f) => set('resume', { url: f.url })} options={[]} />
          </Field>
          <Field label="Link text">
            <Input value={s.resume.label} onChange={(e) => set('resume', { label: e.target.value })} maxLength={60} />
          </Field>
        </Card>
      )}

      <RevisionHistory
        open={history}
        onClose={() => setHistory(false)}
        load={() => adminApi.revisions.list('settings')}
        restore={(rev) => adminApi.revisions.restore(rev._id)}
        restoreHint="All website settings will be replaced with this saved version immediately."
        onRestored={() => {
          load();
          site.reload?.();
        }}
      />
    </>
  );
}
