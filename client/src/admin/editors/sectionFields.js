import { Award, BarChart3, Briefcase, FileText, GraduationCap, Image, LayoutTemplate, Mail, Megaphone, MessageSquareQuote, Sparkles, User, FolderKanban } from 'lucide-react';

/*
 * Property-panel definitions for each section type, written in plain language for
 * non-technical owners. Field keys match the server schemas in server/sections/index.js and the
 * <Editable field="…"> keys in the renderers, which is how clicking the preview opens a control.
 *
 * Field options: label, hint (always shown), help (shown in a "?" bubble),
 * advanced (tucked under "More options"), itemName (for lists: "Add <itemName>").
 */

const header = [
  { key: 'eyebrow', type: 'text', label: 'Small label above the heading', hint: 'Optional, e.g. “My work”.', advanced: true },
  { key: 'heading', type: 'text', label: 'Heading' },
  { key: 'subheading', type: 'textarea', label: 'Short description under the heading' },
];

const IMAGE_OPTS = ['alt', 'caption', 'fit', 'position', 'shape'];

export const SECTION_META = {
  hero: { label: 'Intro banner', icon: User, description: 'The first thing visitors see: your name, job title, photo and main buttons.' },
  about: { label: 'About me', icon: FileText, description: 'Your story, a photo, your strengths and a few key numbers.' },
  skills: { label: 'Skills', icon: Sparkles, description: 'Shows the skills you add under “Skills”, grouped by category.' },
  projects: { label: 'Projects', icon: FolderKanban, description: 'Cards for the projects you publish under “Projects”.' },
  experience: { label: 'Work history', icon: Briefcase, description: 'A timeline of the jobs you add under “Experience”.' },
  stats: { label: 'Highlights in numbers', icon: BarChart3, description: 'A row of big numbers, e.g. “5+ years experience”.' },
  cta: { label: 'Invitation banner', icon: Megaphone, description: 'A bold box inviting visitors to contact you or take a next step.' },
  contact: { label: 'Contact', icon: Mail, description: 'Your contact details, social links and a message form.' },
  textImage: { label: 'Text & picture', icon: LayoutTemplate, description: 'Any text you like, with an optional picture beside it.' },
  testimonials: { label: 'Testimonials', icon: MessageSquareQuote, description: 'Kind words from clients or colleagues.' },
  resume: { label: 'Résumé / CV', icon: Image, description: 'A summary with a button to download your CV (PDF).' },
  education: { label: 'Education', icon: GraduationCap, description: 'Your degrees and schools, with dates, grades and highlights. Recruiters look here first.' },
  certifications: { label: 'Certificates & awards', icon: Award, description: 'Online certificates, hackathon wins, scholarships and other achievements.' },
};

