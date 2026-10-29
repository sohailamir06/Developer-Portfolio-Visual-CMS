import { useEffect } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Strikethrough, Underline, Undo2, Unlink } from 'lucide-react';
import { isSafeUrl } from '../../utils/links.js';
import { cx } from '../../utils/links.js';

function ToolbarButton({ onClick, active, label, icon: Icon, disabled }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cx('grid h-7 w-7 place-items-center rounded transition disabled:opacity-30', active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100')}
    >
      <Icon size={15} />
    </button>
  );
}

/** Rich-text field limited to the formatting the server sanitiser allows. Emits HTML. */
export default function RichTextEditor({ value, onChange, placeholder = 'Write something…', minHeight = 140 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        link: { openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto', 'tel'], HTMLAttributes: { rel: 'noopener noreferrer' } },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none px-3 py-2 focus:outline-none prose-p:my-2 prose-headings:mb-2 prose-headings:mt-3',
        style: `min-height:${minHeight}px`,
        'aria-label': placeholder,
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  // Keep in sync when the value changes from outside (e.g. switching sections, restoring a revision).
  useEffect(() => {
    if (editor && !editor.isFocused && (value || '') !== (editor.isEmpty ? '' : editor.getHTML())) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            strike: e.isActive('strike'),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            link: e.isActive('link'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : {},
  });

  if (!editor) return null;
  const chain = () => editor.chain().focus();

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL (https://…, /page, mailto:…)', prev);
    if (url === null) return;
    if (url === '') return chain().extendMarkRange('link').unsetLink().run();
    if (!isSafeUrl(url)) return window.alert('That link is not allowed. Use https://, a /path, mailto: or tel:.');
    const external = /^https?:/i.test(url);
    chain().extendMarkRange('link').setLink({ href: url, target: external ? '_blank' : null }).run();
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-blue-600">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-1.5 py-1">
        <ToolbarButton icon={Bold} label="Bold" active={s.bold} onClick={() => chain().toggleBold().run()} />
        <ToolbarButton icon={Italic} label="Italic" active={s.italic} onClick={() => chain().toggleItalic().run()} />
        <ToolbarButton icon={Underline} label="Underline" active={s.underline} onClick={() => chain().toggleUnderline().run()} />
        <ToolbarButton icon={Strikethrough} label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()} />
        <span className="mx-1 h-4 w-px bg-slate-300" />
        <ToolbarButton icon={Heading2} label="Heading" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
        <ToolbarButton icon={Heading3} label="Subheading" active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
        <ToolbarButton icon={List} label="Bulleted list" active={s.bullet} onClick={() => chain().toggleBulletList().run()} />
        <ToolbarButton icon={ListOrdered} label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()} />
        <ToolbarButton icon={Quote} label="Quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()} />
        <span className="mx-1 h-4 w-px bg-slate-300" />
        <ToolbarButton icon={Link2} label="Add link" active={s.link} onClick={setLink} />
        <ToolbarButton icon={Unlink} label="Remove link" disabled={!s.link} onClick={() => chain().unsetLink().run()} />
        <span className="ml-auto" />
        <ToolbarButton icon={Undo2} label="Undo" disabled={!s.canUndo} onClick={() => chain().undo().run()} />
        <ToolbarButton icon={Redo2} label="Redo" disabled={!s.canRedo} onClick={() => chain().redo().run()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
