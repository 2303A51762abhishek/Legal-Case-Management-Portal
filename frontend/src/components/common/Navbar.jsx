import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Briefcase,
  CheckSquare,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import api from '../../services/api';

export const Navbar = ({ setIsMobileOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch live notifications
  const fetchNavbarNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications?unreadOnly=true');
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      // Quiet fail on background poll
    }
  };

  useEffect(() => {
    fetchNavbarNotifications();
    const interval = setInterval(fetchNavbarNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [user]);

  // Mark all read from navbar
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Get icon by notification type
  const getIcon = (type) => {
    switch (type) {
      case 'HEARING_ALERT':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'DEADLINE_ALERT':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'TASK_ASSIGNMENT':
        return <CheckSquare className="w-4 h-4 text-purple-600" />;
      case 'CASE_UPDATE':
        return <Briefcase className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

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
            title="Court Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.2 min-w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-900" />
                  <span>Cause & Docket Alerts</span>
                </h4>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    All caught up
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1 opacity-70" />
                    <p className="text-xs font-semibold text-slate-700">No unread alerts</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cause list notices and deadline alerts will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className="p-3 hover:bg-slate-50 transition-colors flex space-x-3 items-start"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-snug">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 flex items-center justify-between px-3">
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-slate-600 hover:text-blue-900"
                  >
                    Mark all read
                  </button>
                ) : <span />}

                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications');
                  }}
                  className="text-[11px] font-bold text-blue-900 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>View All Center</span>
                  <ExternalLink className="w-3 h-3" />
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
            <span className="text-xs font-semibold text-slate-800 block leading-tight">
              {user?.name || 'User'}
            </span>
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
