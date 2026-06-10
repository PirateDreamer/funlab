import { NavLink, Outlet } from 'react-router-dom'
import './index.css'

const NAV_ITEMS = [
  { to: '/', label: '工作台', icon: '▦' },
  { to: '/builder', label: '页面搭建', icon: '▧' },
] as const

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <strong>FunLab</strong>
          <span>管理后台</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              end={to === '/'}
              key={to}
              to={to}
            >
              <span className="sidebar-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>v0.1.0</span>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div />
          <div className="admin-header-right">
            <span className="admin-avatar">A</span>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
