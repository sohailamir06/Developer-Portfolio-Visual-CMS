import { Editable } from '../../context/EditContext.jsx';
import { cx } from '../../utils/links.js';

const BG = {
  default: '',
  surface: 'bg-surface/60',
  primary: 'bg-primary/[0.07]',
  subtle: 'bg-gradient-to-b from-transparent via-surface/70 to-transparent',
};
const PAD = { sm: 'py-12 sm:py-16', md: 'py-16 sm:py-24', lg: 'py-24 sm:py-32' };
const WIDTH = { narrow: 'max-w-3xl', normal: 'max-w-content', wide: 'max-w-7xl' };

/** Applies the section's style options (background, spacing, width, alignment, anchor). */
export function SectionFrame({ section, className, children, as: Tag = 'section', label }) {
  const style = section.style || {};
  return (
    <Tag
      id={style.anchorId || undefined}
      aria-label={label}
      className={cx('relative scroll-mt-20', BG[style.background], PAD[style.paddingY] || PAD.md, style.align === 'center' && 'text-center', className)}
    >
      <div className={cx('mx-auto w-full px-5 sm:px-8', WIDTH[style.width] || WIDTH.normal)}>{children}</div>
    </Tag>
  );
}

export function SectionHeader({ data, center, className, as = 'h2' }) {
  if (!data.eyebrow && !data.heading && !data.subheading) return null;
  return (
    <div className={cx('mb-10 sm:mb-14', center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl', className)}>
      {data.eyebrow && (
        <Editable field="eyebrow" as="p" className="eyebrow">
          <span className="h-px w-6 bg-primary" aria-hidden="true" />
          {data.eyebrow}
        </Editable>
      )}
      {data.heading && (
        <Editable field="heading" as={as} className="section-heading">
          {data.heading}
        </Editable>
      )}
      {data.subheading && (
        <Editable field="subheading" as="p" className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
          {data.subheading}
        </Editable>
      )}
    </div>
  );
}

export const isCentered = (section) => section.style?.align === 'center';
