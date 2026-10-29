import { useState } from 'react';
import { ImageOff, User } from 'lucide-react';
import { useEditableProps } from '../../context/EditContext.jsx';
import { cx, optimizedImage } from '../../utils/links.js';

const POSITIONS = { center: 'object-center', top: 'object-top', bottom: 'object-bottom', left: 'object-left', right: 'object-right' };
const SHAPES = { rounded: 'rounded-theme-lg', circle: 'rounded-full', square: 'rounded-none' };

/** Renders a CMS image object { url, alt, caption, fit, position, shape } with lazy loading and a graceful fallback. */
export function CmsImage({ image, field, className, imgClassName, width = 800, eager = false, placeholder = 'image', aspect }) {
  const [failed, setFailed] = useState(false);
  const editProps = useEditableProps(field, cx('relative overflow-hidden', SHAPES[image?.shape] || SHAPES.rounded, className));
  const editing = Boolean(editProps['data-cms-field']);
  const url = image?.url;

  if (!url || failed) {
    if (!editing && placeholder === 'none') return null;
    return (
      <div {...editProps} className={cx(editProps.className, 'flex items-center justify-center border border-line bg-surface text-muted')} style={aspect ? { aspectRatio: aspect } : undefined}>
        {placeholder === 'avatar' ? <User size={48} aria-hidden="true" /> : <ImageOff size={32} aria-hidden="true" />}
        {editing && <span className="sr-only">Click to choose an image</span>}
      </div>
    );
  }

  return (
    <figure {...editProps}>
      <img
        src={optimizedImage(url, width)}
        alt={image.alt || ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className={cx('h-full w-full', image.fit === 'contain' ? 'object-contain' : 'object-cover', POSITIONS[image.position], imgClassName)}
        style={aspect ? { aspectRatio: aspect } : undefined}
      />
      {image.caption && <figcaption className="mt-2 text-center text-xs text-muted">{image.caption}</figcaption>}
    </figure>
  );
}
