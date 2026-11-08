import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  CheckSquare,
  Users,
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  Gavel,
  ChevronRight,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const ReportsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('case-status');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Report Data States
  const [caseStatusData, setCaseStatusData] = useState({ summary: {}, cases: [] });
  const [hearingCalendarData, setHearingCalendarData] = useState({ summary: {}, hearings: [] });
  const [pendingTasksData, setPendingTasksData] = useState({ summary: {}, tasks: [] });
  const [clientSummaryData, setClientSummaryData] = useState({ summary: {}, clients: [] });

  // Filters State
  const [filters, setFilters] = useState({
    status: 'ALL',
    priority: 'ALL',
    search: '',
    court: '',
    startDate: '',
    endDate: '',
  });

  const tabs = [
    { id: 'case-status', label: '1. Case Status Report', icon: Briefcase },
    { id: 'hearing-calendar', label: '2. Hearing Calendar Report', icon: Calendar },
    { id: 'pending-tasks', label: '3. Pending Tasks Report', icon: CheckSquare },
    { id: 'client-summary', label: '4. Client Case Summary', icon: Users },
  ];

  // Fetch Report Data based on active tab
  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.status && filters.status !== 'ALL') params.status = filters.status;
      if (filters.priority && filters.priority !== 'ALL') params.priority = filters.priority;
      if (filters.search) params.search = filters.search.trim();
      if (filters.court) params.court = filters.court.trim();
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      if (activeTab === 'case-status') {
        const res = await api.get('/reports/case-status', { params });
        if (res.data?.success) setCaseStatusData(res.data.data);
      } else if (activeTab === 'hearing-calendar') {
        const res = await api.get('/reports/hearing-calendar', { params });
        if (res.data?.success) setHearingCalendarData(res.data.data);
      } else if (activeTab === 'pending-tasks') {
        const res = await api.get('/reports/pending-tasks', { params });
        if (res.data?.success) setPendingTasksData(res.data.data);
      } else if (activeTab === 'client-summary') {
        const res = await api.get('/reports/client-summary', { params });
        if (res.data?.success) setClientSummaryData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || 'Failed to generate report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset status/priority when switching tabs
    setFilters((prev) => ({ ...prev, status: 'ALL', priority: 'ALL' }));
  }, [activeTab]);

  useEffect(() => {
    fetchReport();
  }, [activeTab, filters.status, filters.priority]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  // Helper to escape CSV cell values
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // CSV Export Engine
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = '';
    const today = new Date().toISOString().split('T')[0];

    if (activeTab === 'case-status') {
      filename = `JurisFlow_Case_Status_Report_${today}.csv`;
      headers = [
        'Case Reference',
        'Case Title',
        'Client Name',
        'Assigned Lawyer',
        'Court Name',
        'Courtroom',
        'Case Type',
        'Filing Date',
        'Status',
        'Stage',
        'Priority',
        'Progress %',
        'Last Hearing Date',
        'Next Hearing Date',
      ];
      rows = caseStatusData.cases.map((c) => [
        escapeCSV(c.caseReference),
        escapeCSV(c.title),
        escapeCSV(c.clientName),
        escapeCSV(c.assignedLawyerName),
        escapeCSV(c.courtName),
        escapeCSV(c.courtroom),
        escapeCSV(c.caseType),
        escapeCSV(c.filingDate),
        escapeCSV(c.status),
        escapeCSV(c.stage),
        escapeCSV(c.priority),
        escapeCSV(`${c.progress}%`),
        escapeCSV(c.lastHearingDate),
        escapeCSV(c.nextHearingDate),
      ]);
    } else if (activeTab === 'hearing-calendar') {
      filename = `JurisFlow_Hearing_Calendar_Report_${today}.csv`;
      headers = [
        'Hearing Date',
        'Time',
        'Duration (Mins)',
        'Case Reference',
        'Case Title',
        'Client Name',
        'Assigned Lawyer',
        'Court Name',
        'Courtroom',
        'Judge Name',
        'Purpose',
        'Status',
        'Next Hearing Date',
      ];
      rows = hearingCalendarData.hearings.map((h) => [
        escapeCSV(h.hearingDate),
        escapeCSV(h.hearingTime),
        escapeCSV(h.durationMinutes),
        escapeCSV(h.caseReference),
        escapeCSV(h.caseTitle),
        escapeCSV(h.clientName),
        escapeCSV(h.assignedLawyerName),
        escapeCSV(h.courtName),
        escapeCSV(h.courtroom),
        escapeCSV(h.judgeName),
        escapeCSV(h.purpose),
        escapeCSV(h.status),
        escapeCSV(h.nextHearingDate),
      ]);
    } else if (activeTab === 'pending-tasks') {
      filename = `JurisFlow_Pending_Tasks_Report_${today}.csv`;
      headers = [
        'Task Title',
        'Case Reference',
        'Case Title',
        'Assigned User',
        'Created By',
        'Priority',
        'Deadline',
        'Status',
        'Days Remaining',
        'Is Overdue',
      ];
      rows = pendingTasksData.tasks.map((t) => [
        escapeCSV(t.title),
        escapeCSV(t.caseReference),
        escapeCSV(t.caseTitle),
        escapeCSV(t.assignedUserName),
        escapeCSV(t.createdByName),
        escapeCSV(t.priority),
        escapeCSV(t.deadline),
        escapeCSV(t.status),
        escapeCSV(t.daysRemaining),
        escapeCSV(t.isOverdue ? 'YES' : 'NO'),
      ]);
    } else if (activeTab === 'client-summary') {
      filename = `JurisFlow_Client_Summary_Report_${today}.csv`;
      headers = [
        'Client Name',
        'Organization',
        'Email',
        'Phone',
        'City',
        'Assigned Advocate',
        'Total Cases',
        'Active Cases',
        'Closed Cases',
        'Status',
      ];
      rows = clientSummaryData.clients.map((cl) => [
        escapeCSV(cl.name),
        escapeCSV(cl.organization),
        escapeCSV(cl.email),
        escapeCSV(cl.phone),
        escapeCSV(cl.city),
        escapeCSV(cl.assignedLawyerName),
        escapeCSV(cl.totalCases),
        escapeCSV(cl.activeCases),
        escapeCSV(cl.closedCases),
        escapeCSV(cl.status),
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Printable PDF Export Engine
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print-Only Header (Visible only when printing or saving as PDF) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              JurisFlow Legal Case & Court Hearing Management Portal
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Official University Course Report • B.Tech IV Year I Semester (2026–2027)
            </p>
            <p className="text-xs font-semibold text-blue-900 mt-1">
              Student: MAMILLAPALLY ABHISHEK • Roll Number: 2303A51762 • Subject: DevOps & Full Stack
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Generated: {new Date().toLocaleString('en-IN')}</p>
            <p className="font-bold text-slate-800 uppercase mt-1">
              {tabs.find((t) => t.id === activeTab)?.label}
            </p>
          </div>
        </div>
      </div>

      {/* Screen Page Header (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-7 h-7 text-blue-900" />
            <span>Reports & Analytics Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time MongoDB dockets, cause schedules, task distributions, and client caseload analysis
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchReport}
            className="p-2 border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
            title="Refresh Report"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-blue-900" />
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

      {/* Report Selection Tabs (Hidden on print) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1 print:hidden">
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

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 1: CASE STATUS REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'case-status' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Cases</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {caseStatusData.summary?.totalCases || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/20">
              <p className="text-[11px] font-semibold text-blue-700 uppercase">Active Cases</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {caseStatusData.summary?.activeCases || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
              <p className="text-[11px] font-semibold text-amber-700 uppercase">Under Review / Pending</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {caseStatusData.summary?.pendingCases || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase">Closed / Decided</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {caseStatusData.summary?.closedCases || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-purple-50/20">
              <p className="text-[11px] font-semibold text-purple-700 uppercase">High Priority</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {caseStatusData.summary?.highPriorityCases || 0}
              </p>
            </div>
          </div>

          {/* Filters Bar (Hidden on print) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="FILED">Filed</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="HEARING_IN_PROGRESS">Hearing In Progress</option>
                <option value="JUDGMENT_RESERVED">Judgment Reserved</option>
                <option value="CLOSED">Closed</option>
                <option value="APPEALED">Appealed</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search case reference, title, court..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-800"
              />
            </form>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
              <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Generating Case Status Distribution Report...</p>
            </div>
          ) : caseStatusData.cases?.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No matching cases found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-3">Reference</th>
                      <th className="py-3 px-3">Case Title & Type</th>
                      <th className="py-3 px-3">Litigant Client</th>
                      <th className="py-3 px-3">Assigned Counsel</th>
                      <th className="py-3 px-3">Court / Bench</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Stage & Progress</th>
                      <th className="py-3 px-3">Last Hearing</th>
                      <th className="py-3 px-3">Next Scheduled Hearing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {caseStatusData.cases.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                          {c.caseReference}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{c.title}</p>
                          <span className="text-[10px] text-slate-500 font-medium">{c.caseType}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {c.clientName}
                          {c.clientOrganization && (
                            <span className="text-[10px] text-slate-400 block">{c.clientOrganization}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700">{c.assignedLawyerName}</td>
                        <td className="py-3 px-3">
                          <span className="text-slate-800 font-medium block">{c.courtName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.courtroom}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge variant={c.status} size="sm">
                            {c.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-semibold text-slate-700 block">{c.stage}</span>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-blue-900 h-1.5 rounded-full"
                              style={{ width: `${c.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            {c.progress}% complete
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {c.lastHearingDate}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`font-mono text-[11px] font-bold ${
                              c.nextHearingDate !== 'Not Scheduled'
                                ? 'text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200'
                                : 'text-slate-400'
                            }`}
                          >
                            {c.nextHearingDate}
                          </span>
                          {c.nextHearingTime && (
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {c.nextHearingTime} ({c.nextHearingCourtroom})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 2: HEARING CALENDAR REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'hearing-calendar' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Hearings</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {hearingCalendarData.summary?.totalHearings || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/20">
              <p className="text-[11px] font-semibold text-blue-700 uppercase">Scheduled Cause</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {hearingCalendarData.summary?.scheduledHearings || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase">Completed</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {hearingCalendarData.summary?.completedHearings || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
              <p className="text-[11px] font-semibold text-amber-700 uppercase">Adjourned</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {hearingCalendarData.summary?.adjournedHearings || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-purple-50/20">
              <p className="text-[11px] font-semibold text-purple-700 uppercase">Active Benches</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {hearingCalendarData.summary?.courtComplexCount || 0}
              </p>
            </div>
          </div>

          {/* Filters Bar (Hidden on print) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
              >
                <option value="ALL">All Cause Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="ADJOURNED">Adjourned</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search case reference or court..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-800"
              />
            </form>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
              <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Generating Hearing Calendar Report...</p>
            </div>
          ) : hearingCalendarData.hearings?.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No court hearings found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">Case Reference</th>
                      <th className="py-3 px-3">Case Title</th>
                      <th className="py-3 px-3">Client</th>
                      <th className="py-3 px-3">Presiding Judge & Bench</th>
                      <th className="py-3 px-3">Counsel</th>
                      <th className="py-3 px-3">Hearing Purpose</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {hearingCalendarData.hearings.map((h) => (
                      <tr key={h._id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 block">{h.hearingDate}</span>
                          <span className="text-[11px] text-blue-900 font-medium">
                            {h.hearingTime} ({h.durationMinutes}m)
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                          {h.caseReference}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{h.caseTitle}</td>
                        <td className="py-3 px-3 text-slate-700">{h.clientName}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{h.judgeName}</span>
                          <span className="text-[11px] text-slate-500">
                            {h.courtroom}, {h.courtName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{h.assignedLawyerName}</td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs">{h.purpose}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge variant={h.status} size="sm">
                            {h.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 3: PENDING TASKS REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'pending-tasks' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Outstanding Tasks</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {pendingTasksData.summary?.totalOutstanding || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
              <p className="text-[11px] font-semibold text-amber-700 uppercase">Pending</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {pendingTasksData.summary?.pending || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/20">
              <p className="text-[11px] font-semibold text-blue-700 uppercase">In Progress</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {pendingTasksData.summary?.inProgress || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/20">
              <p className="text-[11px] font-semibold text-rose-700 uppercase">Overdue</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">
                {pendingTasksData.summary?.overdue || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-purple-50/20">
              <p className="text-[11px] font-semibold text-purple-700 uppercase">Urgent Priority</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {pendingTasksData.summary?.urgent || 0}
              </p>
            </div>
          </div>

          {/* Filters Bar (Hidden on print) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
              >
                <option value="ALL">All Outstanding Tasks</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="OVERDUE">Overdue Only</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <button
              onClick={() => setFilters({ ...filters, status: 'OVERDUE' })}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 flex items-center space-x-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Show Overdue Only</span>
            </button>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
              <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Generating Pending Tasks & Deadlines Report...</p>
            </div>
          ) : pendingTasksData.tasks?.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
              <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No outstanding tasks found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-3">Task Title & Case</th>
                      <th className="py-3 px-3">Assignee</th>
                      <th className="py-3 px-3">Created By</th>
                      <th className="py-3 px-3">Priority</th>
                      <th className="py-3 px-3">Deadline</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Days Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {pendingTasksData.tasks.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{t.title}</p>
                          <span className="font-mono text-[11px] text-blue-900 font-semibold">
                            {t.caseReference}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{t.assignedUserName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.assignedUserRole}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{t.createdByName}</td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              t.priority === 'URGENT'
                                ? 'urgent'
                                : t.priority === 'HIGH'
                                ? 'high'
                                : t.priority === 'MEDIUM'
                                ? 'medium'
                                : 'low'
                            }
                            size="sm"
                          >
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {t.deadline}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge variant={t.status} size="sm">
                            {t.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                          {t.isOverdue ? (
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Overdue by {Math.abs(t.daysRemaining)} day(s)
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {t.daysRemaining} day(s) left
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 4: CLIENT CASE SUMMARY REPORT */}
      {/* ========================================================================= */}
      {activeTab === 'client-summary' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Clients</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {clientSummaryData.summary?.totalClients || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase">Active Retainers</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {clientSummaryData.summary?.activeClients || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/20">
              <p className="text-[11px] font-semibold text-blue-700 uppercase">Total Client Dockets</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {clientSummaryData.summary?.totalClientCases || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-purple-50/20">
              <p className="text-[11px] font-semibold text-purple-700 uppercase">Corporate Clients</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">
                {clientSummaryData.summary?.corporateClients || 0}
              </p>
            </div>
          </div>

          {/* Filters Bar (Hidden on print) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
              >
                <option value="ALL">All Client Accounts</option>
                <option value="ACTIVE">Active Clients</option>
                <option value="INACTIVE">Inactive Clients</option>
              </select>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search client name, email, company..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-800"
              />
            </form>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
              <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Generating Client Caseload Summary Report...</p>
            </div>
          ) : clientSummaryData.clients?.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No client records found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-3">Litigant Client & Company</th>
                      <th className="py-3 px-3">Contact Email & Phone</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Assigned Advocate</th>
                      <th className="py-3 px-3 text-center">Total Cases</th>
                      <th className="py-3 px-3 text-center">Active Cases</th>
                      <th className="py-3 px-3 text-center">Closed Cases</th>
                      <th className="py-3 px-3">Current Litigation Dockets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {clientSummaryData.clients.map((cl) => (
                      <tr key={cl._id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{cl.name}</p>
                          <span className="text-[10px] text-slate-500 font-medium">{cl.organization}</span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="text-slate-800">{cl.email}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{cl.phone}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{cl.city}</td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{cl.assignedLawyerName}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">{cl.totalCases}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                            {cl.activeCases}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {cl.closedCases}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1 max-w-xs">
                            {cl.casesList?.length > 0 ? (
                              cl.casesList.map((cs) => (
                                <div key={cs.caseReference} className="flex items-center space-x-1.5 text-[11px]">
                                  <span className="font-mono font-bold text-blue-900 shrink-0">
                                    {cs.caseReference}
                                  </span>
                                  <span className="text-slate-600 truncate">{cs.title}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No registered cases</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
