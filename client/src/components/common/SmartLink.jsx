import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { isExternal, isSafeUrl } from '../../utils/links.js';

/** Internal paths use client-side routing; external URLs get safe rel attributes. Unsafe URLs render as text. */
export const SmartLink = forwardRef(function SmartLink({ to, newTab, children, ...rest }, ref) {
  if (!to || !isSafeUrl(to)) return <span {...rest}>{children}</span>;
  const target = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  if (isExternal(to) || to.startsWith('#') || to.startsWith('/uploads/')) {
    return (
      <a ref={ref} href={to} {...target} {...(isExternal(to) && !newTab ? { rel: 'noopener' } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link ref={ref} to={to} {...target} {...rest}>
      {children}
    </Link>
  );
});
