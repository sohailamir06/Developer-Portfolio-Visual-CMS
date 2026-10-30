import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, FolderKanban, Image, Inbox, Info, Pencil, Plus, Sparkles } from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { useAsync } from '../../utils/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import VisitorStats from '../components/VisitorStats.jsx';
import { Badge, Card, ErrorBox, PageHeader, Spinner } from '../components/ui.jsx';

function Stat({ to, icon: Icon, label, value, note }) {
  return (
    <Link to={to} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
          <Icon size={18} />
        </span>
        <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
      </div>
      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {note && <p className="mt-1 text-xs text-amber-700">{note}</p>}
    </Link>
  );
}

function SiteHealth({ health }) {
  const [showDone, setShowDone] = useState(false);
  const todo = health.checks.filter((c) => !c.ok).sort((a, b) => (a.level === b.level ? 0 : a.level === 'warning' ? -1 : 1));
  const done = health.checks.filter((c) => c.ok);
  const color = health.score >= 90 ? 'bg-emerald-500' : health.score >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Your to-do list</h2>
          <p className="text-xs text-slate-500">
            {todo.length ? `${todo.length} thing${todo.length > 1 ? 's' : ''} to improve before you share your portfolio.` : 'Everything looks good — your portfolio is ready to share.'}
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-56">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" role="meter" aria-label="To-do progress" aria-valuenow={health.score} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full ${color}`} style={{ width: `${health.score}%` }} />
          </div>
          <span className="w-16 text-right text-sm font-semibold">
            {health.passed}/{health.total}
          </span>
        </div>
      </div>
      {todo.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {todo.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              {c.level === 'warning' ? (
                <AlertTriangle size={17} className="shrink-0 text-amber-500" aria-label="Important" />
              ) : (
                <Info size={17} className="shrink-0 text-blue-500" aria-label="Suggestion" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{c.title}</p>
                {c.detail && <p className="text-xs text-slate-500">{c.detail}</p>}
              </div>
              <Link to={c.link} className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-50">
                {c.action}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-2">
          <button type="button" className="text-xs font-medium text-slate-500 hover:text-slate-800" aria-expanded={showDone} onClick={() => setShowDone((s) => !s)}>
            {showDone ? 'Hide' : 'Show'} {done.length} completed check{done.length > 1 ? 's' : ''}
          </button>
          {showDone && (
            <ul className="mt-2 space-y-1 pb-2">
              {done.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 size={14} className="text-emerald-500" /> {c.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => Promise.all([adminApi.dashboard(), adminApi.health()]), []);
  const [stats, health] = data || [];

  return (
    <>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`} description="Here is what is happening on your portfolio." />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : (
        stats && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat to="/admin/pages" icon={FileText} label="Pages" value={stats.counts.pages} note={stats.counts.unpublished ? `${stats.counts.unpublished} with unpublished changes` : null} />
              <Stat to="/admin/projects" icon={FolderKanban} label="Projects" value={stats.counts.projects} note={`${stats.counts.publishedProjects} published`} />
              <Stat to="/admin/skills" icon={Sparkles} label="Skills" value={stats.counts.skills} />
              <Stat to="/admin/messages" icon={Inbox} label="New messages" value={stats.counts.newMessages} />
            </div>

            {stats.health && <SiteHealth health={stats.health} />}

            <VisitorStats />

            {health?.mediaProvider === 'local' && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>
                  Images are stored on the server’s local disk. That’s fine for development and single-server hosting; set <code>MEDIA_PROVIDER=cloudinary</code> for cloud storage (see docs/setup.md).
                </p>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                  <h2 className="text-sm font-semibold">Recently edited pages</h2>
                  <Link to="/admin/pages" className="text-xs font-medium text-blue-600 hover:underline">
                    All pages
                  </Link>
                </div>
                <ul className="divide-y divide-slate-100">
                  {stats.recentPages.map((p) => (
                    <li key={p._id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-slate-500">/{p.slug === 'home' ? '' : p.slug}</p>
                      </div>
                      {p.hasUnpublishedChanges ? <Badge color="amber">Unpublished changes</Badge> : <Badge color="green">Live</Badge>}
                      <Link to={`/admin/pages/${p._id}/edit`} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600" aria-label={`Edit ${p.title}`}>
                        <Pencil size={15} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                  <h2 className="text-sm font-semibold">Latest messages</h2>
                  <Link to="/admin/messages" className="text-xs font-medium text-blue-600 hover:underline">
                    Inbox
                  </Link>
                </div>
                {stats.recentMessages.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-500">No messages yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {stats.recentMessages.map((m) => (
                      <li key={m._id} className="flex items-center gap-3 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{m.name}</p>
                          <p className="truncate text-xs text-slate-500">{m.subject || '(no subject)'}</p>
                        </div>
                        {m.status === 'new' && <Badge color="blue">New</Badge>}
                        <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card className="p-5">
              <h2 className="text-sm font-semibold">Quick actions</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ['/admin/projects/new', 'New project', Plus],
                  ['/admin/media', 'Upload images', Image],
                  ['/admin/navigation', 'Edit navigation', ArrowRight],
                  ['/admin/settings', 'Change theme & logo', ArrowRight],
                ].map(([to, label, Icon]) => (
                  <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
                    <Icon size={15} /> {label}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )
      )}
    </>
  );
}
