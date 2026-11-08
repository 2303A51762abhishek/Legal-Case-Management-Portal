import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Briefcase,
  CheckSquare,
  Users,
  Filter,
  BarChart3
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('case-status');

  const tabs = [
    { id: 'case-status', label: '1. Case Status Report', icon: Briefcase },
    { id: 'hearing-calendar', label: '2. Hearing Calendar Report', icon: Calendar },
    { id: 'pending-tasks', label: '3. Pending Tasks Report', icon: CheckSquare },
    { id: 'client-summary', label: '4. Client Case Summary', icon: Users },
  ];

  const handleExportCSV = () => {
    alert(`Exporting ${activeTab} to CSV format... (Full export engine active in backend Phase 9)`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Legal Reports & Analytics Engine</h1>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory university course reports generated from judicial management dockets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-900 text-blue-950 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Report 1: Case Status Report */}
      {activeTab === 'case-status' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Case Status Distribution Report</h3>
              <p className="text-xs text-slate-500">Breakdown of legal cases grouped by status</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Total Active Portfolio: 142 Cases
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <span className="text-2xl font-bold text-blue-900">58</span>
              <p className="text-xs font-semibold text-blue-700 mt-1">Hearing In Progress</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
              <span className="text-2xl font-bold text-indigo-900">32</span>
              <p className="text-xs font-semibold text-indigo-700 mt-1">Under Review</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <span className="text-2xl font-bold text-amber-900">24</span>
              <p className="text-xs font-semibold text-amber-700 mt-1">Judgment Reserved</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center">
              <span className="text-2xl font-bold text-slate-800">28</span>
              <p className="text-xs font-semibold text-slate-600 mt-1">Closed / Concluded</p>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Hearing Calendar Report */}
      {activeTab === 'hearing-calendar' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hearing Calendar Report</h3>
              <p className="text-xs text-slate-500">Chronological hearings roster with counsel & courtroom details</p>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              28 Upcoming Hearings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Case Reference</th>
                  <th className="py-2.5 px-3">Court & Judge</th>
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Advocate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">10 Nov 2026, 10:30 AM</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-900">LCMS-2026-0104</td>
                  <td className="py-3 px-3">High Court Bench 4 (Hon. Justice K. Raman)</td>
                  <td className="py-3 px-3">Final Arguments</td>
                  <td className="py-3 px-3 font-medium">Adv. Mamillapally Abhishek</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">12 Nov 2026, 11:45 AM</td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-900">LCMS-2026-0098</td>
                  <td className="py-3 px-3">City Civil Court Hall 2 (Hon. Judge S. Mehra)</td>
                  <td className="py-3 px-3">Evidence Recording</td>
                  <td className="py-3 px-3 font-medium">Adv. Priya Deshmukh</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Pending Tasks Report */}
      {activeTab === 'pending-tasks' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pending Tasks & Deadlines Report</h3>
              <p className="text-xs text-slate-500">Overdue, critical, and upcoming litigation milestones</p>
            </div>
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              6 Overdue / Critical
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-center">
              <span className="text-2xl font-bold text-rose-700">6</span>
              <p className="text-xs font-semibold text-rose-800 mt-1">Overdue / Action Needed</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <span className="text-2xl font-bold text-amber-800">18</span>
              <p className="text-xs font-semibold text-amber-900 mt-1">Pending In Progress</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <span className="text-2xl font-bold text-emerald-800">42</span>
              <p className="text-xs font-semibold text-emerald-900 mt-1">Completed This Term</p>
            </div>
          </div>
        </div>
      )}

      {/* Report 4: Client Case Summary */}
      {activeTab === 'client-summary' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Client Case Summary Report</h3>
              <p className="text-xs text-slate-500">Consolidated overview of client caseloads and appearances</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Client Name</th>
                  <th className="py-2.5 px-3">Total Cases</th>
                  <th className="py-2.5 px-3">Active</th>
                  <th className="py-2.5 px-3">Closed</th>
                  <th className="py-2.5 px-3">Next Appearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">Vikramaditya Rao (Zenith Tech)</td>
                  <td className="py-3 px-3 font-bold">2</td>
                  <td className="py-3 px-3 text-blue-700 font-semibold">2</td>
                  <td className="py-3 px-3 text-slate-500">0</td>
                  <td className="py-3 px-3 text-amber-800 font-medium">10 Nov 2026</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">Union Bank of India</td>
                  <td className="py-3 px-3 font-bold">4</td>
                  <td className="py-3 px-3 text-blue-700 font-semibold">3</td>
                  <td className="py-3 px-3 text-slate-500">1</td>
                  <td className="py-3 px-3 text-amber-800 font-medium">18 Nov 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
