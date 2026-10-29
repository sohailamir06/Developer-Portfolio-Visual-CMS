import { useEffect, useState } from 'react';
import { Archive, ArrowLeft, Inbox, Mail, MailCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { useAsync } from '../../utils/hooks.js';
import { cx } from '../../utils/links.js';
import { Badge, Button, Card, EmptyState, ErrorBox, PageHeader, Spinner, Tabs, useUi } from '../components/ui.jsx';

const STATUS_COLORS = { new: 'blue', read: 'slate', replied: 'green', archived: 'slate', spam: 'red' };

export default function Messages() {
  const { toast, confirm } = useUi();
  const [status, setStatus] = useState('new');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const { data, loading, error, reload, setData } = useAsync(() => adminApi.messages.list({ status, page }), [status, page]);

  useEffect(() => setPage(1), [status]);

  const setMsgStatus = async (msg, next) => {
    try {
      const updated = await adminApi.messages.update(msg._id, next);
      setOpen((o) => (o?._id === msg._id ? updated : o));
      setData((d) => ({ ...d, items: d.items.map((m) => (m._id === msg._id ? updated : m)) }));
      if (next !== 'read') toast(`Marked as ${next}`);
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  const openMessage = (msg) => {
    setOpen(msg);
    if (msg.status === 'new') setMsgStatus(msg, 'read');
  };

  const remove = async (msg) => {
    if (!(await confirm({ title: 'Delete message?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await adminApi.messages.remove(msg._id);
      setOpen(null);
      reload();
      toast('Message deleted');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  const counts = data?.counts || {};
  return (
    <>
      <PageHeader title="Messages" description="Submissions from your contact form." />
      <Tabs
        tabs={[
          ['new', 'New', counts.new || 0],
          ['read', 'Read', counts.read || 0],
          ['replied', 'Replied', counts.replied || 0],
          ['archived', 'Archived', counts.archived || 0],
          ['spam', 'Spam', counts.spam || 0],
          ['all', 'All'],
        ]}
        value={status}
        onChange={(s) => {
          setStatus(s);
          setOpen(null);
        }}
        className="mb-4"
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? (
        <Spinner />
      ) : !data?.items.length ? (
        <EmptyState icon={Inbox} title="No messages here" description="New contact form submissions will appear in “New”." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Card className={cx('overflow-hidden', open && 'hidden lg:block')}>
            <ul className="divide-y divide-slate-100">
              {data.items.map((m) => (
                <li key={m._id}>
                  <button type="button" onClick={() => openMessage(m)} className={cx('block w-full px-4 py-3 text-left transition hover:bg-slate-50', open?._id === m._id && 'bg-blue-50')}>
                    <div className="flex items-center gap-2">
                      <span className={cx('flex-1 truncate text-sm', m.status === 'new' ? 'font-bold' : 'font-medium')}>{m.name}</span>
                      <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="truncate text-xs text-slate-600">{m.subject || '(no subject)'}</p>
                    <p className="truncate text-xs text-slate-400">{m.message}</p>
                  </button>
                </li>
              ))}
            </ul>
            {data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs">
                <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                Page {data.page} of {data.pages}
                <Button size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </Card>

          {open ? (
            <Card className="p-5">
              <Button size="sm" variant="ghost" icon={ArrowLeft} className="mb-3 lg:hidden" onClick={() => setOpen(null)}>
                Back
              </Button>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{open.subject || '(no subject)'}</h2>
                  <p className="text-sm text-slate-600">
                    {open.name} &lt;
                    <a href={`mailto:${open.email}`} className="text-blue-600 hover:underline">
                      {open.email}
                    </a>
                    &gt;
                  </p>
                  <p className="text-xs text-slate-400">{new Date(open.createdAt).toLocaleString()}</p>
                </div>
                <Badge color={STATUS_COLORS[open.status]}>{open.status}</Badge>
              </div>
              <p className="mt-5 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">{open.message}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject || 'your message'}`)}`}
                  onClick={() => setMsgStatus(open, 'replied')}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Mail size={16} /> Reply by email
                </a>
                <Button icon={MailCheck} onClick={() => setMsgStatus(open, 'replied')}>
                  Mark replied
                </Button>
                <Button icon={Archive} onClick={() => setMsgStatus(open, 'archived')}>
                  Archive
                </Button>
                <Button icon={ShieldAlert} onClick={() => setMsgStatus(open, 'spam')}>
                  Spam
                </Button>
                <Button icon={Trash2} variant="danger-ghost" onClick={() => remove(open)}>
                  Delete
                </Button>
              </div>
            </Card>
          ) : (
            <div className="hidden items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 lg:flex">Select a message to read it</div>
          )}
        </div>
      )}
    </>
  );
}
