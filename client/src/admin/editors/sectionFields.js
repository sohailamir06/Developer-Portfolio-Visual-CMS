import { BarChart3, Briefcase, FileText, Image, LayoutTemplate, Mail, Megaphone, MessageSquareQuote, Sparkles, User, FolderKanban } from 'lucide-react';

/*
 * Property-panel definitions for each section type. Field keys match the server schemas in
 * server/sections/index.js, and the same keys are used by <Editable field="…"> in the renderers,
 * which is how clicking an element in the preview opens the matching control here.
 */

const header = [
  { key: 'eyebrow', type: 'text', label: 'Eyebrow (small label above heading)' },
  { key: 'heading', type: 'text', label: 'Heading' },
  { key: 'subheading', type: 'textarea', label: 'Subheading' },
];

const IMAGE_OPTS = ['alt', 'caption', 'fit', 'position', 'shape'];

export const SECTION_META = {
  hero: { label: 'Hero', icon: User, description: 'Name, title, intro, photo and call-to-action buttons.' },
  about: { label: 'About', icon: FileText, description: 'Biography with photo, strengths and statistics.' },
  skills: { label: 'Skills', icon: Sparkles, description: 'Your skills, grouped by category (managed under Skills).' },
  projects: { label: 'Project Grid', icon: FolderKanban, description: 'Cards for your published projects.' },
  experience: { label: 'Experience Timeline', icon: Briefcase, description: 'Work history timeline (managed under Experience).' },
  stats: { label: 'Statistics', icon: BarChart3, description: 'A row of highlight numbers.' },
  cta: { label: 'Call to Action', icon: Megaphone, description: 'A bold banner with buttons.' },
  contact: { label: 'Contact', icon: Mail, description: 'Contact details, social links and the contact form.' },
  textImage: { label: 'Text & Image', icon: LayoutTemplate, description: 'Free-form rich text next to an image.' },
  testimonials: { label: 'Testimonials', icon: MessageSquareQuote, description: 'Quotes from clients or colleagues.' },
  resume: { label: 'Résumé', icon: Image, description: 'Résumé summary with download button and PDF preview.' },
};

