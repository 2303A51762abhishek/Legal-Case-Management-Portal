import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';

export const Navbar = ({ setIsMobileOpen }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // In-app notifications
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
            placeholder="Search cases, hearings, or client records (e.g. LCMS-2026)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Right Controls: Notifications + Profile */}
      <div className="flex items-center space-x-4">
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

        {/* Current Authenticated User Badge */}
        <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center border border-slate-300">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-800 block leading-tight">{user?.name || 'User'}</span>
            <div className="mt-0.5">
              <Badge variant={user?.role || 'CLIENT'} size="sm">
                {user?.role || 'CLIENT'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
