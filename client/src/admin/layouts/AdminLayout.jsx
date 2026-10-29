import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase, ExternalLink, FileText, FolderKanban, Image, Inbox, LayoutDashboard, LogOut, Menu, Navigation, Search,
  Settings, Sparkles, Users, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { cx } from '../../utils/links.js';

const NAV = [
  ['Overview', [['/admin', 'Dashboard', LayoutDashboard, true]]],
  ['Content', [
    ['/admin/pages', 'Pages', FileText],
    ['/admin/projects', 'Projects', FolderKanban],
    ['/admin/skills', 'Skills', Sparkles],
    ['/admin/experience', 'Experience', Briefcase],
    ['/admin/media', 'Media Library', Image],
  ]],
  ['Site', [
    ['/admin/navigation', 'Navigation', Navigation],
    ['/admin/settings', 'Settings', Settings, false, 'admin'],
    ['/admin/seo', 'SEO', Search],
    ['/admin/messages', 'Messages', Inbox],
    ['/admin/users', 'Users', Users, false, 'admin'],
  ]],
];

function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  return (
    <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV.map(([group, items]) => (
        <div key={group}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group}</p>
          <ul className="space-y-0.5">
            {items
              .filter(([, , , , role]) => !role || user?.role === role)
              .map(([to, label, Icon, end]) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition', isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
                    }
                  >
                    <Icon size={17} aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);

  const signOut = async () => {
    await logout();
    navigate('/admin/login');
  };

  const brand = (
    <Link to="/admin" className="flex items-center gap-2 px-5 py-4 text-sm font-bold text-slate-900">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
        <LayoutDashboard size={16} />
      </span>
      Portfolio CMS
    </Link>
  );

  const footer = (
    <div className="border-t border-slate-200 p-3">
      <div className="mb-2 px-2">
        <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
        <p className="truncate text-xs text-slate-500">
          {user?.email} · {user?.role}
        </p>
      </div>
      <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
        <ExternalLink size={16} /> View website
      </a>
      <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );

  return (
    <div className="lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {brand}
        <Sidebar />
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur lg:hidden">
        {brand}
        <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-slate-100" aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
            {footer}
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
