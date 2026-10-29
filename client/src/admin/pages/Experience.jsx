import { useState } from 'react';
import { Briefcase, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { useAsync } from '../../utils/hooks.js';
import { formatMonthYear, cx } from '../../utils/links.js';
import { SortableList } from '../components/Sortable.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';
import { LinkInput } from '../components/LinkFields.jsx';
import { StringList, TagInput } from '../components/ListInputs.jsx';
import { Button, Card, EmptyState, ErrorBox, Field, IconButton, Input, Modal, PageHeader, Spinner, Toggle, useUi } from '../components/ui.jsx';

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const EMPTY = { company: '', companyUrl: '', position: '', location: '', employmentType: '', startDate: '', endDate: '', current: false, description: '', responsibilities: [], technologies: [], visible: true };

function ExperienceModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...item, startDate: toInputDate(item?.startDate), endDate: toInputDate(item?.endDate) }));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const err = (p) => error?.details?.find((d) => d.path === p)?.message;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { _id, __v, createdAt, updatedAt, order, ...body } = form;
    body.responsibilities = body.responsibilities.filter((r) => r.trim());
    try {
      onSaved(item?._id ? await adminApi.experience.update(item._id, body) : await adminApi.experience.create(body));
    } catch (e2) {
      setError(toApiError(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={item?._id ? 'Edit experience' : 'Add experience'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="exp-form" loading={busy}>
            Save
          </Button>
        </>
      }
    >
      <form id="exp-form" onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title" required error={err('position')}>
            <Input value={form.position} onChange={(e) => set({ position: e.target.value })} required />
          </Field>
          <Field label="Company" required error={err('company')}>
            <Input value={form.company} onChange={(e) => set({ company: e.target.value })} required />
          </Field>
          <Field label="Company website" error={err('companyUrl')}>
            <LinkInput value={form.companyUrl} onChange={(companyUrl) => set({ companyUrl })} placeholder="https://…" />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Remote" />
          </Field>
          <Field label="Employment type">
            <Input value={form.employmentType} onChange={(e) => set({ employmentType: e.target.value })} placeholder="e.g. Full-time, Contract" />
          </Field>
          <div />
          <Field label="Start date" required error={err('startDate')}>
            <Input type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} required />
          </Field>
          <Field label="End date" error={err('endDate')}>
            <Input type="date" value={form.current ? '' : form.endDate} disabled={form.current} onChange={(e) => set({ endDate: e.target.value })} />
          </Field>
        </div>
        <Toggle label="I currently work here" checked={form.current} onChange={(current) => set({ current })} />
        <Field label="Description">
          <RichTextEditor value={form.description} onChange={(description) => set({ description })} />
        </Field>
        <Field label="Responsibilities & achievements">
          <StringList value={form.responsibilities} onChange={(responsibilities) => set({ responsibilities })} addLabel="Add responsibility" />
        </Field>
        <Field label="Technologies used">
          <TagInput value={form.technologies} onChange={(technologies) => set({ technologies })} />
        </Field>
        <Toggle label="Visible on website" checked={form.visible} onChange={(visible) => set({ visible })} />
      </form>
    </Modal>
  );
}

export default function Experience() {
  const { toast, confirm } = useUi();
  const { data: items, loading, error, reload, setData } = useAsync(() => adminApi.experience.list(), []);
  const [editing, setEditing] = useState(null);

  const reorder = async (list) => {
    const previous = items;
    setData(list);
    try {
      await adminApi.experience.reorder(list.map((x) => x._id));
    } catch (err) {
      setData(previous);
      toast(toApiError(err).message, 'error');
    }
  };

  const save = async (item, patch) => {
    try {
      const { _id, __v, createdAt, updatedAt, order, ...rest } = item;
      const updated = await adminApi.experience.update(_id, { ...rest, ...patch });
      setData((list) => list.map((x) => (x._id === _id ? updated : x)));
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  const remove = async (x) => {
    if (!(await confirm({ title: `Delete ${x.position} at ${x.company}?`, confirmLabel: 'Delete', danger: true }))) return;
    try {
      await adminApi.experience.remove(x._id);
      setData((list) => list.filter((i) => i._id !== x._id));
      toast('Entry deleted');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Experience"
        description="Your work history. Drag to set the display order (most recent first is typical)."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
            Add experience
          </Button>
        }
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : !items?.length ? (
        <EmptyState icon={Briefcase} title="No experience entries" description="Add roles you want to show on your portfolio." action={<Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Add experience</Button>} />
      ) : (
        <Card className="p-2">
          <SortableList
            items={items}
            onReorder={reorder}
            className="divide-y divide-slate-100"
            renderItem={(x, { handle }) => (
              <div className="flex items-center gap-3 bg-white px-2 py-3">
                {handle}
                <div className="min-w-0 flex-1">
                  <p className={cx('truncate font-medium', !x.visible && 'text-slate-400 line-through')}>
                    {x.position} · {x.company}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatMonthYear(x.startDate)} — {x.current ? 'Present' : formatMonthYear(x.endDate) || 'Present'}
                  </p>
                </div>
                <IconButton icon={x.visible ? Eye : EyeOff} label={x.visible ? 'Hide' : 'Show'} onClick={() => save(x, { visible: !x.visible })} />
                <IconButton icon={Pencil} label="Edit" onClick={() => setEditing(x)} />
                <IconButton icon={Trash2} label="Delete" variant="danger-ghost" onClick={() => remove(x)} />
              </div>
            )}
          />
        </Card>
      )}
      {editing && (
        <ExperienceModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setData((list) => (list.some((x) => x._id === saved._id) ? list.map((x) => (x._id === saved._id ? saved : x)) : [...list, saved]));
            setEditing(null);
            toast('Experience saved');
          }}
        />
      )}
    </>
  );
}
