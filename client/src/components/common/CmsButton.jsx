import { ArrowRight, ExternalLink } from 'lucide-react';
import { SmartLink } from './SmartLink.jsx';
import { useEditableProps } from '../../context/EditContext.jsx';
import { cx, isExternal } from '../../utils/links.js';

const STYLES = { primary: 'btn-primary', secondary: 'btn-secondary', outline: 'btn-outline', ghost: 'btn-ghost' };

/**
 * Renders a CMS button object { label, url, newTab, style, visible }.
 * Hidden or incomplete buttons render nothing (except in the editor, where they show as placeholders).
 */
export function CmsButton({ button, field, className, icon = true, fallbackUrl }) {
  const editProps = useEditableProps(field, cx('btn', STYLES[button?.style] || STYLES.primary, className));
  const url = button?.url || fallbackUrl;
  const editing = Boolean(editProps['data-cms-field']);

  if (!button || button.visible === false || !button.label || !url) {
    if (!editing || !button || button.visible === false) return null;
    return (
      <span {...editProps} className={cx(editProps.className, 'opacity-50 border border-dashed border-line')}>
        {button.label || 'Button'} (no link)
      </span>
    );
  }

  const external = isExternal(url) && !url.startsWith('mailto:') && !url.startsWith('tel:');
  return (
    <SmartLink to={url} newTab={button.newTab} {...editProps}>
      {button.label}
      {icon && (external || button.newTab ? <ExternalLink size={15} aria-hidden="true" /> : button.style === 'primary' && <ArrowRight size={16} aria-hidden="true" />)}
    </SmartLink>
  );
}
