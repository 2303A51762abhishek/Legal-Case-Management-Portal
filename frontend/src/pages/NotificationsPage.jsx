import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Briefcase,
  CheckSquare,
  Clock,
  Filter,
  RefreshCw,
  CheckCheck,
  X,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedFilter === 'UNREAD') {
        params.unreadOnly = 'true';
      } else if (selectedFilter !== 'ALL') {
        params.type = selectedFilter;
      }

      const res = await api.get('/notifications', { params });
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedFilter]);

  // Mark single as read
  const handleMarkAsRead = async (notifId) => {
    try {
      const res = await api.patch(`/notifications/${notifId}/read`);
      if (res.data?.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
        );
        setUnreadCount(res.data.data.unreadCount);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.patch('/notifications/read-all');
      if (res.data?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        setSuccessMsg('All notifications marked as read.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err.response?.data?.message || 'Failed to mark all as read.');
    }
  };

  // Get icon and color by type
  const getTypeStyling = (type) => {
    switch (type) {
      case 'HEARING_ALERT':
        return {
          icon: Calendar,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badgeText: 'Hearing Notice',
        };
      case 'DEADLINE_ALERT':
        return {
          icon: AlertTriangle,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          badgeText: 'Deadline Warning',
        };
      case 'TASK_ASSIGNMENT':
        return {
          icon: CheckSquare,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          badgeText: 'Task Assigned',
        };
      case 'CASE_UPDATE':
        return {
          icon: Briefcase,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badgeText: 'Case Update',
        };
      default:
        return {
          icon: Bell,
          color: 'text-slate-600 bg-slate-50 border-slate-200',
          badgeText: 'Notice',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Bell className="w-7 h-7 text-blue-900" />
            <span>Court & Cause Notification Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cause alerts, 48-hour hearing warnings, filing deadlines, and case docket updates
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-blue-900" />
              <span>Mark All as Read</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            className="p-2 border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
            title="Refresh Notifications"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4 text-rose-500" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-sm flex flex-wrap items-center gap-1.5">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'UNREAD', label: `Unread (${unreadCount})` },
          { id: 'HEARING_ALERT', label: 'Hearings' },
          { id: 'DEADLINE_ALERT', label: 'Deadlines' },
          { id: 'TASK_ASSIGNMENT', label: 'Tasks' },
          { id: 'CASE_UPDATE', label: 'Case Filings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedFilter === tab.id
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
          <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Checking court registries and dockets...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/90 shadow-sm">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No notifications found</p>
          <p className="text-xs text-slate-400 mt-1">
            You are all caught up! New hearing cause lists and filing deadlines will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const styling = getTypeStyling(n.type);
            const IconComponent = styling.icon;
            const timeAgo = n.createdAt
              ? new Date(n.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <div
                key={n._id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  n.isRead
                    ? 'bg-white border-slate-200/80'
                    : 'bg-blue-50/20 border-blue-200 shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-3 flex-1">
                  {/* Type Icon */}
                  <div className={`p-2.5 rounded-xl border shrink-0 ${styling.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                        {styling.badgeText}
                      </span>

                      {n.relatedCase && (
                        <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                          {n.relatedCase.caseReference}
                        </span>
                      )}

                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-100"></span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* Mark as read button */}
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    className="self-end sm:self-center px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/60 flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Read</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
