import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'

import PublicLayout from '@/layouts/PublicLayout'
import AdminLayout from '@/layouts/AdminLayout'
import { ProfileProvider } from '@/hooks/useProfile'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { PageLoader } from '@/components/common/PageLoader'

/**
 * Application routes.
 *
 * Every page is lazily loaded, so a first-time visitor downloads the home page
 * rather than the entire admin panel they may never open. Each lazy element
 * gets its own Suspense boundary showing a skeleton, which stops a chunk fetch
 * from flashing a blank screen.
 */

/* Public */
const Home = lazy(() => import('@/pages/Home'))
const About = lazy(() => import('@/pages/About'))
const Projects = lazy(() => import('@/pages/Projects'))
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'))
const Experience = lazy(() => import('@/pages/Experience'))
const Education = lazy(() => import('@/pages/Education'))
const Contact = lazy(() => import('@/pages/Contact'))
const Architecture = lazy(() => import('@/pages/Architecture'))
const NotFound = lazy(() => import('@/pages/NotFound'))

/* Admin */
const Login = lazy(() => import('@/pages/admin/Login'))
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminProjects = lazy(() => import('@/pages/admin/AdminProjects'))
const AdminExperience = lazy(() => import('@/pages/admin/AdminExperience'))
const AdminEducation = lazy(() => import('@/pages/admin/AdminEducation'))
const AdminSkills = lazy(() => import('@/pages/admin/AdminSkills'))
const AdminMessages = lazy(() => import('@/pages/admin/AdminMessages'))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'))

/** Wraps a lazily-loaded page in its own loading boundary. */
function page(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  /* ------------------------------------------------------ Public site --- */
  {
    element: (
      // Mounted above the layout so the header, footer and pages share a single
      // profile request rather than making one each.
      <ProfileProvider>
        <PublicLayout />
      </ProfileProvider>
    ),
    children: [
      { index: true, element: page(<Home />) },
      { path: 'about', element: page(<About />) },
      { path: 'projects', element: page(<Projects />) },
      { path: 'projects/:slug', element: page(<ProjectDetail />) },
      { path: 'experience', element: page(<Experience />) },
      { path: 'education', element: page(<Education />) },
      { path: 'contact', element: page(<Contact />) },
      { path: 'architecture', element: page(<Architecture />) },
    ],
  },

  /* ----------------------------------------------------- Admin panel --- */
  {
    path: 'admin',
    // AuthProvider wraps the login screen as well as the protected pages: the
    // login form calls `login()` from this same context, and the session check
    // must have run before ProtectedRoute decides to redirect.
    //
    // It needs an explicit <Outlet /> — a provider used as a route element
    // receives no `children`, so nested routes would silently render nothing.
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      { path: 'login', element: page(<Login />) },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: page(<Dashboard />) },
              { path: 'projects', element: page(<AdminProjects />) },
              { path: 'experience', element: page(<AdminExperience />) },
              { path: 'education', element: page(<AdminEducation />) },
              { path: 'skills', element: page(<AdminSkills />) },
              { path: 'messages', element: page(<AdminMessages />) },
              { path: 'settings', element: page(<AdminSettings />) },
            ],
          },
        ],
      },
    ],
  },

  /* Anything else. */
  { path: '*', element: page(<NotFound />) },
])
