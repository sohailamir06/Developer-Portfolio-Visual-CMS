import { fieldDisplayName, sectionDisplayName } from './editors/sectionFields.js';

/* Turns technical validation paths (e.g. "sections.0.data.primaryButton.url") into readable names. */

const WORDS = {
  title: 'Title',
  slug: 'Web address',
  summary: 'Short description',
  content: 'Full description',
  description: 'Description',
  seo: 'Search & sharing',
  canonical: 'Original address',
  image: 'Picture',
  featuredImage: 'Main picture',
  gallery: 'Gallery',
  alt: 'Picture description',
  url: 'Link',
  demoUrl: 'Live demo link',
  repoUrl: 'Source code link',
  companyUrl: 'Company website',
  startDate: 'Start date',
  endDate: 'End date',
  email: 'Email',
  phone: 'Phone',
  social: 'Social links',
  theme: 'Theme',
  primary: 'Main colour',
  secondary: 'Second colour',
  accent: 'Accent colour',
  background: 'Background colour',
  logo: 'Logo',
  favicon: 'Browser tab icon',
  contactButton: 'Contact button',
  footer: 'Footer',
  header: 'Header',
  titleTemplate: 'Title pattern',
  label: 'Text',
  from: 'Old address',
  to: 'New address',
  password: 'Password',
  name: 'Name',
  category: 'Category',
  main: 'Header menu',
  parentId: 'Dropdown',
};

const word = (k) => WORDS[k] || String(k).replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

/** Human label for a validation path. `sections` (optional) names page sections. */
export function humanizePath(path = '', sections) {
  const parts = String(path).split('.').filter(Boolean);
  if (parts[0] === 'sections' && /^\d+$/.test(parts[1] || '')) {
    const index = Number(parts[1]);
    const section = sections?.[index];
    const rest = parts.slice(3); // skip "data" / "style"
    const where = sectionDisplayName(section, index);
    return rest.length ? `${where} › ${fieldDisplayName(section?.type, rest)}` : where;
  }
  const out = [];
  parts.forEach((p) => {
    if (/^\d+$/.test(p)) out.push(`item ${Number(p) + 1}`);
    else out.push(word(p));
  });
  return out.join(' › ');
}

/** Message shown at the top of a failed save. */
export function friendlyMessage(error) {
  if (!error) return '';
  if (error.message === 'Validation failed') return 'Some details need fixing before this can be saved:';
  if (error.status === 0) return 'Can’t reach the server. Check your internet connection and try again.';
  // Only an expired/missing session — a wrong password on the login form keeps its own message.
  if (error.status === 401 && /Authentication required|session has expired/i.test(error.message || '')) {
    return 'You have been signed out. Please sign in again — your unsaved changes are still on this screen.';
  }
  return error.message;
}
