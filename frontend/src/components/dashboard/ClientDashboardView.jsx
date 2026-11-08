import React from 'react';
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
  Info
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';

export const ClientDashboardView = () => {
  const stats = [
    { title: 'My Registered Cases', value: '2', subtitle: 'Under Active Representation', icon: Briefcase, color: 'blue' },
    { title: 'Next Hearing Date', value: '10 Nov', subtitle: 'High Court of Judicature', icon: Calendar, color: 'amber' },
    { title: 'Case Documents & Orders', value: '6', subtitle: 'Authorized for Client Access', icon: FileText, color: 'navy' },
    { title: 'Legal Counsel', value: 'Assigned', subtitle: 'Adv. M. Abhishek (Lead)', icon: ShieldCheck, color: 'emerald' },
  ];

  const myCases = [
    {
      id: 'LCMS-2026-0104',
      title: 'Apex Technologies vs. State Revenue Dept',
      court: 'High Court Bench 4, Hyderabad',
      lawyer: 'Adv. Mamillapally Abhishek',
      phone: '+91 98765 43210',
      status: 'Hearing In Progress',
      currentStage: 'Final Arguments on Tax Exemption',
      steps: [
        { label: 'Petition Filed', completed: true, date: '12 Sep 2026' },
        { label: 'Notice Issued', completed: true, date: '01 Oct 2026' },
        { label: 'Hearing & Arguments', completed: true, date: 'Current Stage' },
        { label: 'Final Judgment', completed: false, date: 'Pending' },
      ],
    },
    {
      id: 'LCMS-2026-0062',
      title: 'Zenith Tech vs. Global Logistics Partners',
      court: 'Commercial Court at Nampally',
      lawyer: 'Adv. Rajeshwar Sharma',
      phone: '+91 98111 22334',
      status: 'Under Review',
      currentStage: 'Filing of Rebuttal Statement',
      steps: [
        { label: 'Petition Filed', completed: true, date: '15 Oct 2026' },
        { label: 'Notice Issued', completed: true, date: '28 Oct 2026' },
        { label: 'Hearing & Arguments', completed: false, date: 'Next Step' },
        { label: 'Final Judgment', completed: false, date: 'Pending' },
      ],
    }
  ];

  const sharedDocuments = [
    { name: 'Writ_Petition_Final_Stamped.pdf', caseId: 'LCMS-2026-0104', size: '2.4 MB', date: '02 Nov 2026' },
    { name: 'Vakalatnama_Certified_Copy.pdf', caseId: 'LCMS-2026-0104', size: '850 KB', date: '14 Sep 2026' },
    { name: 'Interim_Injunction_Stay_Order.pdf', caseId: 'LCMS-2026-0104', size: '1.2 MB', date: '20 Oct 2026' },
    { name: 'Commercial_Agreement_Exhibit_A.pdf', caseId: 'LCMS-2026-0062', size: '3.8 MB', date: '18 Oct 2026' },
  ];

  return (
    <div className="space-y-6">
      {/* Client Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wide">
              CLIENT PORTAL ACCESS
            </span>
            <span className="text-xs text-slate-300">Litigant: Vikramaditya Rao</span>
          </div>
          <h1 className="text-2xl font-bold mt-2 tracking-tight">Your Legal Cases & Court Proceedings</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Track real-time case milestones, review verified legal documents, and stay informed on upcoming court appearances without delay.
          </p>
        </div>

        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 text-xs">
          <p className="text-slate-400">Assigned Advocate Hotline:</p>
          <p className="font-bold text-white text-sm mt-0.5 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> +91 98765 43210
          </p>
          <span className="text-[10px] text-blue-300">Adv. Mamillapally Abhishek</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => (
          <StatCard key={idx} {...s} />
        ))}
      </div>

      {/* Main Grid: Case Progress Tracker & Document Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: My Cases with Visual Stages */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Case Progress Lifecycle</h3>

          <div className="space-y-4">
            {myCases.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-900">{c.id}</span>
                      <Badge variant={c.status} size="sm">{c.status}</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{c.title}</h4>
                    <p className="text-xs text-slate-500">{c.court}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block">Lead Advocate</span>
                    <span className="text-xs font-semibold text-slate-800">{c.lawyer}</span>
                  </div>
                </div>

                {/* Stage Steps Progress */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Current Milestone: <span className="text-blue-700 font-bold">{c.currentStage}</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {c.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className={`p-2.5 rounded-lg border text-xs ${
                          step.completed
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 font-semibold text-[11px]">
                          {step.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{step.label}</span>
                        </div>
                        <span className="text-[10px] block mt-1 text-slate-500">{step.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Documents Available to Client */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Authorized Documents</h3>
            <p className="text-xs text-slate-500">Certified copies and filed petitions</p>
          </div>

          <div className="divide-y divide-slate-100 mt-2 space-y-2 flex-1">
            {sharedDocuments.map((doc, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between">
                <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                    <span className="text-[11px] text-slate-400 block font-mono">{doc.caseId} • {doc.size}</span>
                  </div>
                </div>
                <button
                  title="Download Document"
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Court Appearance Notice</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Physical presence for hearing on 10 Nov is required only if notified by your lead counsel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardView;
