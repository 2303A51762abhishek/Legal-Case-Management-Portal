import React from 'react';
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
  BookOpen
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Link } from 'react-router-dom';

export const ClerkDashboardView = () => {
  const stats = [
    { title: 'Cases Registered Today', value: '6', subtitle: 'Docket assigned', icon: FilePlus, color: 'blue' },
    { title: "Today's Cause List", value: '11', subtitle: 'Court Appearances', icon: Calendar, color: 'amber' },
    { title: 'New Client Intakes', value: '4', subtitle: 'Awaiting Verification', icon: Users, color: 'navy' },
    { title: 'Registry Tasks Pending', value: '8', subtitle: 'Stamp & Scrutiny', icon: CheckSquare, color: 'rose' },
  ];

  const dailyCauseList = [
    { item: '1', caseId: 'LCMS-2026-0104', court: 'High Court Bench 4', time: '10:30 AM', advocate: 'Adv. Mamillapally Abhishek', purpose: 'Final Arguments', courtroom: 'Courtroom #402' },
    { item: '2', caseId: 'LCMS-2026-0098', court: 'City Civil Court', time: '11:15 AM', advocate: 'Adv. Priya Deshmukh', purpose: 'Written Statement Verification', courtroom: 'Hall #2' },
    { item: '3', caseId: 'LCMS-2026-0089', court: 'Metropolitan Sessions', time: '02:00 PM', advocate: 'Adv. Rajeshwar Sharma', purpose: 'Bail Petition Review', courtroom: 'Room #108' },
  ];

  const filingQueue = [
    { intakeId: 'INTK-902', client: 'Dr. Srinivas Murthy', subject: 'Medical Malpractice Defense', date: '08 Nov, 09:30 AM', status: 'Pending Scrutiny' },
    { intakeId: 'INTK-901', client: 'GreenField Agro Infra', subject: 'Land Acquisition Appeal', date: '07 Nov, 04:15 PM', status: 'Documents Verified' },
    { intakeId: 'INTK-899', client: 'Smt. Lakshmi Devi', subject: 'Partition Suit Declaration', date: '07 Nov, 02:00 PM', status: 'Drafting in Progress' },
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
            <span className="text-xs text-amber-200">Clerk: Suresh Chandra</span>
          </div>
          <h1 className="text-2xl font-bold mt-2 tracking-tight">Court Hearing Rosters & Case Intake</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Record case filings, maintain the daily court cause list, assign hearing time slots, and verify client docket submissions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/cases"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Intake New Case</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Cause List</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      {/* Grid: Daily Cause List & Case Intake Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Cause List Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Daily Court Cause List (Today)</h3>
              <p className="text-xs text-slate-500">Ordered court hearing docket by time slot</p>
            </div>
            <Link to="/hearings" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              Full Schedule <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Item #</th>
                  <th className="py-3 px-4">Case Reference</th>
                  <th className="py-3 px-4">Court & Room</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Counsel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {dailyCauseList.map((row) => (
                  <tr key={row.item} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-400">#{row.item}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                      {row.caseId}
                      <span className="block text-[11px] font-sans font-normal text-slate-500">{row.purpose}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{row.court}</span>
                      <span className="text-[11px] text-slate-500">{row.courtroom}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-700">
                      {row.time}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {row.advocate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Intake Queue */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Filing Intake Queue</h3>
              <p className="text-xs text-slate-500">Submissions pending docket number</p>
            </div>
            <Link to="/cases" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Register
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2 space-y-2 flex-1">
            {filingQueue.map((item) => (
              <div key={item.intakeId} className="pt-3 first:pt-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-800">{item.intakeId}</span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">{item.client}</p>
                <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between">
                  <span>{item.subject}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">{item.date}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              to="/cases"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              Process Intake Forms <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkDashboardView;
