import React, { useState, useEffect } from 'react';
import {
  FilePlus,
  Calendar,
  Users,
  CheckSquare,
  Clock,
  Printer,
  ChevronRight,
  PlusCircle,
  FileCheck2,
  RefreshCw,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const ClerkDashboardView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClerkDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard/clerk');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching clerk dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load registry clerk metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClerkDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/90 shadow-sm">
        <RefreshCw className="w-10 h-10 text-amber-600 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Synchronizing Registry Rosters & Cause Lists...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to live court intake queue and registry tasks</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Dashboard Synchronization Failed</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Unable to retrieve registry data.'}</p>
        <button
          onClick={fetchClerkDashboard}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, dailyCauseList, recentRegistrations, assignedTasks } = data;

  const statCards = [
    {
      title: 'Cases in Registry',
      value: String(stats.totalCases),
      subtitle: `${stats.casesRegisteredToday} Registered Today`,
      icon: FilePlus,
      color: 'blue',
    },
    {
      title: "Upcoming Cause Rosters",
      value: String(stats.upcomingHearings),
      subtitle: `${stats.hearingsToday} Scheduled for Today`,
      icon: Calendar,
      color: 'amber',
    },
    {
      title: 'Registry Documents',
      value: String(stats.totalDocumentsUploaded),
      subtitle: 'Stored in Document Vault',
      icon: FolderOpen,
      color: 'navy',
    },
    {
      title: 'Assigned Registry Tasks',
      value: String(stats.pendingRegistryTasks),
      subtitle: `${stats.overdueTasks} Overdue Tasks`,
      icon: CheckSquare,
      color: 'rose',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Clerk Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
              REGISTRY & BENCH CLERK DESK
            </span>
            <span className="text-xs text-amber-200">Daily Cause Roster & Case Intake</span>
          </div>
          <h1 className="text-2xl font-bold mt-2 tracking-tight">Court Cause Lists & Intake Registry</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Record newly instituted legal dockets, schedule court cause lists without conflicts, verify filings, and manage procedural registry tasks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/cases"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Docket</span>
          </Link>
          <Link
            to="/hearings"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Cause List</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      {/* Main Grid: Daily Cause List & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Court Cause List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Active Cause List Roster</h3>
              <p className="text-xs text-slate-500">Scheduled hearings with presiding judges and benches</p>
            </div>
            <Link
              to="/hearings"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              Full Calendar <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            {dailyCauseList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No hearings currently scheduled</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 text-center">Item</th>
                    <th className="py-3 px-4">Case Reference</th>
                    <th className="py-3 px-4">Court / Bench</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Presiding Judge</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {dailyCauseList.map((h) => (
                    <tr key={h._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        #{h.itemNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-900 block">{h.caseReference}</span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-xs">{h.purpose}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{h.courtroom}</span>
                        <span className="text-[10px] text-slate-400">{h.courtName}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-slate-900 block">{h.hearingDate}</span>
                        <span className="text-[11px] text-amber-700 font-bold">{h.hearingTime}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{h.judgeName}</td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={h.status} size="sm">
                          {h.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Case Intake & Tasks */}
        <div className="space-y-6">
          {/* Recent Registrations */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Case Intake</h3>
              <Link to="/cases" className="text-xs font-semibold text-amber-700 hover:text-amber-900">
                All Cases
              </Link>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {recentRegistrations.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">No recent filings</div>
              ) : (
                recentRegistrations.map((c) => (
                  <div key={c._id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-900">{c.caseReference}</span>
                      <span className="font-mono text-[10px] text-slate-400">{c.filingDate}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{c.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {c.courtName} • <span className="text-slate-700">{c.clientName}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assigned Registry Tasks */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Registry Action Tasks</h3>
              <Link to="/tasks" className="text-xs font-semibold text-amber-700 hover:text-amber-900">
                View All
              </Link>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {assignedTasks.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">No pending tasks for clerk</div>
              ) : (
                assignedTasks.map((t) => (
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
