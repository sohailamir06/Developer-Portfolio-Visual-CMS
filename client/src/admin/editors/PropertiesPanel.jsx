import { useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, MousePointerClick, Trash2 } from 'lucide-react';
import FieldRenderer from './FieldRenderer.jsx';
import { SECTION_FIELDS, SECTION_META, STYLE_FIELDS } from './sectionFields.js';
import { IconButton, MoreOptions, Tabs } from '../components/ui.jsx';

/** Maps a clicked preview field (e.g. "items" or "availability") to the top-level control to highlight. */
const topKey = (field) => (field ? field.split('.')[0] : null);

function FieldList({ fields, values, onChange, highlighted }) {
  const basic = fields.filter((f) => !f.advanced);
  const advanced = fields.filter((f) => f.advanced);
  const render = (f) => <FieldRenderer key={f.key} field={f} value={values?.[f.key]} onChange={(v) => onChange(f.key, v)} highlighted={highlighted === f.key} />;
  return (
    <>
      {basic.map(render)}
      {advanced.length > 0 && (
        // Open automatically when the clicked element lives in "More options".
        <MoreOptions key={advanced.some((f) => f.key === highlighted) ? 'open' : 'closed'} defaultOpen={advanced.some((f) => f.key === highlighted)}>
          {advanced.map(render)}
        </MoreOptions>
      )}
    </>
  );
}

export default function PropertiesPanel({ section, selectedField, onChange, onToggle, onDuplicate, onDelete }) {
  const [tab, setTab] = useState('content');
  const highlighted = topKey(selectedField);

  useEffect(() => {
    if (!highlighted) return;
    setTab('content');
    // Wait for the panel to render, then bring the matching control into view.
    const t = setTimeout(() => {
      const el = document.getElementById(`field-${highlighted}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.querySelector('input, textarea, [contenteditable="true"]')?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(t);
  }, [highlighted, section?.id]);

  if (!section) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-slate-500">
        <MousePointerClick size={28} className="text-slate-300" />
        Click any text, picture or button in the preview to change it — or pick a section from the list on the left.
      </div>
    );
  }

  const meta = SECTION_META[section.type] || { label: section.type };
  const setData = (key, value) => onChange({ ...section, data: { ...section.data, [key]: value } });
  const setStyle = (key, value) => onChange({ ...section, style: { ...section.style, [key]: value } });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">You are editing</p>
          <h2 className="truncate text-sm font-semibold text-slate-900">{meta.label}</h2>
        </div>
        <IconButton icon={section.visible ? Eye : EyeOff} label={section.visible ? 'Hide this section from visitors' : 'Show this section to visitors'} onClick={onToggle} />
        <IconButton icon={Copy} label="Make a copy of this section" onClick={onDuplicate} />
        <IconButton icon={Trash2} label="Delete this section" variant="danger-ghost" onClick={onDelete} />
      </div>
      {meta.description && <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">{meta.description}</p>}
      {!section.visible && <p className="bg-amber-50 px-4 py-2 text-xs text-amber-800">This section is hidden — visitors won’t see it. Click the eye icon to show it again.</p>}
      <Tabs tabs={[['content', 'Content'], ['style', 'Design']]} value={tab} onChange={setTab} className="px-4" />
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {tab === 'content' ? (
          <FieldList fields={SECTION_FIELDS[section.type] || []} values={section.data} onChange={setData} highlighted={highlighted} />
        ) : (
          <FieldList fields={STYLE_FIELDS} values={section.style} onChange={setStyle} />
        )}
      </div>
    </div>
  );
}
