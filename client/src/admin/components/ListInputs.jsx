import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { Button, IconButton, Input } from './ui.jsx';

/** Chips input for short tags (technologies, categories). */
export function TagInput({ value = [], onChange, placeholder = 'Type and press Enter', max = 40 }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft.split(',').map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) if (!next.some((v) => v.toLowerCase() === p.toLowerCase()) && next.length < max) next.push(p.slice(0, 60));
    onChange(next);
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-white p-1.5 ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-blue-600">
      {value.map((tag, i) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-slate-100 py-0.5 pl-2 pr-1 text-xs font-medium text-slate-700">
          {tag}
          <button type="button" aria-label={`Remove ${tag}`} className="rounded p-0.5 hover:bg-slate-200" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft && add()}
        placeholder={value.length ? '' : placeholder}
        className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm focus:outline-none focus:ring-0"
      />
    </div>
  );
}

/** Ordered list of single-line strings (strengths, responsibilities). */
export function StringList({ value = [], onChange, placeholder = 'New item', addLabel = 'Add item', max = 30 }) {
  const update = (i, v) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input value={item} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} />
          <IconButton icon={ArrowUp} label="Move up" disabled={i === 0} onClick={() => move(i, -1)} />
          <IconButton icon={ArrowDown} label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)} />
          <IconButton icon={Trash2} label="Remove" variant="danger-ghost" onClick={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      {value.length < max && (
        <Button size="sm" variant="ghost" icon={Plus} onClick={() => onChange([...value, ''])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}
