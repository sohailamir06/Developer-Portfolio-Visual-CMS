import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout.jsx';
import PageRoute from './pages/PageRoute.jsx';
import ProjectDetails from './pages/ProjectDetails.jsx';
import NotFound from './pages/NotFound.jsx';
import { Loading } from './components/common/Status.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

// The admin dashboard and editor are split into their own bundle so visitors never download them.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));
const Preview = lazy(() => import('./pages/Preview.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Loading className="min-h-screen" />}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route
          path="/preview/:pageId"
          element={
            <AuthProvider>
              <Preview />
            </AuthProvider>
          }
        />
        <Route element={<PublicLayout />}>
          <Route index element={<PageRoute slug="home" />} />
          <Route path="projects/:slug" element={<ProjectDetails />} />
          <Route path=":slug" element={<PageRoute />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
