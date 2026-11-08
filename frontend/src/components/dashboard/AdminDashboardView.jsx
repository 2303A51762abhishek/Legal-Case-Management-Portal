import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Calendar,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  FileText,
  ShieldCheck,
  ChevronRight,
  Plus,
  RefreshCw,
  Clock,
  UserCheck,
  Building,
  Gavel,
  Bell,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const AdminDashboardView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard/admin');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.response?.data?.message || 'Failed to connect to firm management metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/90 shadow-sm">
        <RefreshCw className="w-10 h-10 text-blue-900 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Synchronizing Firm Governance Metrics...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to live MongoDB case registries and court rosters</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Dashboard Synchronization Failed</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Unable to retrieve live statistics.'}</p>
        <button
          onClick={fetchAdminDashboard}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, recentCases, upcomingHearings, recentNotifications, visualizations } = data;

  const statCards = [
    {
      title: 'Total Registered Cases',
      value: String(stats.totalCases),
      subtitle: `${stats.activeCases} Active Trials • ${stats.pendingCases} Scrutiny`,
      icon: Briefcase,
      color: 'blue',
    },
    {
      title: 'Upcoming Court Hearings',
      value: String(stats.upcomingHearings),
      subtitle: 'Scheduled Next 14 Days',
      icon: Calendar,
      color: 'amber',
    },
    {
      title: 'Legal Counsel & Staff',
      value: String(stats.totalLawyers + stats.totalClerks),
      subtitle: `${stats.totalLawyers} Advocates • ${stats.totalClerks} Registry Clerks`,
      icon: Users,
      color: 'navy',
    },
    {
      title: 'Outstanding Tasks',
      value: String(stats.overdueTasks + stats.urgentTasks),
      subtitle: `${stats.overdueTasks} Overdue • ${stats.urgentTasks} Urgent`,
      icon: CheckSquare,
      color: 'rose',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
              ADMINISTRATIVE CONTROL PANEL
            </span>
            <span className="text-xs text-blue-300">Live MongoDB Aggregates</span>
          </div>
          <h1 className="text-2xl font-bold mt-2 tracking-tight">Legal Firm Overview & Governance</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Monitor real-time case registrations, advocate caseloads, cause hearing schedules, and firm-wide legal operations across all courts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/cases"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Case</span>
          </Link>
          <Link
            to="/reports"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Generate Reports</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      {/* Firm Portfolio Distribution Bars */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Case Status Distribution Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {visualizations?.caseStatusDistribution?.map((st) => (
            <div key={st.status} className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
              <span className="text-lg font-bold text-slate-900 block">{st.count}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
                {st.status.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Recent Cases & Upcoming Hearings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Registered Cases */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Registered Cases</h3>
              <p className="text-xs text-slate-500">Live docket tracking with assigned advocates</p>
            </div>
            <Link
              to="/cases"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All Cases <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            {recentCases.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No registered cases available</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Case Details</th>
                    <th className="py-3 px-4">Court / Bench</th>
                    <th className="py-3 px-4">Assigned Counsel</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Filing Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentCases.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-900 block">{c.caseReference}</span>
                        <span className="font-bold text-slate-900 block truncate max-w-xs">{c.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{c.clientName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-medium block">{c.courtName}</span>
                        <span className="text-[10px] text-slate-400">{c.caseType}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{c.assignedLawyerName}</td>
                      <td className="py-3 px-4">
                        <Badge variant={c.status} size="sm">
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                        {c.filingDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Court Appearances */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Cause List Queue</h3>
              <p className="text-xs text-slate-500">Upcoming hearings schedule</p>
            </div>
            <Link
              to="/hearings"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Calendar <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1">
            {upcomingHearings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No upcoming hearings scheduled</div>
            ) : (
              upcomingHearings.map((h) => (
                <div key={h._id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {h.caseReference}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 font-mono">
                      {h.hearingDate} • {h.hearingTime}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{h.purpose}</p>
                  <p className="text-[11px] text-slate-500">
                    {h.judgeName} — {h.courtroom}, {h.courtName}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
