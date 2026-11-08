import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const LawyerDashboardView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLawyerDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard/lawyer');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching lawyer dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load advocate practice metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyerDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/90 shadow-sm">
        <RefreshCw className="w-10 h-10 text-blue-900 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Synchronizing Assigned Caseload & Hearings...</h3>
        <p className="text-xs text-slate-500 mt-1">Fetching live advocate dockets, court cause lists, and deadlines</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Dashboard Synchronization Failed</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Unable to retrieve live advocate metrics.'}</p>
        <button
          onClick={fetchLawyerDashboard}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, recentCases, upcomingHearings, pendingTasks } = data;

  const statCards = [
    {
      title: 'My Assigned Cases',
      value: String(stats.assignedCases),
      subtitle: `${stats.activeCases} In Active Trial • ${stats.pendingCases} Scrutiny`,
      icon: Briefcase,
      color: 'blue',
    },
    {
      title: 'Court Appearances',
      value: String(stats.upcomingHearings),
      subtitle: 'Scheduled Cause Dates',
      icon: Calendar,
      color: 'amber',
    },
    {
      title: 'Active Case Tasks',
      value: String(stats.pendingTasks),
      subtitle: `${stats.overdueTasks} Overdue • ${stats.urgentTasks} Urgent`,
      icon: Clock,
      color: 'rose',
    },
    {
      title: 'Completed Matters',
      value: String(stats.closedCases),
      subtitle: `${stats.completedTasks} Tasks Finalized`,
      icon: CheckCircle,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
              ADVOCATE PRACTICE DESK
            </span>
            <span className="text-xs text-blue-300">Active Legal Counsel</span>
          </div>
          <h1 className="text-2xl font-bold mt-2 tracking-tight">Assigned Dockets & Court Appearances</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage your assigned litigation cases, track court hearing cause lists, prepare draft pleadings, and review client action deadlines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/hearings"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Cause List</span>
          </Link>
          <Link
            to="/tasks"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Task Board</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      {/* Main Grid: Assigned Cases & Hearings/Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Assigned Cases with Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Assigned Cases & Stage Progress</h3>
              <p className="text-xs text-slate-500">Active dockets where you are designated counsel</p>
            </div>
            <Link
              to="/cases"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              My Cases <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1">
            {recentCases.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No cases currently assigned</div>
            ) : (
              recentCases.map((c) => (
                <div key={c._id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                          {c.caseReference}
                        </span>
                        <Badge variant={c.status} size="sm">
                          {c.status}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{c.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        {c.courtName} • Litigant: <span className="text-slate-700 font-semibold">{c.clientName}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs font-semibold text-blue-900 block">{c.stage}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.progress}% stage completion</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-900 h-1.5 rounded-full" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Hearings & Urgent Tasks */}
        <div className="space-y-6">
          {/* Upcoming Hearings */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Next Court Hearings</h3>
              <Link to="/hearings" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                View All
              </Link>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {upcomingHearings.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">No upcoming hearings scheduled</div>
              ) : (
                upcomingHearings.map((h) => (
                  <div key={h._id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-blue-900">{h.caseReference}</span>
                      <span className="font-mono font-semibold text-slate-600">
                        {h.hearingDate} • {h.hearingTime}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{h.purpose}</p>
                    <p className="text-[10px] text-slate-400">
                      {h.courtroom}, {h.courtName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Action Items & Deadlines</h3>
              <Link to="/tasks" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Task Board
              </Link>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {pendingTasks.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">All tasks completed</div>
              ) : (
                pendingTasks.map((t) => (
                  <div key={t._id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{t.title}</p>
                      <Badge variant={t.priority} size="sm">
                        {t.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono text-blue-900">{t.caseReference}</span>
                      <span className={t.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        Due: {t.deadline}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
