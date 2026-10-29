import { SectionContext, useEditing } from '../../context/EditContext.jsx';
import { SectionBoundary } from '../common/Status.jsx';
import { cx } from '../../utils/links.js';
import Hero from './Hero.jsx';
import About from './About.jsx';
import Skills from './Skills.jsx';
import ProjectGrid from './ProjectGrid.jsx';
import ExperienceTimeline from './ExperienceTimeline.jsx';
import Stats from './Stats.jsx';
import CallToAction from './CallToAction.jsx';
import Contact from './Contact.jsx';
import TextImage from './TextImage.jsx';
import Testimonials from './Testimonials.jsx';
import Resume from './Resume.jsx';

/** One renderer per section type defined in server/sections/index.js. */
export const SECTION_COMPONENTS = {
  hero: Hero,
  about: About,
  skills: Skills,
  projects: ProjectGrid,
  experience: ExperienceTimeline,
  stats: Stats,
  cta: CallToAction,
  contact: Contact,
  textImage: TextImage,
  testimonials: Testimonials,
  resume: Resume,
};

export const SECTION_LABELS = {
  hero: 'Hero',
  about: 'About',
  skills: 'Skills',
  projects: 'Project Grid',
  experience: 'Experience Timeline',
  stats: 'Statistics',
  cta: 'Call to Action',
  contact: 'Contact',
  textImage: 'Text & Image',
  testimonials: 'Testimonials',
  resume: 'Résumé',
};

function EditableSection({ section, children, edit }) {
  const selected = edit.selected?.sectionId === section.id;
  return (
    <div
      className={cx('cms-section', selected && 'cms-section-selected', !section.visible && 'cms-section-hidden')}
      data-cms-section={section.id}
      onClick={(e) => {
        e.preventDefault();
        edit.select(section.id, null);
      }}
    >
      <span className="cms-label">
        {SECTION_LABELS[section.type] || section.type}
        {!section.visible && ' · hidden'}
      </span>
      {children}
    </div>
  );
}

/** Renders a list of sections. Unknown types are skipped and each section fails independently. */
export function PageRenderer({ sections = [] }) {
  const edit = useEditing();
  return sections.map((section, index) => {
    const Component = SECTION_COMPONENTS[section?.type];
    if (!Component || !section.data) return null;
    if (!edit && section.visible === false) return null;
    const s = edit ? { ...section, _editing: true } : section;
    const content = (
      <SectionContext.Provider value={section.id}>
        <SectionBoundary name={section.type} showError={Boolean(edit)}>
          <Component section={s} index={index} />
        </SectionBoundary>
      </SectionContext.Provider>
    );
    return edit ? (
      <EditableSection key={section.id} section={section} edit={edit}>
        {content}
      </EditableSection>
    ) : (
      <div key={section.id || index}>{content}</div>
    );
  });
}
