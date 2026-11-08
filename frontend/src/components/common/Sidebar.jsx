import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Scale,
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  CheckSquare,
  FileText,
  Shield,
  FolderOpen,
  Bell,
  LogOut,
  ChevronRight,
  Gavel,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dynamic Navigation Items filtered by User Role
  const getNavItems = () => {
    const role = user?.role || 'ADMIN';

    const commonTop = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ];

    if (role === 'ADMIN') {
      return [
        ...commonTop,
        { name: 'User Management', path: '/users', icon: Users, badge: 'Admin' },
        { name: 'Client Directory', path: '/clients', icon: Users },
        { name: 'All Legal Cases', path: '/cases', icon: Briefcase },
        { name: 'Court Hearings', path: '/hearings', icon: Calendar },
        { name: 'Task Board', path: '/tasks', icon: CheckSquare },
        { name: 'Document Vault', path: '/documents', icon: FolderOpen },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Reports & Analytics', path: '/reports', icon: FileText, badge: '4 Reports' },
      ];
    }

    if (role === 'LAWYER') {
      return [
        ...commonTop,
        { name: 'My Assigned Cases', path: '/cases', icon: Briefcase },
        { name: 'Assigned Clients', path: '/clients', icon: Users },
        { name: 'Hearing Schedule', path: '/hearings', icon: Calendar },
        { name: 'Document Vault', path: '/documents', icon: FolderOpen },
        { name: 'Deadlines & Tasks', path: '/tasks', icon: CheckSquare },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Case Analytics', path: '/reports', icon: FileText },
      ];
    }

    if (role === 'CLIENT') {
      return [
        ...commonTop,
        { name: 'My Legal Cases', path: '/cases', icon: Briefcase },
        { name: 'Upcoming Hearings', path: '/hearings', icon: Calendar },
        { name: 'Case Documents', path: '/documents', icon: FolderOpen },
        { name: 'Action Items', path: '/tasks', icon: CheckSquare },
        { name: 'Court Notices', path: '/notifications', icon: Bell },
      ];
    }

    if (role === 'CLERK') {
      return [
        ...commonTop,
        { name: 'Case Registration', path: '/cases', icon: Briefcase, badge: 'New' },
        { name: 'Client Management', path: '/clients', icon: Users },
        { name: 'Court Daily Cause List', path: '/hearings', icon: Calendar },
        { name: 'Registry Tasks', path: '/tasks', icon: CheckSquare },
        { name: 'Document Vault', path: '/documents', icon: FolderOpen },
        { name: 'Notifications', path: '/notifications', icon: Bell },
        { name: 'Hearing Reports', path: '/reports', icon: FileText },
      ];
    }

    return commonTop;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Scale className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                JurisFlow <span className="text-[10px] font-semibold tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">PORTAL</span>
              </span>
              <p className="text-[11px] text-slate-400">Legal Case & Hearing System</p>
            </div>
          </div>
        </div>

        {/* University Project Info Pill */}
        <div className="mx-4 mt-4 p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] leading-relaxed text-blue-200">
          <div className="flex items-center gap-1.5 font-semibold text-blue-300 mb-1">
            <Gavel className="w-3.5 h-3.5 text-amber-400" />
            <span>Academic Project 2026–2027</span>
          </div>
          <p className="text-slate-400">Student: <strong className="text-slate-200">M. Abhishek</strong></p>
          <p className="text-slate-400">Roll No: <span className="text-slate-300 font-mono">2303A51762</span></p>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Menu Navigation ({user?.role})
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Current Active User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              className="w-10 h-10 rounded-full border-2 border-blue-500/50 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <div className="mt-0.5">
                <Badge variant={user?.role} size="sm">
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border border-slate-800 hover:border-rose-900/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
