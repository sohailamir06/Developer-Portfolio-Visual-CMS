import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Plus, Trash2 } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor.jsx';
import ImageField from '../components/ImageField.jsx';
import { ButtonField, LinkInput } from '../components/LinkFields.jsx';
import { StringList } from '../components/ListInputs.jsx';
import { Button, Field, IconButton, Input, Select, Textarea, Toggle } from '../components/ui.jsx';
import { cx } from '../../utils/links.js';

function ListField({ field, value = [], onChange }) {
  const [open, setOpen] = useState(0);
  const update = (i, patch) => onChange(value.map((item, j) => (j === i ? { ...item, ...patch } : item)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
    setOpen(i + d);
  };
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-1 px-2 py-1.5">
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} className="flex flex-1 items-center gap-2 truncate text-left text-sm font-medium text-slate-700" aria-expanded={open === i}>
              <ChevronDown size={14} className={cx('shrink-0 transition', open !== i && '-rotate-90')} />
              <span className="truncate">{item[field.itemLabel] || `Item ${i + 1}`}</span>
            </button>
            <IconButton icon={ArrowUp} label="Move up" disabled={i === 0} onClick={() => move(i, -1)} />
            <IconButton icon={ArrowDown} label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)} />
            <IconButton icon={Trash2} label="Remove item" variant="danger-ghost" onClick={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
          {open === i && (
            <div className="space-y-3 border-t border-slate-100 p-3">
              {field.fields.map((f) => (
                <FieldRenderer key={f.key} field={f} value={item[f.key]} onChange={(v) => update(i, { [f.key]: v })} />
              ))}
            </div>
          )}
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        icon={Plus}
        onClick={() => {
          onChange([...value, { ...field.newItem }]);
          setOpen(value.length);
        }}
      >
        Add {field.label.toLowerCase().replace(/s$/, '')}
      </Button>
    </div>
  );
}

/** Renders one property-panel control from a field definition (see sectionFields.js). */
export default function FieldRenderer({ field, value, onChange, highlighted }) {
  const id = `field-${field.key}`;
  let control;
  switch (field.type) {
    case 'text':
      control = <Input id={`${id}-input`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
      break;
    case 'textarea':
      control = <Textarea id={`${id}-input`} rows={field.rows || 3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'richtext':
      control = <RichTextEditor value={value} onChange={onChange} />;
      break;
    case 'number':
      control = (
        <Input
          id={`${id}-input`}
          type="number"
          min={field.min}
          max={field.max}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? field.min ?? 0 : Math.max(field.min ?? -Infinity, Math.min(field.max ?? Infinity, Number(e.target.value))))}
        />
      );
      break;
    case 'select':
      control = <Select id={`${id}-input`} value={value ?? field.options[0][0]} onChange={(e) => onChange(e.target.value)} options={field.options} />;
      break;
    case 'toggle':
      return (
        <div id={id} className={cx('rounded-lg p-1 transition', highlighted && 'bg-blue-50 ring-2 ring-blue-400')}>
          <Toggle label={field.label} description={field.hint} checked={Boolean(value)} onChange={onChange} />
        </div>
      );
    case 'url':
      control = <LinkInput id={`${id}-input`} value={value} onChange={onChange} placeholder={field.placeholder} />;
      break;
    case 'image':
      control = <ImageField value={value || {}} onChange={onChange} options={field.options} />;
      break;
    case 'button':
      control = <ButtonField value={value || {}} onChange={onChange} />;
      break;
    case 'stringList':
      control = <StringList value={value || []} onChange={onChange} addLabel={field.addLabel} />;
      break;
    case 'list':
      control = <ListField field={field} value={value || []} onChange={onChange} />;
      break;
    case 'group':
      control = (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          {field.fields.map((f) => (
            <FieldRenderer key={f.key} field={f} value={value?.[f.key]} onChange={(v) => onChange({ ...(value || {}), [f.key]: v })} />
          ))}
        </div>
      );
      break;
    case 'link':
      return (
        <Link to={field.to} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
          {field.label} <ExternalLink size={13} />
        </Link>
      );
    default:
      return null;
  }
  return (
    <div id={id} className={cx('-m-1.5 rounded-lg p-1.5 transition', highlighted && 'bg-blue-50 ring-2 ring-blue-400')}>
      <Field label={field.label} hint={field.type === 'toggle' ? undefined : field.hint} htmlFor={`${id}-input`}>
        {control}
      </Field>
    </div>
  );
}
