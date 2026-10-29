import { useState } from 'react';
import { FileText, ImageIcon, Library, Trash2, Upload } from 'lucide-react';
import { MediaPickerModal, useUploader } from './MediaLibrary.jsx';
import { Button, ErrorBox, Field, Input, Select } from './ui.jsx';

/**
 * Image editor for { url, alt, caption, fit, position, shape }.
 * `options` controls which display settings the component supports.
 */
export default function ImageField({ value = {}, onChange, options = ['alt', 'caption'], type = 'image' }) {
  const [picker, setPicker] = useState(false);
  const set = (patch) => onChange({ ...value, ...patch });
  const apply = (media) => set({ url: media.url, alt: value.alt || media.alt || '' });
  const uploader = useUploader({ accept: type, onUploaded: (created) => apply(created[0]) });
  const isPdf = type === 'document' || /\.pdf($|\?)/i.test(value.url || '');

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      {uploader.input}
      <div className="flex gap-3">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
          {value.url ? (
            isPdf ? <FileText size={28} className="text-slate-400" /> : <img src={value.url} alt={value.alt || ''} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={28} className="text-slate-300" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" icon={Library} onClick={() => setPicker(true)}>
              {value.url ? 'Replace' : 'Choose'}
            </Button>
            <Button size="sm" icon={Upload} onClick={uploader.open} loading={uploader.progress !== null}>
              {uploader.progress !== null ? `${uploader.progress}%` : 'Upload'}
            </Button>
            {value.url && <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={() => set({ url: '' })} aria-label="Remove image" />}
          </div>
          <Input value={value.url || ''} onChange={(e) => set({ url: e.target.value.trim() })} placeholder="or paste an image URL" className="!py-1.5 text-xs" aria-label="Image URL" />
        </div>
      </div>
      <ErrorBox error={uploader.error} />
      {options.includes('alt') && (
        <Field label="Alternative text" hint="Required for accessibility unless the image is purely decorative.">
          <Input value={value.alt || ''} onChange={(e) => set({ alt: e.target.value })} maxLength={300} />
        </Field>
      )}
      {options.includes('caption') && (
        <Field label="Caption (optional)">
          <Input value={value.caption || ''} onChange={(e) => set({ caption: e.target.value })} maxLength={300} />
        </Field>
      )}
      {(options.includes('fit') || options.includes('position') || options.includes('shape')) && (
        <div className="grid grid-cols-3 gap-2">
          {options.includes('fit') && (
            <Field label="Fit">
              <Select value={value.fit || 'cover'} onChange={(e) => set({ fit: e.target.value })} options={[['cover', 'Fill'], ['contain', 'Fit inside']]} />
            </Field>
          )}
          {options.includes('position') && (
            <Field label="Focus">
              <Select value={value.position || 'center'} onChange={(e) => set({ position: e.target.value })} options={['center', 'top', 'bottom', 'left', 'right']} />
            </Field>
          )}
          {options.includes('shape') && (
            <Field label="Shape">
              <Select value={value.shape || 'rounded'} onChange={(e) => set({ shape: e.target.value })} options={['rounded', 'circle', 'square']} />
            </Field>
          )}
        </div>
      )}
      <MediaPickerModal open={picker} onClose={() => setPicker(false)} onSelect={apply} type={type} />
    </div>
  );
}
