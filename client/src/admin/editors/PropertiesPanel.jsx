import { useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, MousePointerClick, Trash2 } from 'lucide-react';
import FieldRenderer from './FieldRenderer.jsx';
import { SECTION_FIELDS, SECTION_META, STYLE_FIELDS } from './sectionFields.js';
import { IconButton, Tabs } from '../components/ui.jsx';

/** Maps a clicked preview field (e.g. "items" or "availability") to the top-level control to highlight. */
const topKey = (field) => (field ? field.split('.')[0] : null);

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
        Select a section in the list, or click any highlighted element in the preview to edit it.
      </div>
    );
  }

  const meta = SECTION_META[section.type] || { label: section.type };
  const fields = SECTION_FIELDS[section.type] || [];
  const setData = (key, value) => onChange({ ...section, data: { ...section.data, [key]: value } });
  const setStyle = (key, value) => onChange({ ...section, style: { ...section.style, [key]: value } });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Editing section</p>
          <h2 className="truncate text-sm font-semibold text-slate-900">{meta.label}</h2>
        </div>
        <IconButton icon={section.visible ? Eye : EyeOff} label={section.visible ? 'Hide section' : 'Show section'} onClick={onToggle} />
        <IconButton icon={Copy} label="Duplicate section" onClick={onDuplicate} />
        <IconButton icon={Trash2} label="Delete section" variant="danger-ghost" onClick={onDelete} />
      </div>
      {!section.visible && <p className="bg-amber-50 px-4 py-2 text-xs text-amber-800">This section is hidden and will not appear on the public site.</p>}
      <Tabs tabs={[['content', 'Content'], ['style', 'Style']]} value={tab} onChange={setTab} className="px-4" />
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {tab === 'content'
          ? fields.map((f) => <FieldRenderer key={f.key} field={f} value={section.data?.[f.key]} onChange={(v) => setData(f.key, v)} highlighted={highlighted === f.key} />)
          : STYLE_FIELDS.map((f) => <FieldRenderer key={f.key} field={f} value={section.style?.[f.key]} onChange={(v) => setStyle(f.key, v)} />)}
      </div>
    </div>
  );
}
