import { NavLink, Outlet } from 'react-router-dom';

import { DASHBOARD_BACKEND_MODE } from '@/services/backend';

const links = [
  { to: '/', label: 'نظرة عامة', end: true },
  { to: '/students', label: 'الطلاب' },
  { to: '/drivers', label: 'السائقون' },
  { to: '/routes', label: 'المسارات' },
  { to: '/trips', label: 'الرحلات الحية' },
  { to: '/absences', label: 'الغياب' },
];

export function Shell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>ركاز</strong>
          <span>لوحة الإدارة</span>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mode-pill">
          وضع الربط: <b>{DASHBOARD_BACKEND_MODE}</b>
          <div>بدّل إلى firebase في services/backend/config.ts بعد تنفيذ الـ stubs.</div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
