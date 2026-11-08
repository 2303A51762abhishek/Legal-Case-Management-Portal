import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Calendar,
  User,
  Building2,
  FileText,
  ChevronRight,
  X
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const CasesPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const initialCases = [
    {
      id: 'LCMS-2026-0104',
      title: 'Apex Technologies vs. State Revenue Dept',
      court: 'High Court of Judicature',
      type: 'Corporate Taxation',
      client: 'Vikramaditya Rao',
      lawyer: 'Adv. Mamillapally Abhishek',
      status: 'Hearing In Progress',
      filingDate: '12 Sep 2026',
      nextHearing: '10 Nov 2026'
    },
    {
      id: 'LCMS-2026-0098',
      title: 'Rao Estates Ltd vs. Municipal Corporation',
      court: 'City Civil Court',
      type: 'Property Dispute',
      client: 'Rao Developers Group',
      lawyer: 'Adv. Priya Deshmukh',
      status: 'Under Review',
      filingDate: '24 Sep 2026',
      nextHearing: '12 Nov 2026'
    },
    {
      id: 'LCMS-2026-0095',
      title: 'Union Bank of India vs. V. K. Infra Projects',
      court: 'Debt Recovery Tribunal - II',
      type: 'Commercial Debt',
      client: 'Union Bank of India',
      lawyer: 'Adv. Mamillapally Abhishek',
      status: 'Judgment Reserved',
      filingDate: '02 Aug 2026',
      nextHearing: '18 Nov 2026'
    },
    {
      id: 'LCMS-2026-0089',
      title: 'Arjun Reddy vs. Cyberabad Police Commissioner',
      court: 'Metropolitan Sessions Court',
      type: 'Criminal Defense',
      client: 'Arjun Reddy',
      lawyer: 'Adv. Rajeshwar Sharma',
      status: 'Filed',
      filingDate: '28 Oct 2026',
      nextHearing: '15 Nov 2026'
    },
    {
      id: 'LCMS-2026-0075',
      title: 'Global Pharma vs. Standard Patents Board',
      court: 'Intellectual Property Appellate Board',
      type: 'Patent Infringement',
      client: 'Global Pharma Corp',
      lawyer: 'Adv. Mamillapally Abhishek',
      status: 'Closed',
      filingDate: '10 Jan 2026',
      nextHearing: 'Concluded'
    }
  ];

  const filteredCases = initialCases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.court.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'ALL' ||
      c.status.toUpperCase().replace(/\s+/g, '_') === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Legal Case Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered legal dockets, assigned counsel, court venues, and litigation progress
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'CLERK') && (
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Case</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by case reference (LCMS-2026-...), title, court, or client..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          {['ALL', 'FILED', 'UNDER_REVIEW', 'HEARING_IN_PROGRESS', 'JUDGMENT_RESERVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === st
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Case Reference</th>
                <th className="py-3.5 px-4">Title & Description</th>
                <th className="py-3.5 px-4">Court Venue</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Assigned Counsel</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Next Hearing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                    {c.id}
                    <span className="block text-[10px] text-slate-400 font-sans">Filed: {c.filingDate}</span>
                  </td>
                  <td className="py-4 px-4 max-w-xs">
                    <p className="font-semibold text-slate-900 line-clamp-1">{c.title}</p>
                    <span className="text-[11px] text-slate-500">{c.type}</span>
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-800">
                    {c.court}
                  </td>
                  <td className="py-4 px-4">
                    {c.client}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-900">
                    {c.lawyer}
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={c.status} size="sm">
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 font-semibold text-amber-800 whitespace-nowrap">
                    {c.nextHearing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Registration Modal Preview */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Register New Legal Case</h3>
                  <p className="text-xs text-slate-500">Auto-assigned Reference: LCMS-2026-0105</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowRegisterModal(false); }} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Title / Cause of Action</label>
                <input
                  type="text"
                  placeholder="e.g., Bharat Textiles vs. State Municipal Board"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Court Name</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none">
                    <option>High Court of Judicature</option>
                    <option>City Civil Court</option>
                    <option>Debt Recovery Tribunal</option>
                    <option>Metropolitan Sessions Court</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case Type</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none">
                    <option>Civil Writ Petition</option>
                    <option>Commercial Dispute</option>
                    <option>Criminal Appeal</option>
                    <option>Property & Revenue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Client</label>
                  <input
                    type="text"
                    placeholder="Search or enter client name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Counsel</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none">
                    <option>Adv. Mamillapally Abhishek</option>
                    <option>Adv. Rajeshwar Sharma</option>
                    <option>Adv. Priya Deshmukh</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Summary & Prayer</label>
                <textarea
                  rows="3"
                  placeholder="Provide concise brief of allegations, statutory provisions, and relief sought..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesPage;
