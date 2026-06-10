import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import AdminLayout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Builder from './Builder'
import Preview from './pages/Preview'

const router = createBrowserRouter([
  {
    path: 'preview',
    element: <Preview />,
  },
  {
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'builder', element: <Builder /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
