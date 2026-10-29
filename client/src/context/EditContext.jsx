import { createContext, useContext } from 'react';
import { cx } from '../utils/links.js';

/*
 * Connects explicitly supported components to content fields for the visual editor.
 * Outside the editor preview the context is null and <Editable> renders a plain element.
 */
export const EditContext = createContext(null);
export const SectionContext = createContext(null);

export const useEditing = () => useContext(EditContext);

export function useEditableProps(field, className) {
  const edit = useContext(EditContext);
  const sectionId = useContext(SectionContext);
  if (!edit || !sectionId) return { className };
  const selected = edit.selected?.sectionId === sectionId && edit.selected?.field === field;
  return {
    className: cx(className, 'cms-editable', selected && 'cms-selected'),
    'data-cms-field': field,
    onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      edit.select(sectionId, field);
    },
  };
}

export function Editable({ field, as: Tag = 'div', className, children, ...rest }) {
  const props = useEditableProps(field, className);
  return (
    <Tag {...rest} {...props}>
      {children}
    </Tag>
  );
}
