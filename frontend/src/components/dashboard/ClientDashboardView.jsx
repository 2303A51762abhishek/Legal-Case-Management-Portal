import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  FileText,
  Download,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  PhoneCall,
  RefreshCw,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const ClientDashboardView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchClientDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard/client');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching client dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load client portal dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDashboard();
  }, []);

  const handleDownloadDoc = async (docId, fileName) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'case_document.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Unable to download document. Please contact your assigned counsel.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center bg-white rounded-2xl border border-slate-200/90 shadow-sm">
        <RefreshCw className="w-10 h-10 text-blue-900 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Synchronizing Your Legal Dockets...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to authenticated court registry and legal counsel updates</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Dashboard Synchronization Failed</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error || 'Unable to retrieve client records.'}</p>
        <button
          onClick={fetchClientDashboard}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, clientProfile, myCases, upcomingHearings, actionItems, sharedDocuments } = data;

  const statCards = [
    {
      title: 'My Registered Cases',
      value: String(stats.totalCases),
      subtitle: `${stats.activeCases} Active Representation`,
      icon: Briefcase,
      color: 'blue',
    },
    {
      title: 'Upcoming Hearings',
      value: String(stats.upcomingHearings),
      subtitle: 'Scheduled Court Appearances',
      icon: Calendar,
      color: 'amber',
    },
    {
      title: 'Client Action Items',
      value: String(stats.clientTasks),
      subtitle: `${stats.completedClientTasks} Finalized`,
      icon: Clock,
      color: 'rose',
    },
    {
      title: 'Designated Counsel',
      value: clientProfile?.assignedLawyer?.name ? 'Assigned' : 'Pending',
      subtitle: clientProfile?.assignedLawyer?.name || 'Advocate being assigned',
      icon: ShieldCheck,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
              LITIGANT CLIENT PORTAL
            </span>
            <span className="text-xs text-blue-300">Client: {clientProfile?.name || 'Litigant'}</span>
          </div>
          <h1 className="text-2xl font-bold mt-2 tracking-tight">Case Tracking & Court Updates</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Monitor real-time litigation status, view upcoming court appearances, download authorized judicial orders, and communicate with your legal team.
          </p>
        </div>

        {clientProfile?.assignedLawyer?.phone && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-left shrink-0">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Designated Legal Counsel</span>
            <span className="text-sm font-bold text-white block mt-0.5">
              {clientProfile.assignedLawyer.name}
            </span>
            <span className="text-xs text-slate-200 flex items-center space-x-1 mt-1 font-mono">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>{clientProfile.assignedLawyer.phone}</span>
            </span>
          </div>
        )}
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      {/* Main Grid: My Cases & Hearings/Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Legal Cases */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">My Active Legal Cases</h3>
              <p className="text-xs text-slate-500">Live docket tracking & litigation milestone progress</p>
            </div>
            <Link
              to="/cases"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              All My Cases <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-5 divide-y divide-slate-100 flex-1 space-y-4">
            {myCases.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No cases currently registered for your account</div>
            ) : (
              myCases.map((c) => (
                <div key={c._id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                          {c.caseReference}
                        </span>
                        <Badge variant={c.status} size="sm">
                          {c.status}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{c.title}</h4>
                      <p className="text-xs text-slate-500">
                        {c.courtName} • Counsel: <span className="text-slate-800 font-semibold">{c.lawyerName}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs font-bold text-blue-900 block">{c.stage}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.progress}% estimated progress</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-900 h-2 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Hearings & Shared Documents */}
        <div className="space-y-6">
          {/* Upcoming Hearings */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Upcoming Hearings</h3>
              <Link to="/hearings" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Cause Calendar
              </Link>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {upcomingHearings.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">No scheduled court hearings</div>
              ) : (
                upcomingHearings.map((h) => (
                  <div key={h._id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-blue-900">{h.caseReference}</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {h.hearingDate} • {h.hearingTime}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{h.purpose}</p>
                    <p className="text-[10px] text-slate-500">
                      {h.courtroom}, {h.courtName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Authorized Case Documents */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Authorized Documents</h3>
              <Link to="/documents" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                All Files
              </Link>
            </div>

            <div className="p-4 divide-y divide-slate-100">
              {sharedDocuments.length === 0 ? (
                <div className="py-4 text-center text-slate-400 text-xs">No documents available yet</div>
              ) : (
                sharedDocuments.map((d) => (
                  <div key={d._id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{d.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {d.fileName} • {d.uploadDate}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDownloadDoc(d._id, d.fileName)}
                      className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg border border-blue-200/60 transition-colors shrink-0"
                      title="Download Document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
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
