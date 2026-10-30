import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, FileText, FolderKanban, Plus, Search, Settings } from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { cx } from '../../utils/links.js';

const DESTINATIONS = [
  ['Dashboard', '/admin'],
  ['Pages', '/admin/pages'],
  ['Projects', '/admin/projects'],
  ['Skills', '/admin/skills'],
  ['Experience', '/admin/experience'],
  ['Pictures & files (media)', '/admin/media'],
  ['Menus (navigation)', '/admin/navigation'],
  ['Settings', '/admin/settings', 'admin'],
  ['Theme & colours', '/admin/settings', 'admin'],
  ['Google & sharing (SEO)', '/admin/seo'],
  ['Messages', '/admin/messages'],
  ['Users', '/admin/users', 'admin'],
];

const ACTIONS = [
  ['New project', '/admin/projects/new'],
  ['Upload images', '/admin/media'],
];

/** Ctrl/Cmd+K quick search across admin screens, pages and projects. */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [content, setContent] = useState({ pages: [], projects: [], loaded: false });
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 0);
    // Refresh on every open so newly created pages/projects appear.
    Promise.all([adminApi.pages.list(), adminApi.projects.list()])
      .then(([pages, projects]) => setContent({ pages, projects, loaded: true }))
      .catch(() => setContent((c) => ({ ...c, loaded: true })));
  }, [open]);

  const items = useMemo(() => {
    const all = [
      ...DESTINATIONS.filter(([, , role]) => !role || user?.role === role).map(([label, to]) => ({ label, to, group: 'Go to', icon: Settings })),
      ...ACTIONS.map(([label, to]) => ({ label, to, group: 'Actions', icon: Plus })),
      ...content.pages.map((p) => ({ label: p.title, hint: p.slug === 'home' ? '/' : `/${p.slug}`, to: `/admin/pages/${p._id}/edit`, group: 'Edit page', icon: FileText })),
      ...content.projects.map((p) => ({ label: p.title, hint: p.status, to: `/admin/projects/${p._id}`, group: 'Edit project', icon: FolderKanban })),
    ];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((i) => `${i.label} ${i.hint || ''} ${i.group}`.toLowerCase().includes(q));
  }, [query, content, user]);

  // Esc closes the palette wherever focus is (the input is focused a tick after opening).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const go = (item) => {
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      go(items[active]);
    }
  };

  let lastGroup = null;
  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center bg-slate-900/50 p-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Quick search" className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, projects, settings…"
            className="h-12 flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-activedescendant={items[active] ? `cmdk-${active}` : undefined}
          />
          <kbd className="rounded border border-slate-200 px-1.5 text-[10px] text-slate-400">Esc</kbd>
        </div>
        <ul id="cmdk-list" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-500">{content.loaded ? 'No results' : 'Loading…'}</li>}
          {items.map((item, i) => {
            const header = item.group !== lastGroup && item.group;
            lastGroup = item.group;
            const I = item.icon;
            return (
              <li key={`${item.group}-${item.to}-${item.label}`} role="presentation">
                {header && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{header}</p>}
                <button
                  id={`cmdk-${i}`}
                  data-index={i}
                  type="button"
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm', i === active ? 'bg-blue-50 text-blue-800' : 'text-slate-700')}
                >
                  <I size={15} className="shrink-0 text-slate-400" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="truncate text-xs text-slate-400">{item.hint}</span>}
                  {i === active && <CornerDownLeft size={13} className="text-blue-500" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
