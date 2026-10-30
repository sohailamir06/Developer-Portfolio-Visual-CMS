import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Plain-language validation messages for the (non-technical) site owner. Explicit messages in schemas still win.
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined' || issue.received === 'null') return { message: 'This is required' };
      return { message: 'This value isn’t valid here' };
    case 'too_small':
      if (issue.type === 'string') return { message: issue.minimum <= 1 ? 'This can’t be empty' : `Please use at least ${issue.minimum} characters` };
      if (issue.type === 'array') return { message: `Please add at least ${issue.minimum}` };
      return { message: `Please use a number of at least ${issue.minimum}` };
    case 'too_big':
      if (issue.type === 'string') return { message: `Please keep this under ${issue.maximum} characters` };
      if (issue.type === 'array') return { message: `You can add up to ${issue.maximum} items` };
      return { message: `Please use a number no higher than ${issue.maximum}` };
    case 'invalid_enum_value':
      return { message: 'Please choose one of the available options' };
    case 'invalid_string':
      if (issue.validation === 'email') return { message: 'Please enter a valid email address' };
      if (issue.validation === 'url') return { message: 'Please enter a full web address, starting with https://' };
      return { message: 'This format isn’t valid' };
    case 'invalid_date':
      return { message: 'Please enter a valid date' };
    default:
      return { message: ctx.defaultError };
  }
});

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/** Accepts '', site-relative paths, #anchors, and http(s)/mailto/tel URLs. Rejects javascript:, data:, etc. */
export function isSafeUrl(value) {
  if (value === '' || value == null) return true;
  const v = String(value).trim();
  if (/[\s<>"]/.test(v)) return false;
  if (v.startsWith('#')) return true;
  if (v.startsWith('/') && !v.startsWith('//')) return true;
  try {
    return SAFE_PROTOCOLS.includes(new URL(v).protocol);
  } catch {
    return false;
  }
}

export const isExternalUrl = (v) => /^(https?:|mailto:|tel:)/i.test(String(v || ''));

export const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(isSafeUrl, { message: 'This link won’t work. Choose one of your pages or use a full web address starting with https://' });

/** Absolute http(s) URL or site-relative path — used for image sources. */
export const mediaUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === '' || /^https?:\/\//i.test(v) || (v.startsWith('/') && !v.startsWith('//')), {
    message: 'This picture link won’t work. Upload the picture or paste a full address starting with https://',
  });

export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use only lowercase letters, numbers and hyphens (e.g. my-page)');

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

const RICH_TEXT_OPTIONS = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'hr'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const out = { ...attribs };
      if (out.target === '_blank') out.rel = 'noopener noreferrer';
      else delete out.target;
      return { tagName, attribs: out };
    },
  },
};

export const sanitizeRichText = (html) => sanitizeHtml(String(html || ''), RICH_TEXT_OPTIONS);

export const richText = z.string().max(50000).transform(sanitizeRichText);

export const plainText = (max = 500) => z.string().trim().max(max);

export const toSlug = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

export const seoSchema = z
  .object({
    title: plainText(120).default(''),
    description: plainText(320).default(''),
    image: mediaUrl.default(''),
    canonical: safeUrl.default(''),
    noindex: z.boolean().default(false),
  })
  .default({});

/** Express middleware factory: validates req[part] and replaces it with the parsed value. */
export const validate =
  (schema, part = 'body') =>
  (req, _res, next) => {
    const parsed = schema.parse(req[part] ?? {});
    if (part === 'query') Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
    else req[part] = parsed;
    next();
  };
