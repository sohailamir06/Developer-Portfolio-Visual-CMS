import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, FolderKanban, ImageOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { adminApi, toApiError } from '../../services/api.js';
import { useAsync } from '../../utils/hooks.js';
import { SortableList } from '../components/Sortable.jsx';
import { resetLinkCache } from '../components/LinkFields.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, IconButton, PageHeader, Spinner, useUi } from '../components/ui.jsx';

export default function Projects() {
  const navigate = useNavigate();
  const { toast, confirm } = useUi();
  const { data: projects, loading, error, reload, setData } = useAsync(() => adminApi.projects.list(), []);

  const reorder = async (list) => {
    const previous = projects;
    setData(list);
    try {
      await adminApi.projects.reorder(list.map((p) => p._id));
      toast('Order saved');
    } catch (err) {
      setData(previous);
      toast(toApiError(err).message, 'error');
    }
  };

  const remove = async (p) => {
    if (!(await confirm({ title: `Delete “${p.title}”?`, message: 'This permanently deletes the project and its history. Uploaded images stay in the Media Library.', confirmLabel: 'Delete project', danger: true }))) return;
    try {
      await adminApi.projects.remove(p._id);
      setData((list) => list.filter((x) => x._id !== p._id));
      resetLinkCache();
      toast('Project deleted');
    } catch (err) {
      toast(toApiError(err).message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Drag to change the display order. Only published projects appear on the website."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate('/admin/projects/new')}>
            New project
          </Button>
        }
      />
      <ErrorBox error={error} onRetry={reload} />
      {loading ? (
        <Spinner />
      ) : !projects?.length ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Add your first project to show it in your portfolio." action={<Button variant="primary" icon={Plus} onClick={() => navigate('/admin/projects/new')}>New project</Button>} />
      ) : (
        <Card className="p-2">
          <SortableList
            items={projects}
            onReorder={reorder}
            className="divide-y divide-slate-100"
            renderItem={(p, { handle }) => (
              <div className="flex items-center gap-3 bg-white px-2 py-2.5">
                {handle}
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  {p.featuredImage?.url ? <img src={p.featuredImage.url} alt="" className="h-full w-full object-cover" /> : <ImageOff size={18} className="m-auto mt-3.5 text-slate-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/projects/${p._id}`} className="block truncate font-medium hover:text-blue-700">
                    {p.title}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    {p.category || 'No category'} · {(p.technologies || []).slice(0, 4).join(', ')}
                  </p>
                </div>
                <div className="hidden gap-1.5 sm:flex">
                  {p.featured && (
                    <Badge color="amber">
                      <Star size={10} /> Featured
                    </Badge>
                  )}
                  <Badge color={p.status === 'published' ? 'green' : 'slate'}>{p.status === 'published' ? 'Published' : 'Draft'}</Badge>
                </div>
                <IconButton icon={Pencil} label={`Edit ${p.title}`} onClick={() => navigate(`/admin/projects/${p._id}`)} />
                {p.status === 'published' && (
                  <a href={`/projects/${p.slug}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="View live">
                    <ExternalLink size={15} />
                  </a>
                )}
                <IconButton icon={Trash2} label={`Delete ${p.title}`} variant="danger-ghost" onClick={() => remove(p)} />
              </div>
            )}
          />
        </Card>
      )}
    </>
  );
}
