import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, History, Plus, Save, Trash2 } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { isSafeUrl, cx } from '../../utils/links.js';
import { newId } from '../utils.js';
import { SortableList } from '../components/Sortable.jsx';
import { LinkInput } from '../components/LinkFields.jsx';
import RevisionHistory from '../components/RevisionHistory.jsx';
import { Button, Card, ErrorBox, IconButton, Input, PageHeader, Select, Spinner, Tabs, Toggle, useUi } from '../components/ui.jsx';

const MENUS = [
  ['main', 'Header menu'],
  ['footer', 'Footer menu'],
];

export default function Navigation() {
  const { toast } = useUi();
  const [menus, setMenus] = useState(null);
  const [tab, setTab] = useState('main');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState(false);

  const load = useCallback(async () => {
    try {
      setMenus(await adminApi.navigation.get());
      setDirty(false);
      setError(null);
    } catch (err) {
      setError(toApiError(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = menus?.[tab] || [];
  const setItems = (fn) => {
    setMenus((m) => ({ ...m, [tab]: fn(m[tab]) }));
    setDirty(true);
  };
  const update = (id, patch) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id) => setItems((list) => list.filter((i) => i.id !== id).map((i) => (i.parentId === id ? { ...i, parentId: null } : i)));
  const add = () => setItems((list) => [...list, { id: newId('nav'), label: 'New link', url: '/', newTab: false, parentId: null, visible: true }]);

  const invalid = items.some((i) => !i.label.trim() || !i.url || !isSafeUrl(i.url));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      setMenus(await adminApi.navigation.update({ [tab]: items }));
      setDirty(false);
      toast('Navigation saved — it is live on the website.');
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Menus"
        description="The links at the top (header) and bottom (footer) of your website. Changes go live as soon as you save."
        actions={
          <>
            <Button icon={History} onClick={() => setHistory(true)}>
              History
            </Button>
            <Button variant="primary" icon={Save} onClick={save} loading={saving} disabled={!dirty || invalid}>
              Save menu
            </Button>
          </>
        }
      />
      <Tabs
        tabs={MENUS.map(([k, l]) => [k, l, menus?.[k]?.length])}
        value={tab}
        onChange={(k) => {
          if (dirty && !window.confirm('Discard unsaved changes to this menu?')) return;
          if (dirty) load();
          setTab(k);
        }}
        className="mb-4"
      />
      <ErrorBox error={error} onRetry={!menus ? load : undefined} />
      {!menus ? (
        <Spinner />
      ) : (
        <Card className="p-3">
          {items.length === 0 && <p className="p-6 text-center text-sm text-slate-500">This menu is empty.</p>}
          <SortableList
            items={items}
            getId={(i) => i.id}
            onReorder={(list) => setItems(() => list)}
            className="space-y-2"
            renderItem={(item, { handle }) => (
              <div className={cx('flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2 md:flex-row md:items-center', item.parentId && 'md:ml-8', !item.visible && 'opacity-60')}>
                <div className="flex items-center gap-1">
                  {handle}
                  <Input value={item.label} onChange={(e) => update(item.id, { label: e.target.value })} placeholder="Label" aria-label="Link label" className="md:w-40" invalid={!item.label.trim()} />
                </div>
                <div className="flex-1">
                  <LinkInput value={item.url} onChange={(url) => update(item.id, { url })} allowEmpty={false} />
                </div>
                <Select
                  aria-label="Parent item"
                  value={item.parentId || ''}
                  onChange={(e) => update(item.id, { parentId: e.target.value || null })}
                  options={[['', 'Main menu item'], ...items.filter((i) => i.id !== item.id && !i.parentId).map((i) => [i.id, `Inside “${i.label}” dropdown`])]}
                  className="md:w-40"
                />
                <div className="flex items-center gap-2">
                  <Toggle size="sm" label="Open in new tab" checked={item.newTab} onChange={(newTab) => update(item.id, { newTab })} />
                  <IconButton icon={item.visible ? Eye : EyeOff} label={item.visible ? 'Hide link' : 'Show link'} onClick={() => update(item.id, { visible: !item.visible })} />
                  <IconButton icon={Trash2} label="Remove link" variant="danger-ghost" onClick={() => remove(item.id)} />
                </div>
              </div>
            )}
          />
          <Button className="mt-3" size="sm" icon={Plus} onClick={add}>
            Add link
          </Button>
          <p className="mt-3 text-xs text-slate-500">
            Links to unpublished pages are hidden from visitors automatically. Use “Under:” to place a link inside a dropdown.
          </p>
        </Card>
      )}
      <RevisionHistory
        open={history}
        onClose={() => setHistory(false)}
        load={() => adminApi.revisions.list('navigation', tab)}
        restore={(rev) => adminApi.revisions.restore(rev._id)}
        restoreHint="This menu will be replaced with the selected version immediately."
        onRestored={load}
      />
    </>
  );
}
