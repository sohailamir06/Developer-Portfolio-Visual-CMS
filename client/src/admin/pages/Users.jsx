import { useState } from 'react';
import { Pencil, Plus, Trash2, Users as UsersIcon } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { useAsync } from '../../utils/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, IconButton, Input, Modal, PageHeader, Select, Spinner, useUi } from '../components/ui.jsx';

function UserModal({ user, onClose, onSaved }) {
  const isNew = !user._id;
  const [form, setForm] = useState({ name: user.name || '', email: user.email || '', role: user.role || 'editor', status: user.status || 'active', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (p) => setForm((f) => ({ ...f, ...p }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = isNew ? form : { name: form.name, role: form.role, status: form.status, ...(form.password ? { password: form.password } : {}) };
      onSaved(isNew ? await adminApi.users.create(body) : await adminApi.users.update(user._id, body));
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Add user' : `Edit ${user.name}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="user-form" loading={busy}>
            Save
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} required />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={form.email} disabled={!isNew} onChange={(e) => set({ email: e.target.value })} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" hint="Editors manage content; admins also manage settings and users.">
            <Select value={form.role} onChange={(e) => set({ role: e.target.value })} options={[['editor', 'Editor'], ['admin', 'Administrator']]} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set({ status: e.target.value })} options={[['active', 'Active'], ['disabled', 'Disabled']]} disabled={isNew} />
          </Field>
        </div>
        <Field label={isNew ? 'Password' : 'New password (optional)'} hint="At least 10 characters." required={isNew}>
          <Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => set({ password: e.target.value })} required={isNew} minLength={10} />
        </Field>
      </form>
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const { toast, confirm } = useUi();
  const { data: users, loading, error, reload, setData } = useAsync(() => adminApi.users.list(), []);
  const [editing, setEditing] = useState(null);

  const remove = async (u) => {
    if (!(await confirm({ title: `Delete ${u.name}?`, message: 'They will no longer be able to sign in.', confirmLabel: 'Delete user', danger: true }))) return;
    try {
      await adminApi.users.remove(u._id);
      setData((list) => list.filter((x) => x._id !== u._id));
      toast('User deleted');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="People who can sign in to this dashboard."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
            Add user
          </Button>
        }
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : !users?.length ? (
        <EmptyState icon={UsersIcon} title="No users" />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u._id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{u.name?.[0]?.toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {u.name} {u._id === me?._id && <span className="text-xs text-slate-400">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {u.email} · last sign-in {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'never'}
                  </p>
                </div>
                <Badge color={u.role === 'admin' ? 'blue' : 'slate'}>{u.role}</Badge>
                {u.status !== 'active' && <Badge color="red">disabled</Badge>}
                <IconButton icon={Pencil} label={`Edit ${u.name}`} onClick={() => setEditing(u)} />
                {u._id !== me?._id && <IconButton icon={Trash2} label={`Delete ${u.name}`} variant="danger-ghost" onClick={() => remove(u)} />}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {editing && (
        <UserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setData((list) => (list.some((x) => x._id === saved._id) ? list.map((x) => (x._id === saved._id ? saved : x)) : [...list, saved]));
            setEditing(null);
            toast('User saved');
          }}
        />
      )}
    </>
  );
}
