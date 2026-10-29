import { useMemo, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { useAsync } from '../../utils/hooks.js';
import { Icon, SKILL_ICONS } from '../../components/common/Icon.jsx';
import { SortableList } from '../components/Sortable.jsx';
import ImageField from '../components/ImageField.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Field, IconButton, Input, Modal, PageHeader, Select, Spinner, Toggle, useUi } from '../components/ui.jsx';
import { cx } from '../../utils/links.js';

const EMPTY = { name: '', category: '', icon: '', proficiencyLabel: '', proficiency: null, visible: true };

function SkillModal({ skill, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...skill }));
  const [mode, setMode] = useState(typeof skill?.proficiency === 'number' ? 'percent' : skill?.proficiencyLabel ? 'label' : 'none');
  const [iconKind, setIconKind] = useState(skill?.icon && /^[/h]/.test(skill.icon) ? 'image' : 'icon');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      name: form.name,
      category: form.category || 'Other',
      icon: form.icon,
      visible: form.visible,
      proficiency: mode === 'percent' ? Number(form.proficiency ?? 0) : null,
      proficiencyLabel: mode === 'label' ? form.proficiencyLabel : '',
    };
    try {
      onSaved(skill?._id ? await adminApi.skills.update(skill._id, body) : await adminApi.skills.create(body));
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
      title={skill?._id ? 'Edit skill' : 'Add skill'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="skill-form" loading={busy}>
            Save
          </Button>
        </>
      }
    >
      <form id="skill-form" onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} required maxLength={80} />
          </Field>
          <Field label="Category" required hint="e.g. Frontend, Backend, Database, Tools" htmlFor="skill-category">
            <Input id="skill-category" value={form.category} onChange={(e) => set({ category: e.target.value })} list="skill-categories" required maxLength={60} />
            <datalist id="skill-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label="Icon">
          <div className="mb-2 flex gap-2">
            <Button size="sm" variant={iconKind === 'icon' ? 'primary' : 'secondary'} onClick={() => setIconKind('icon')}>
              Built-in icon
            </Button>
            <Button size="sm" variant={iconKind === 'image' ? 'primary' : 'secondary'} onClick={() => setIconKind('image')}>
              Upload image
            </Button>
          </div>
          {iconKind === 'icon' ? (
            <div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-10">
              {Object.keys(SKILL_ICONS).map((name) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  aria-label={name}
                  aria-pressed={form.icon === name}
                  onClick={() => set({ icon: form.icon === name ? '' : name })}
                  className={cx('grid aspect-square place-items-center rounded-md transition', form.icon === name ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100')}
                >
                  <Icon name={name} size={18} />
                </button>
              ))}
            </div>
          ) : (
            <ImageField value={{ url: /^[/h]/.test(form.icon) ? form.icon : '' }} onChange={(img) => set({ icon: img.url })} options={[]} />
          )}
        </Field>
        <Field label="Proficiency (optional)">
          <Select value={mode} onChange={(e) => setMode(e.target.value)} options={[['none', 'Don’t show'], ['label', 'Text label (e.g. Advanced)'], ['percent', 'Percentage bar']]} />
        </Field>
        {mode === 'label' && (
          <Field label="Label">
            <Input value={form.proficiencyLabel} onChange={(e) => set({ proficiencyLabel: e.target.value })} maxLength={40} placeholder="e.g. Advanced" />
          </Field>
        )}
        {mode === 'percent' && (
          <Field label={`Percentage: ${form.proficiency ?? 0}%`}>
            <input type="range" min={0} max={100} step={5} value={form.proficiency ?? 0} onChange={(e) => set({ proficiency: Number(e.target.value) })} className="w-full accent-blue-600" />
          </Field>
        )}
        <Toggle label="Visible on website" checked={form.visible} onChange={(visible) => set({ visible })} />
      </form>
    </Modal>
  );
}

export default function Skills() {
  const { toast, confirm } = useUi();
  const { data: skills, loading, error, reload, setData } = useAsync(() => adminApi.skills.list(), []);
  const [editing, setEditing] = useState(null);

  const groups = useMemo(() => {
    const map = new Map();
    for (const s of [...(skills || [])].sort((a, b) => a.order - b.order)) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category).push(s);
    }
    return [...map.entries()];
  }, [skills]);

  const persistOrder = async (nextGroups) => {
    const flat = nextGroups.flatMap(([, list]) => list).map((s, order) => ({ ...s, order }));
    const previous = skills;
    setData(flat);
    try {
      await adminApi.skills.reorder(flat.map((s) => s._id));
    } catch (err) {
      setData(previous);
      toast(toApiError(err).message, 'error');
    }
  };

  const toggle = async (s) => {
    try {
      const updated = await adminApi.skills.update(s._id, { ...s, visible: !s.visible });
      setData((list) => list.map((x) => (x._id === s._id ? updated : x)));
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  const remove = async (s) => {
    if (!(await confirm({ title: `Delete ${s.name}?`, confirmLabel: 'Delete', danger: true }))) return;
    try {
      await adminApi.skills.remove(s._id);
      setData((list) => list.filter((x) => x._id !== s._id));
      toast('Skill deleted');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Skills"
        description="Grouped by category. Drag to reorder within a category."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
            Add skill
          </Button>
        }
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : !skills?.length ? (
        <EmptyState icon={Sparkles} title="No skills yet" action={<Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Add skill</Button>} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {groups.map(([category, list], gi) => (
            <Card key={category} className="p-3">
              <h2 className="mb-2 flex items-center justify-between px-2 text-sm font-semibold">
                {category} <Badge>{list.length}</Badge>
              </h2>
              <SortableList
                items={list}
                onReorder={(next) => persistOrder(groups.map((g, i) => (i === gi ? [category, next] : g)))}
                className="space-y-1"
                renderItem={(s, { handle }) => (
                  <div className="flex items-center gap-2 rounded-lg bg-white px-1 py-1.5 hover:bg-slate-50">
                    {handle}
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-600">
                      <Icon name={s.icon} size={16} />
                    </span>
                    <span className={cx('flex-1 truncate text-sm font-medium', !s.visible && 'text-slate-400 line-through')}>{s.name}</span>
                    <span className="hidden text-xs text-slate-500 sm:inline">{typeof s.proficiency === 'number' ? `${s.proficiency}%` : s.proficiencyLabel}</span>
                    <IconButton icon={s.visible ? Eye : EyeOff} label={s.visible ? 'Hide' : 'Show'} onClick={() => toggle(s)} />
                    <IconButton icon={Pencil} label={`Edit ${s.name}`} onClick={() => setEditing(s)} />
                    <IconButton icon={Trash2} label={`Delete ${s.name}`} variant="danger-ghost" onClick={() => remove(s)} />
                  </div>
                )}
              />
            </Card>
          ))}
        </div>
      )}
      {editing && (
        <SkillModal
          skill={editing}
          categories={groups.map(([c]) => c)}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setData((list) => (list.some((x) => x._id === saved._id) ? list.map((x) => (x._id === saved._id ? saved : x)) : [...list, saved]));
            setEditing(null);
            toast('Skill saved');
          }}
        />
      )}
    </>
  );
}
