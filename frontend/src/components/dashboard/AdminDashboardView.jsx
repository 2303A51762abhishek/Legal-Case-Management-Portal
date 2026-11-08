import React from 'react';
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
  ExternalLink,
  Plus
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Link } from 'react-router-dom';

export const AdminDashboardView = () => {
  // Demonstration data for Phase 2 UI Inspection
  const stats = [
    { title: 'Total Registered Cases', value: '142', subtitle: 'Across All Courts', icon: Briefcase, color: 'blue', trend: { isPositive: true, text: '12% this month' } },
    { title: 'Active Court Hearings', value: '28', subtitle: 'Scheduled Next 14 Days', icon: Calendar, color: 'amber', trend: { isPositive: true, text: '5 today' } },
    { title: 'Registered Lawyers', value: '18', subtitle: 'Bar Verified Advocates', icon: Users, color: 'navy', trend: { isPositive: true, text: '2 new joined' } },
    { title: 'Pending Legal Tasks', value: '34', subtitle: '6 Critical / Overdue', icon: CheckSquare, color: 'rose', trend: { isPositive: false, text: 'Action required' } },
  ];

  const recentCases = [
    { id: 'LCMS-2026-0104', title: 'Apex Technologies vs. State Revenue Dept', court: 'High Court of Judicature', type: 'Corporate Taxation', lawyer: 'Adv. Mamillapally Abhishek', status: 'Hearing In Progress', date: '08 Nov 2026' },
    { id: 'LCMS-2026-0098', title: 'Rao Estates Ltd vs. Municipal Corp', court: 'City Civil Court', type: 'Property Dispute', lawyer: 'Adv. Priya Deshmukh', status: 'Under Review', date: '06 Nov 2026' },
    { id: 'LCMS-2026-0095', title: 'Union Bank of India vs. V. K. Infra', court: 'Debt Recovery Tribunal', type: 'Commercial Recovery', lawyer: 'Adv. Mamillapally Abhishek', status: 'Judgment Reserved', date: '04 Nov 2026' },
    { id: 'LCMS-2026-0089', title: 'Arjun Reddy vs. Cyberabad Police', court: 'Metropolitan Sessions Court', type: 'Criminal Defense', lawyer: 'Adv. Rajeshwar Sharma', status: 'Filed', date: '01 Nov 2026' },
  ];

  const upcomingHearings = [
    { caseId: 'LCMS-2026-0104', court: 'High Court Bench 4', purpose: 'Final Arguments', date: '10 Nov 2026', time: '10:30 AM', judge: 'Hon. Justice K. Raman' },
    { caseId: 'LCMS-2026-0098', court: 'City Civil Court Hall 2', purpose: 'Evidence Recording', date: '12 Nov 2026', time: '11:45 AM', judge: 'Hon. Judge S. Mehra' },
    { caseId: 'LCMS-2026-0072', court: 'National Green Tribunal', purpose: 'Status Report Filing', date: '14 Nov 2026', time: '02:15 PM', judge: 'Hon. Member V. K. Iyer' },
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
            <span className="text-xs text-blue-300">Phase 2 Design Preview</span>
          </div>
          <h1 className="text-2xl font-bold mt-2 tracking-tight">Legal Firm Overview & Governance</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Monitor real-time case registrations, advocate assignments, hearing schedules, and firm-wide legal operations across all jurisdictional branches.
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

      {/* 4 Statistics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      {/* Grid: Recent Registered Cases & Court Hearing Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Cases Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Registered Cases</h3>
              <p className="text-xs text-slate-500">Live docket tracking with assigned advocates</p>
            </div>
            <Link to="/cases" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View All Cases <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Case Reference</th>
                  <th className="py-3 px-4">Case Title & Court</th>
                  <th className="py-3 px-4">Assigned Lawyer</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {recentCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-900">
                      {c.id}
                      <span className="block text-[10px] text-slate-400 font-sans">{c.date}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900 line-clamp-1">{c.title}</p>
                      <span className="text-[11px] text-slate-500">{c.court} • {c.type}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {c.lawyer}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={c.status} size="sm">
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Court Hearings */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Upcoming Court Hearings</h3>
              <p className="text-xs text-slate-500">Scheduled bench appearances</p>
            </div>
            <Link to="/hearings" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Calendar
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2 space-y-2 flex-1">
            {upcomingHearings.map((h, i) => (
              <div key={i} className="pt-3 first:pt-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-blue-900">{h.caseId}</span>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {h.date}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-1">{h.purpose}</p>
                <div className="text-[11px] text-slate-500 mt-0.5 flex flex-col">
                  <span>{h.court} • {h.time}</span>
                  <span className="italic text-slate-400 mt-0.5">{h.judge}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              to="/hearings"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              Open Full Court Calendar <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