export const SECTION_FIELDS = {
  hero: [
    { key: 'name', type: 'text', label: 'Your name' },
    { key: 'title', type: 'text', label: 'Your job title', hint: 'e.g. Full-Stack Software Developer' },
    { key: 'intro', type: 'textarea', label: 'Short introduction', rows: 4, hint: 'One or two sentences about what you do.' },
    { key: 'image', type: 'image', label: 'Your photo', options: IMAGE_OPTS },
    { key: 'primaryButton', type: 'button', label: 'Main button', hint: 'The most important action, e.g. “View my projects”.' },
    { key: 'secondaryButton', type: 'button', label: 'Second button' },
    { key: 'githubUrl', type: 'url', label: 'GitHub profile link', placeholder: 'https://github.com/your-name', hint: 'Leave empty to hide the GitHub icon.' },
    { key: 'linkedinUrl', type: 'url', label: 'LinkedIn profile link', placeholder: 'https://linkedin.com/in/your-name', hint: 'Leave empty to hide the LinkedIn icon.' },
    { key: 'availability', type: 'group', label: '“Available for work” badge', fields: [
      { key: 'show', type: 'toggle', label: 'Show the badge' },
      { key: 'text', type: 'text', label: 'Badge text' },
    ] },
    { key: 'greeting', type: 'text', label: 'Small greeting above your name', hint: 'e.g. “Hi, I’m”', advanced: true },
    { key: 'layout', type: 'select', label: 'Layout', options: [['split', 'Text on the left, photo on the right'], ['centered', 'Everything centred']], advanced: true },
    { key: 'showResume', type: 'toggle', label: 'Show “Download CV” link', hint: 'Uses the CV you upload in Settings → Résumé.', advanced: true },
    { key: 'resumeLabel', type: 'text', label: 'Download CV link text', advanced: true },
  ],
  about: [
    ...header,
    { key: 'body', type: 'richtext', label: 'Your story' },
    { key: 'image', type: 'image', label: 'Photo', options: IMAGE_OPTS },
    { key: 'strengths', type: 'stringList', label: 'Key strengths', addLabel: 'Add a strength', hint: 'Short points shown with a tick, e.g. “Clean, tested code”.' },
    { key: 'yearsExperience', type: 'text', label: 'Years of experience', placeholder: 'e.g. 5+', hint: 'Leave empty to hide.' },
    { key: 'stats', type: 'list', label: 'Highlight numbers', itemName: 'number', itemLabel: 'value', newItem: { value: '', label: '' }, fields: [
      { key: 'value', type: 'text', label: 'Number', placeholder: 'e.g. 20+' },
      { key: 'label', type: 'text', label: 'What it means', placeholder: 'e.g. Projects delivered' },
    ] },
    { key: 'resumeButton', type: 'button', label: 'Button' },
  ],
  skills: [
    ...header,
    { key: '_manage', type: 'link', label: 'Add or change your skills', to: '/admin/skills' },
    { key: 'layout', type: 'select', label: 'How skills look', options: [['grid', 'Boxes by category'], ['list', 'Detailed list'], ['pills', 'Compact tags']] },
    { key: 'showProficiency', type: 'toggle', label: 'Show skill level', hint: 'Only shown for skills where you set a level.' },
    { key: 'categories', type: 'stringList', label: 'Only show these categories', hint: 'Leave empty to show every category.', addLabel: 'Add a category', advanced: true },
  ],
  projects: [
    ...header,
    { key: '_manage', type: 'link', label: 'Add or change your projects', to: '/admin/projects' },
    { key: 'mode', type: 'select', label: 'Which projects to show', options: [['all', 'All published projects'], ['featured', 'Only projects marked “Featured”']] },
    { key: 'limit', type: 'number', label: 'Maximum number of projects', min: 1, max: 60 },
    { key: 'viewAllButton', type: 'button', label: '“See all projects” button' },
    { key: 'showFilters', type: 'toggle', label: 'Let visitors filter by category', advanced: true },
    { key: 'columns', type: 'select', label: 'Cards per row (large screens)', options: [['2', '2 per row'], ['3', '3 per row']], advanced: true },
  ],
  experience: [
    ...header,
    { key: '_manage', type: 'link', label: 'Add or change your jobs', to: '/admin/experience' },
    { key: 'showTechnologies', type: 'toggle', label: 'Show technologies used' },
    { key: 'limit', type: 'number', label: 'Maximum number of jobs', hint: '0 shows all of them.', min: 0, max: 50, advanced: true },
  ],
  stats: [
    ...header,
    { key: 'items', type: 'list', label: 'Numbers', itemName: 'number', itemLabel: 'label', newItem: { value: '10+', label: 'New highlight', description: '' }, fields: [
      { key: 'value', type: 'text', label: 'Number', placeholder: 'e.g. 5+' },
      { key: 'label', type: 'text', label: 'What it means', placeholder: 'e.g. Years of experience' },
      { key: 'description', type: 'text', label: 'Extra detail (optional)' },
    ] },
  ],
  cta: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'body', type: 'textarea', label: 'Text', rows: 3 },
    { key: 'primaryButton', type: 'button', label: 'Main button' },
    { key: 'secondaryButton', type: 'button', label: 'Second button' },
    { key: 'eyebrow', type: 'text', label: 'Small label above the heading', advanced: true },
  ],
  contact: [
    { key: 'heading', type: 'text', label: 'Heading' },
    { key: 'body', type: 'textarea', label: 'Text', rows: 3 },
    { key: 'showForm', type: 'toggle', label: 'Show the message form', hint: 'Messages arrive in Admin → Messages.' },
    { key: 'showEmail', type: 'toggle', label: 'Show your email address', hint: 'Your email, phone and location are set in Settings → Contact & social.' },
    { key: 'showPhone', type: 'toggle', label: 'Show your phone number' },
    { key: 'showSocial', type: 'toggle', label: 'Show social media links' },
    { key: 'submitLabel', type: 'text', label: 'Send button text', advanced: true },
    { key: 'successMessage', type: 'textarea', label: 'Message shown after sending', rows: 2, advanced: true },
    { key: 'eyebrow', type: 'text', label: 'Small label above the heading', advanced: true },
  ],
  textImage: [
    ...header,
    { key: 'body', type: 'richtext', label: 'Text' },
    { key: 'image', type: 'image', label: 'Picture', options: IMAGE_OPTS },
    { key: 'imagePosition', type: 'select', label: 'Picture position', options: [['right', 'Right of the text'], ['left', 'Left of the text']] },
    { key: 'button', type: 'button', label: 'Button' },
  ],
  testimonials: [
    ...header,
    { key: 'items', type: 'list', label: 'Testimonials', itemName: 'testimonial', itemLabel: 'name', newItem: { quote: '', name: '', role: '', avatar: {} }, fields: [
      { key: 'quote', type: 'textarea', label: 'What they said', rows: 3 },
      { key: 'name', type: 'text', label: 'Their name' },
      { key: 'role', type: 'text', label: 'Their job or company' },
      { key: 'avatar', type: 'image', label: 'Their photo (optional)', options: ['alt'] },
    ] },
  ],
  resume: [
    ...header,
    { key: 'body', type: 'richtext', label: 'Summary' },
    { key: 'downloadButton', type: 'button', label: 'Download button', hint: 'Leave the link empty to use the CV uploaded in Settings → Résumé.' },
    { key: 'showEmbed', type: 'toggle', label: 'Show a preview of the PDF on the page' },
  ],
};

