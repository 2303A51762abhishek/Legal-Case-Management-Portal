import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Gavel,
  Plus,
  Search,
  Filter,
  CheckCircle,
  X
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const HearingsPage = () => {
  const { user } = useAuth();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const hearings = [
    {
      id: 'HRG-2026-081',
      caseId: 'LCMS-2026-0104',
      title: 'Apex Technologies vs. State Revenue Dept',
      court: 'High Court of Judicature',
      courtroom: 'Bench #4, Courtroom 402',
      judge: 'Hon. Justice K. Raman',
      date: '10 Nov 2026',
      time: '10:30 AM',
      purpose: 'Final Arguments on Subsidies',
      advocate: 'Adv. Mamillapally Abhishek',
      status: 'Upcoming'
    },
    {
      id: 'HRG-2026-082',
      caseId: 'LCMS-2026-0098',
      title: 'Rao Estates Ltd vs. Municipal Corporation',
      court: 'City Civil Court',
      courtroom: 'Hall #2, Civil Annex',
      judge: 'Hon. Judge S. Mehra',
      date: '12 Nov 2026',
      time: '11:45 AM',
      purpose: 'Evidence & Deposition Recording',
      advocate: 'Adv. Priya Deshmukh',
      status: 'Upcoming'
    },
    {
      id: 'HRG-2026-083',
      caseId: 'LCMS-2026-0089',
      title: 'Arjun Reddy vs. Cyberabad Police Commissioner',
      court: 'Metropolitan Sessions Court',
      courtroom: 'Room #108',
      judge: 'Hon. Magistrate P. V. Reddy',
      date: '15 Nov 2026',
      time: '02:00 PM',
      purpose: 'Bail Application & Case Diary Review',
      advocate: 'Adv. Rajeshwar Sharma',
      status: 'Upcoming'
    },
    {
      id: 'HRG-2026-077',
      caseId: 'LCMS-2026-0095',
      title: 'Union Bank of India vs. V. K. Infra Projects',
      court: 'Debt Recovery Tribunal - II',
      courtroom: 'Tribunal Hall A',
      judge: 'Presiding Officer M. N. Gupta',
      date: '02 Nov 2026',
      time: '11:00 AM',
      purpose: 'Arguments on Interim Relief',
      advocate: 'Adv. Mamillapally Abhishek',
      status: 'Completed'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Court Hearing Schedule & Calendar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Official court appearances, cause lists, courtroom assignments, and judicial proceedings
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'LAWYER' || user?.role === 'CLERK') && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Court Hearing</span>
          </button>
        )}
      </div>

      {/* Hearing List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hearings.map((h) => (
          <div
            key={h.id}
            className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-blue-900">{h.caseId}</span>
                  <span className="text-[10px] font-mono text-slate-400">({h.id})</span>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  h.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {h.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-3">{h.title}</h3>
              <p className="text-xs text-blue-800 font-semibold mt-0.5">{h.purpose}</p>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Date & Time:</strong> {h.date} at {h.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Court:</strong> {h.court} ({h.courtroom})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Gavel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Bench:</strong> {h.judge}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Counsel: <strong className="text-slate-800">{h.advocate}</strong></span>
              <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                View Docket
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Hearing Modal Preview */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 text-amber-900 rounded-lg">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Schedule Court Hearing</h3>
                  <p className="text-xs text-slate-500">Assign cause date, time slot, and judicial courtroom</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowScheduleModal(false); }} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Registered Case</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none">
                  <option>LCMS-2026-0104 - Apex Technologies vs. State Revenue</option>
                  <option>LCMS-2026-0098 - Rao Estates vs. Municipal Corp</option>
                  <option>LCMS-2026-0095 - Union Bank vs. V.K. Infra</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hearing Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Courtroom / Hall</label>
                  <input
                    type="text"
                    placeholder="e.g. Bench 4, Room 402"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Presiding Judge</label>
                  <input
                    type="text"
                    placeholder="e.g. Hon. Justice K. Raman"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose of Hearing</label>
                <input
                  type="text"
                  placeholder="e.g. Examination of Chief Witness / Framing of Issues"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HearingsPage;
