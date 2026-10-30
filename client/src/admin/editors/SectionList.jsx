import { Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { SortableList } from '../components/Sortable.jsx';
import { Button, IconButton, Modal } from '../components/ui.jsx';
import { SECTION_META, sectionSummary } from './sectionFields.js';
import { cx } from '../../utils/links.js';

export function AddSectionModal({ open, onClose, onAdd }) {
  return (
    <Modal open={open} onClose={onClose} title="Add a section" size="lg">
      <p className="mb-4 text-sm text-slate-500">Pick the kind of section you want. It is added with example text that you can change straight away.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(SECTION_META).map(([type, meta]) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <meta.icon size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-800">{meta.label}</span>
              <span className="block text-xs text-slate-500">{meta.description}</span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

export default function SectionList({ sections, selectedId, onSelect, onReorder, onToggle, onDuplicate, onDelete, onAddClick }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Page sections ({sections.length})</h2>
        <Button size="sm" variant="primary" icon={Plus} onClick={onAddClick}>
          Add section
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sections.length === 0 ? (
          <div className="m-2 rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            This page has no sections yet.
            <Button size="sm" className="mt-3" icon={Plus} onClick={onAddClick}>
              Add first section
            </Button>
          </div>
        ) : (
          <SortableList
            items={sections}
            getId={(s) => s.id}
            onReorder={onReorder}
            className="space-y-1"
            renderItem={(s, { handle }) => {
              const meta = SECTION_META[s.type] || { label: s.type, icon: Plus };
              const selected = s.id === selectedId;
              return (
                <div className={cx('group flex items-center gap-1 rounded-lg border px-1 py-1 transition', selected ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-white hover:border-slate-200')}>
                  {handle}
                  <button type="button" onClick={() => onSelect(s.id)} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left" aria-current={selected || undefined}>
                    <meta.icon size={15} className={cx('shrink-0', selected ? 'text-blue-600' : 'text-slate-400')} />
                    <span className="min-w-0">
                      <span className={cx('block truncate text-sm font-medium', !s.visible && 'text-slate-400 line-through')}>{meta.label}</span>
                      {sectionSummary(s) && <span className="block truncate text-[11px] text-slate-400">{sectionSummary(s)}</span>}
                    </span>
                  </button>
                  <div className={cx('flex items-center', !selected && 'opacity-60 group-hover:opacity-100')}>
                    <IconButton icon={s.visible ? Eye : EyeOff} label={s.visible ? 'Hide this section from visitors' : 'Show this section to visitors'} onClick={() => onToggle(s.id)} className="!h-7 !w-7" />
                    <IconButton icon={Copy} label="Make a copy of this section" onClick={() => onDuplicate(s.id)} className="!h-7 !w-7" />
                    <IconButton icon={Trash2} label="Delete this section" variant="danger-ghost" onClick={() => onDelete(s.id)} className="!h-7 !w-7" />
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
      <p className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-400">Drag ⋮⋮ to move a section up or down. Click anything in the preview to change it.</p>
    </div>
  );
}
