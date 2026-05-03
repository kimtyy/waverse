import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Discover from './pages/Discover'
import Upload from './pages/Upload'
import Profile from './pages/Profile'
import Favorites from './pages/Favorites'
import Auth from './pages/Auth'
import AdminPage     from './pages/admin/AdminPage'
import DashboardPage from './pages/dashboard/DashboardPage'

function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0d1a16',
            color: '#fff',
            border: '1px solid rgba(29,158,117,0.25)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#1D9E75', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        <Route path="/auth"      element={<Auth />} />
        <Route path="/admin"     element={<AdminPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route element={<LayoutWrapper />}>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