SECTION_FIELDS.education = [
  ...header,
  { key: 'items', type: 'list', label: 'Schools & degrees', itemName: 'school', itemLabel: 'institution', newItem: { institution: '', degree: '', period: '', location: '', grade: '', description: '', highlights: [], logo: {} }, fields: [
    { key: 'degree', type: 'text', label: 'Degree or programme', placeholder: 'e.g. B.Sc. Computer Science' },
    { key: 'institution', type: 'text', label: 'School or university', placeholder: 'e.g. University of Toronto' },
    { key: 'period', type: 'text', label: 'When', placeholder: 'e.g. 2022 – 2026 (expected)' },
    { key: 'grade', type: 'text', label: 'Grade (optional)', placeholder: 'e.g. GPA 3.7 / 4.0 or First Class' },
    { key: 'location', type: 'text', label: 'City / country (optional)' },
    { key: 'description', type: 'textarea', label: 'Short description (optional)', rows: 2 },
    { key: 'highlights', type: 'stringList', label: 'Highlights', addLabel: 'Add a highlight', hint: 'e.g. Relevant courses, thesis topic, Dean’s list, clubs.' },
    { key: 'logo', type: 'image', label: 'School logo (optional)', options: ['alt'] },
  ] },
];

SECTION_FIELDS.certifications = [
  ...header,
  { key: 'items', type: 'list', label: 'Certificates & awards', itemName: 'certificate or award', itemLabel: 'title', newItem: { kind: 'certificate', title: '', issuer: '', date: '', credentialUrl: '', description: '' }, fields: [
    { key: 'kind', type: 'select', label: 'Type', options: [['certificate', 'Certificate'], ['award', 'Award / prize'], ['achievement', 'Achievement']] },
    { key: 'title', type: 'text', label: 'Name', placeholder: 'e.g. AWS Cloud Practitioner' },
    { key: 'issuer', type: 'text', label: 'Given by', placeholder: 'e.g. Amazon Web Services' },
    { key: 'date', type: 'text', label: 'When', placeholder: 'e.g. March 2025' },
    { key: 'credentialUrl', type: 'url', label: 'Link to proof (optional)', placeholder: 'https://…', hint: 'e.g. the certificate verification page. Adds a “View credential” link.' },
    { key: 'description', type: 'textarea', label: 'Short description (optional)', rows: 2 },
  ] },
];

export const STYLE_FIELDS = [
  { key: 'background', type: 'select', label: 'Background', options: [['default', 'Same as the page'], ['surface', 'Slightly lighter box'], ['primary', 'Tinted with your main colour'], ['subtle', 'Soft fade']] },
  { key: 'paddingY', type: 'select', label: 'Space above and below', options: [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] },
  { key: 'align', type: 'select', label: 'Heading position', options: [['left', 'Left'], ['center', 'Centred']] },
  { key: 'width', type: 'select', label: 'Content width', options: [['narrow', 'Narrow'], ['normal', 'Normal'], ['wide', 'Wide']] },
  {
    key: 'anchorId',
    type: 'text',
    label: 'Jump-link name',
    advanced: true,
    placeholder: 'e.g. contact',
    help: 'Give this section a short name so a button or menu link can jump straight to it. If you type “contact” here, a link to “#contact” scrolls down to this section. Use lowercase letters, numbers and hyphens.',
  },
];

/** First non-empty text that identifies a section in the list. */
export function sectionSummary(section) {
  const d = section.data || {};
  return d.heading || d.name || d.title || d.eyebrow || '';
}

/** "Section 2 · Intro banner" — used in friendly error messages. */
export function sectionDisplayName(section, index) {
  return `${SECTION_META[section?.type]?.label || 'Section'} (section ${index + 1})`;
}

/** Finds the human label for a field path inside a section, e.g. ["primaryButton","url"] → "Main button › Link". */
export function fieldDisplayName(type, path) {
  const [key, ...rest] = path;
  const field = (SECTION_FIELDS[type] || []).find((f) => f.key === key) || STYLE_FIELDS.find((f) => f.key === key);
  const parts = [field?.label || key];
  const sub = rest.filter((p) => typeof p !== 'number' && !/^\d+$/.test(p));
  const SUB_LABELS = { url: 'Link', label: 'Button text', alt: 'Description (alt text)', text: 'Text', value: 'Number' };
  if (sub.length) parts.push(SUB_LABELS[sub[sub.length - 1]] || sub[sub.length - 1]);
  return parts.join(' › ');
}
