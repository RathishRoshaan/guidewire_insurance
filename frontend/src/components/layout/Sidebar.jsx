import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  UserPlus,
  Shield,
  FileWarning,
  Zap,
  BarChart3,
  CloudLightning,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MapPin,
  Umbrella,
} from 'lucide-react';
import { useState } from 'react';
import LanguageSwitcher from '../LanguageSwitcher';
import './Sidebar.css';

const adminNav = [
  { path: '/', icon: LayoutDashboard, label: 'Admin Panel', id: 'nav-dashboard' },
  { path: '/onboarding', icon: UserPlus, label: 'Onboarding', id: 'nav-onboarding' },
  { path: '/policies', icon: Shield, label: 'Policies', id: 'nav-policies' },
  { path: '/claims', icon: FileWarning, label: 'Claims', id: 'nav-claims' },
  { path: '/triggers', icon: Zap, label: 'Triggers', id: 'nav-triggers' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', id: 'nav-analytics' },
  { path: '/weather', icon: CloudLightning, label: 'Live Data', id: 'nav-weather' },
];

const workerNav = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', id: 'nav-dashboard-user' },
  { path: '/claims', icon: FileWarning, label: 'My Claims', id: 'nav-claims-user' },
  { path: '/weather', icon: CloudLightning, label: 'Area Risks', id: 'nav-weather-user' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { data, isAdmin, currentUser, currentLocation, logout } = useApp();
  const location = useLocation();

  const navItems = isAdmin ? adminNav : workerNav;
  const activeAlerts = data?.alerts?.filter(a => a.status === 'active').length || 0;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Umbrella size={collapsed ? 24 : 28} />
        </div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-name">GigCover</span>
            <span className="logo-tagline">AI Insurance</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              id={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <div className="nav-icon-wrapper">
                <Icon size={20} />
                {item.path === '/triggers' && activeAlerts > 0 && (
                  <span className="nav-badge">{activeAlerts}</span>
                )}
              </div>
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {isActive && <div className="nav-indicator" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="sidebar-footer">
          <div style={{ marginBottom: '1rem' }}>
            <LanguageSwitcher />
          </div>
          <div className="profile-section">
            <div className="avatar-mini">{isAdmin ? 'A' : (currentUser?.firstName?.[0] || 'U')}</div>
            <div className="profile-info">
              <span className="profile-name">
                {isAdmin ? 'Admin User' : currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Guest Partner'}
              </span>
              <span className="profile-role">
                {isAdmin ? 'Administrator' : currentUser ? `@${currentUser.username}` : 'Not Signed In'}
              </span>
            </div>
          </div>

          {currentLocation && (
            <div className="sidebar-location">
              <MapPin size={12} />
              <span>{currentLocation.name}{currentLocation.state ? `, ${currentLocation.state}` : ''}</span>
            </div>
          )}

          <button className="logout-btn-sidebar" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>

          <div className="sidebar-status">
            <div className="status-dot active" />
            <span>System Online</span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        id="sidebar-toggle"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
