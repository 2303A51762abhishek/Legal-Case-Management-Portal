import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';

export const Navbar = ({ setIsMobileOpen }) => {
  const { user, switchRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Mock Notifications for UI Demonstration
  const mockNotifications = [
    {
      id: 1,
      title: 'Hearing in 48 Hours',
      desc: 'Case CRL-2026-0042 scheduled at High Court Bench 3',
      time: '10 mins ago',
      icon: Calendar,
      color: 'text-blue-500 bg-blue-50'
    },
    {
      id: 2,
      title: 'Urgent Filing Deadline',
      desc: 'Counter Affidavit submission due for Apex Corp Ltd',
      time: '1 hour ago',
      icon: AlertTriangle,
      color: 'text-amber-500 bg-amber-50'
    },
    {
      id: 3,
      title: 'Document Verified',
      desc: 'Vakalatnama registered for Client Rao Vikramaditya',
      time: '3 hours ago',
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50'
    }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-sm h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger + Global search */}
      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 max-w-xl">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cases, hearings, or client records (e.g. CASE-2026)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Role Switcher Pill + Notifications + Profile */}
      <div className="flex items-center space-x-3">
        {/* Quick Role Switcher Pill (Dev & Evaluation Feature) */}
        <div className="relative">
          <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" /> View Role:
            </span>
            {['ADMIN', 'LAWYER', 'CLIENT', 'CLERK'].map((role) => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  user?.role === role
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Mobile Role Switcher Dropdown */}
          <div className="md:hidden relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 rounded-lg text-slate-700"
            >
              <span>{user?.role}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50">
                {['ADMIN', 'LAWYER', 'CLIENT', 'CLERK'].map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      switchRole(role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium ${
                      user?.role === role ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* In-App Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Court & Case Notifications
                </h4>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  3 New
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors flex space-x-3 items-start">
                    <div className={`p-2 rounded-lg ${n.color}`}>
                      <n.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.desc}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current User Pill */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user?.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-300"
          />
          <div className="hidden lg:block text-left">
            <span className="text-xs font-semibold text-slate-800 block leading-tight">{user?.name}</span>
            <span className="text-[10px] text-slate-500 font-medium block">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
