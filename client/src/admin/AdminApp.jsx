import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { useDocumentMeta } from '../utils/hooks.js';
import { Spinner, UiProvider } from './components/ui.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

const Pages = lazy(() => import('./pages/Pages.jsx'));
const PageEditor = lazy(() => import('./editors/PageEditor.jsx'));
const Projects = lazy(() => import('./pages/Projects.jsx'));
const ProjectForm = lazy(() => import('./pages/ProjectForm.jsx'));
const Skills = lazy(() => import('./pages/Skills.jsx'));
const Experience = lazy(() => import('./pages/Experience.jsx'));
const Media = lazy(() => import('./pages/Media.jsx'));
const Navigation = lazy(() => import('./pages/Navigation.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Seo = lazy(() => import('./pages/Seo.jsx'));
const Messages = lazy(() => import('./pages/Messages.jsx'));
const Users = lazy(() => import('./pages/Users.jsx'));

function RequireAuth({ children, role }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <Spinner className="min-h-screen" label="Checking session…" />;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to="/admin" replace />;
  return children;
}

export default function AdminApp() {
  useDocumentMeta({ title: 'Admin', noindex: true });
  const fallback = <Spinner className="min-h-[50vh]" />;
  return (
    <AuthProvider>
      <UiProvider>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased" style={{ colorScheme: 'light' }}>
          <Suspense fallback={fallback}>
            <Routes>
              <Route path="login" element={<Login />} />
              <Route
                path="pages/:id/edit"
                element={
                  <RequireAuth>
                    <PageEditor />
                  </RequireAuth>
                }
              />
              <Route
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="pages" element={<Pages />} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/new" element={<ProjectForm />} />
                <Route path="projects/:id" element={<ProjectForm />} />
                <Route path="skills" element={<Skills />} />
                <Route path="experience" element={<Experience />} />
                <Route path="media" element={<Media />} />
                <Route path="navigation" element={<Navigation />} />
                <Route path="settings" element={<RequireAuth role="admin"><Settings /></RequireAuth>} />
                <Route path="seo" element={<Seo />} />
                <Route path="messages" element={<Messages />} />
                <Route path="users" element={<RequireAuth role="admin"><Users /></RequireAuth>} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </div>
      </UiProvider>
    </AuthProvider>
  );
}
