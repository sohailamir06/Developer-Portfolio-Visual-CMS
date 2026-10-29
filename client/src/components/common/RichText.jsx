import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { useEditableProps } from '../../context/EditContext.jsx';
import { cx } from '../../utils/links.js';

/** Renders server-sanitised rich text. Sanitised again in the browser as defence in depth. */
export function RichText({ html, field, className }) {
  const props = useEditableProps(field, cx('rich-text', className));
  const clean = useMemo(
    () => DOMPurify.sanitize(html || '', { ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/|#)/i, ADD_ATTR: ['target'] }),
    [html],
  );
  if (!clean.trim()) return props['data-cms-field'] ? <div {...props}><p className="text-muted">Click to add text…</p></div> : null;
  return <div {...props} dangerouslySetInnerHTML={{ __html: clean }} />;
}