export const SECTION_FIELDS = {
  hero: [
    { key: 'layout', type: 'select', label: 'Layout', options: [['split', 'Text + photo side by side'], ['centered', 'Centered']] },
    { key: 'availability', type: 'group', label: 'Availability badge', fields: [
      { key: 'show', type: 'toggle', label: 'Show availability badge' },
      { key: 'text', type: 'text', label: 'Badge text' },
    ] },
    { key: 'greeting', type: 'text', label: 'Greeting' },
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'title', type: 'text', label: 'Professional title' },
    { key: 'intro', type: 'textarea', label: 'Short introduction', rows: 4 },
    { key: 'image', type: 'image', label: 'Profile image', options: IMAGE_OPTS },
    { key: 'primaryButton', type: 'button', label: 'Primary button' },
    { key: 'secondaryButton', type: 'button', label: 'Secondary button' },
    { key: 'githubUrl', type: 'url', label: 'GitHub URL', placeholder: 'https://github.com/username' },
    { key: 'linkedinUrl', type: 'url', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username' },
    { key: 'showResume', type: 'toggle', label: 'Show résumé download', hint: 'Uses the résumé link from Settings → Résumé.' },
    { key: 'resumeLabel', type: 'text', label: 'Résumé link text' },
  ],
  about: [
    ...header,
    { key: 'body', type: 'richtext', label: 'Biography' },
    { key: 'image', type: 'image', label: 'Photo', options: IMAGE_OPTS },
    { key: 'yearsExperience', type: 'text', label: 'Years of experience (optional)', placeholder: 'e.g. 5+' },
    { key: 'strengths', type: 'stringList', label: 'Key strengths', addLabel: 'Add strength' },
    { key: 'stats', type: 'list', label: 'Statistics', itemLabel: 'value', newItem: { value: '', label: '' }, fields: [
      { key: 'value', type: 'text', label: 'Value' },
      { key: 'label', type: 'text', label: 'Label' },
    ] },
    { key: 'resumeButton', type: 'button', label: 'Button' },
  ],
  skills: [
    ...header,
    { key: 'layout', type: 'select', label: 'Layout', options: [['grid', 'Category cards'], ['list', 'Detailed list'], ['pills', 'Compact pills']] },
    { key: 'showProficiency', type: 'toggle', label: 'Show proficiency' },
    { key: 'categories', type: 'stringList', label: 'Only show these categories', hint: 'Leave empty to show all categories.', addLabel: 'Add category' },
    { key: '_manage', type: 'link', label: 'Manage skills', to: '/admin/skills' },
  ],
  projects: [
    ...header,
    { key: 'mode', type: 'select', label: 'Which projects', options: [['all', 'All published projects'], ['featured', 'Featured projects only']] },
    { key: 'limit', type: 'number', label: 'Maximum number shown', min: 1, max: 60 },
    { key: 'columns', type: 'select', label: 'Columns on desktop', options: [['2', '2 columns'], ['3', '3 columns']] },
    { key: 'showFilters', type: 'toggle', label: 'Show category filters' },
    { key: 'viewAllButton', type: 'button', label: '“View all” button' },
    { key: '_manage', type: 'link', label: 'Manage projects', to: '/admin/projects' },
  ],
  experience: [
    ...header,
    { key: 'showTechnologies', type: 'toggle', label: 'Show technologies' },
    { key: 'limit', type: 'number', label: 'Maximum entries (0 = all)', min: 0, max: 50 },
    { key: '_manage', type: 'link', label: 'Manage experience', to: '/admin/experience' },
  ],
  stats: [
    ...header,
    { key: 'items', type: 'list', label: 'Statistics', itemLabel: 'label', newItem: { value: '10+', label: 'New statistic', description: '' }, fields: [
      { key: 'value', type: 'text', label: 'Value' },
      { key: 'label', type: 'text', label: 'Label' },
      { key: 'description', type: 'text', label: 'Description' },
    ] },
  ],
  cta: [
    { key: 'eyebrow', type: 'text', label: 'Eyebrow' },
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'body', type: 'textarea', label: 'Text', rows: 3 },
    { key: 'primaryButton', type: 'button', label: 'Primary button' },
    { key: 'secondaryButton', type: 'button', label: 'Secondary button' },
  ],
  contact: [
    { key: 'eyebrow', type: 'text', label: 'Eyebrow' },
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'body', type: 'textarea', label: 'Description', rows: 3 },
    { key: 'showEmail', type: 'toggle', label: 'Show email', hint: 'Email, phone and location are set in Settings → Contact.' },
    { key: 'showPhone', type: 'toggle', label: 'Show phone' },
    { key: 'showSocial', type: 'toggle', label: 'Show social links' },
    { key: 'showForm', type: 'toggle', label: 'Show contact form' },
    { key: 'submitLabel', type: 'text', label: 'Submit button text' },
    { key: 'successMessage', type: 'textarea', label: 'Success message', rows: 2 },
  ],
  textImage: [
    ...header,
    { key: 'body', type: 'richtext', label: 'Text' },
    { key: 'image', type: 'image', label: 'Image', options: IMAGE_OPTS },
    { key: 'imagePosition', type: 'select', label: 'Image position', options: [['right', 'Right of text'], ['left', 'Left of text']] },
    { key: 'button', type: 'button', label: 'Button' },
  ],
  testimonials: [
    ...header,
    { key: 'items', type: 'list', label: 'Testimonials', itemLabel: 'name', newItem: { quote: '', name: '', role: '', avatar: {} }, fields: [
      { key: 'quote', type: 'textarea', label: 'Quote', rows: 3 },
      { key: 'name', type: 'text', label: 'Name' },
      { key: 'role', type: 'text', label: 'Role / company' },
      { key: 'avatar', type: 'image', label: 'Photo', options: ['alt'] },
    ] },
  ],
  resume: [
    ...header,
    { key: 'body', type: 'richtext', label: 'Summary' },
    { key: 'downloadButton', type: 'button', label: 'Download button', hint: 'Leave the URL empty to use the résumé link from Settings.' },
    { key: 'showEmbed', type: 'toggle', label: 'Show PDF preview on the page' },
  ],
};

export const STYLE_FIELDS = [
  { key: 'background', type: 'select', label: 'Background', options: [['default', 'Page background'], ['surface', 'Card surface'], ['primary', 'Tinted (primary colour)'], ['subtle', 'Soft fade']] },
  { key: 'paddingY', type: 'select', label: 'Vertical spacing', options: [['sm', 'Compact'], ['md', 'Comfortable'], ['lg', 'Spacious']] },
  { key: 'align', type: 'select', label: 'Heading alignment', options: [['left', 'Left'], ['center', 'Center']] },
  { key: 'width', type: 'select', label: 'Content width', options: [['narrow', 'Narrow'], ['normal', 'Normal'], ['wide', 'Wide']] },
  { key: 'anchorId', type: 'text', label: 'Anchor ID', hint: 'Lets you link to this section with #anchor-id. Lowercase letters, numbers and hyphens.' },
];

/** First non-empty text that identifies a section in the list. */
export function sectionSummary(section) {
  const d = section.data || {};
  return d.heading || d.name || d.title || d.eyebrow || '';
}
