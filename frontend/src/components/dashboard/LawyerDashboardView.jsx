import React from 'react';
import {
  Briefcase,
  Calendar,
  Clock,
  FileCheck,
  Upload,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  ChevronRight,
  Plus
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Link } from 'react-router-dom';

export const LawyerDashboardView = () => {
  const stats = [
    { title: 'My Active Cases', value: '14', subtitle: 'Assigned as Lead Counsel', icon: Briefcase, color: 'blue', trend: { isPositive: true, text: '3 in final stage' } },
    { title: 'Court Appearances', value: '4', subtitle: 'Scheduled this week', icon: Calendar, color: 'amber', trend: { isPositive: true, text: 'Next on 10 Nov' } },
    { title: 'Drafted Briefs & Orders', value: '38', subtitle: 'Stored in Document Vault', icon: FolderOpen, color: 'navy' },
    { title: 'Pending Case Tasks', value: '7', subtitle: '2 Due within 24 Hours', icon: Clock, color: 'rose', trend: { isPositive: false, text: 'Urgent filing' } },
  ];

  const assignedCases = [
    {
      id: 'LCMS-2026-0104',
      title: 'Apex Technologies vs. State Revenue Dept',
      court: 'High Court Bench 4',
      client: 'Vikramaditya Rao (Director)',
      stage: 'Final Arguments',
      progress: 80,
      status: 'Hearing In Progress',
      nextHearing: '10 Nov 2026, 10:30 AM'
    },
    {
      id: 'LCMS-2026-0095',
      title: 'Union Bank of India vs. V. K. Infra Projects',
      court: 'Debt Recovery Tribunal - II',
      client: 'Union Bank of India (Zonal Office)',
      stage: 'Order Reserved',
      progress: 95,
      status: 'Judgment Reserved',
      nextHearing: '18 Nov 2026, 02:00 PM'
    },
    {
      id: 'LCMS-2026-0081',
      title: 'K. S. Rao Memorial Trust vs. Land Registrar',
      court: 'City Civil Court Courtroom 3',
      client: 'K. S. Charitable Trust',
      stage: 'Pleadings & Cross Examination',
      progress: 50,
      status: 'Under Review',
      nextHearing: '24 Nov 2026, 11:00 AM'
    }
  ];

  const lawyerTasks = [
    { title: 'Draft Rejoinder Affidavit for LCMS-2026-0104', due: 'Tomorrow, 5:00 PM', priority: 'urgent', client: 'Apex Technologies' },
    { title: 'Examine Cross-Examination Witness List', due: '12 Nov 2026', priority: 'high', client: 'K. S. Rao Trust' },
    { title: 'Client Conference with Union Bank Officers', due: '15 Nov 2026', priority: 'medium', client: 'Union Bank' },
  ];

  return (
    <div className="space-y-6">
      {/* Lawyer Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500 text-white uppercase tracking-wide">
              ADVOCATE WORKSPACE
            </span>
            <span className="text-xs text-blue-200">Counsel: Adv. Mamillapally Abhishek</span>
          </div>
          <h1 className="text-2xl font-bold mt-2 tracking-tight">Active Litigation Docket & Deadlines</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage your assigned briefs, schedule court appearances, upload client evidence, and track filing milestones.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/hearings"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Hearing</span>
          </Link>
          <Link
            to="/tasks"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Add Task</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      {/* Main Grid: My Active Cases & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Cases List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Assigned Cases & Stage Progress</h3>
            <Link to="/cases" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              All Assigned Cases <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {assignedCases.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:border-blue-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-900">{c.id}</span>
                      <Badge variant={c.status} size="sm">{c.status}</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{c.title}</h4>
                    <p className="text-xs text-slate-500">{c.court} • Client: <strong className="text-slate-700">{c.client}</strong></p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Stage: <strong>{c.stage}</strong></span>
                      <span className="font-bold text-blue-700">{c.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Next Court Appearance</span>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {c.nextHearing}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items & Deadlines */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Legal Deadlines & Tasks</h3>
              <p className="text-xs text-slate-500">Filings requiring counsel action</p>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Board
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-3 space-y-3 flex-1">
            {lawyerTasks.map((t, idx) => (
              <div key={idx} className="pt-3 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800 leading-snug">{t.title}</p>
                  <Badge variant={t.priority} size="sm">{t.priority}</Badge>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Client: {t.client}</span>
                  <span className="font-medium text-rose-600">Due: {t.due}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Quick Reminder</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Always ensure case documents are certified and timestamped before attending virtual or in-person hearings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerDashboardView;
