import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Calendar,
  Building2,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const CasesPage = () => {
  const { user } = useAuth();

  // Data states
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isUpdatingCase, setIsUpdatingCase] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // Form states for Registering a New Case
  const [formData, setFormData] = useState({
    title: '',
    caseType: 'Civil Writ Petition',
    courtName: 'High Court of Judicature',
    courtroom: 'Courtroom #402',
    client: '',
    assignedLawyer: '',
    description: '',
    priority: 'MEDIUM',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Update Progress Form inside Details Modal
  const [updateStageData, setUpdateStageData] = useState({
    status: '',
    stage: '',
    progress: 10,
    priority: 'MEDIUM',
  });

  // Fetch Cases from Backend
  const fetchCases = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/cases?page=${page}&limit=10`;
      if (selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;

      const res = await api.get(url);
      setCases(res.data.data.cases);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available Clients and Lawyers for the registration dropdowns
  const fetchPrerequisites = async () => {
    try {
      if (user?.role === 'ADMIN' || user?.role === 'CLERK') {
        const clientRes = await api.get('/clients?limit=100');
        setClients(clientRes.data.data.clients || []);

        // Fetch users to populate lawyer list
        try {
          const userRes = await api.get('/users?role=LAWYER');
          setLawyers(userRes.data.data || []);
        } catch {
          // If not permitted, clientRes might have assignedLawyer
        }
      }
    } catch (err) {
      console.warn('Could not load clients/lawyers list:', err.message);
    }
  };

  useEffect(() => {
    fetchCases(1);
    fetchPrerequisites();
  }, [selectedStatus]);

  // Debounced Search Trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCases(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');

    try {
      const res = await api.post('/cases', formData);
      setAlertMessage({
        type: 'success',
        text: `Case successfully registered with Reference Number: ${res.data.data.caseReference}`,
      });
      setShowRegisterModal(false);
      setFormData({
        title: '',
        caseType: 'Civil Writ Petition',
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402',
        client: '',
        assignedLawyer: '',
        description: '',
        priority: 'MEDIUM',
      });
      fetchCases(1);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to register case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCaseDetails = (legalCase) => {
    setSelectedCase(legalCase);
    setUpdateStageData({
      status: legalCase.status,
      stage: legalCase.stage,
      progress: legalCase.progress,
      priority: legalCase.priority || 'MEDIUM',
    });
  };

  const handleUpdateCaseStage = async (e) => {
    e.preventDefault();
    setIsUpdatingCase(true);
    try {
      const res = await api.put(`/cases/${selectedCase._id}`, updateStageData);
      setSelectedCase(res.data.data);
      setAlertMessage({
        type: 'success',
        text: `Case ${selectedCase.caseReference} progress updated successfully!`,
      });
      fetchCases(pagination.page);
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update case progress.',
      });
    } finally {
      setIsUpdatingCase(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Legal Case Records</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {pagination.total} Dockets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time court records, judicial proceedings, and litigation progress tracking
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

      {/* Global Alert Notification Banner */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alertMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by case reference (e.g. LCMS-2026), title, court..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          {[
            'ALL',
            'FILED',
            'UNDER_REVIEW',
            'HEARING_IN_PROGRESS',
            'JUDGMENT_RESERVED',
            'CLOSED',
            'APPEALED',
          ].map((st) => (
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
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-medium">Loading Case Dockets from MongoDB...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Legal Cases Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || selectedStatus !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'No cases have been registered for this account role yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Case Reference</th>
                  <th className="py-3.5 px-4">Title & Type</th>
                  <th className="py-3.5 px-4">Court Venue</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Assigned Counsel</th>
                  <th className="py-3.5 px-4">Status & Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {cases.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                      {c.caseReference}
                      <span className="block text-[10px] text-slate-400 font-sans">
                        Filed: {new Date(c.filingDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 line-clamp-1">{c.title}</p>
                      <span className="text-[11px] text-slate-500">{c.caseType}</span>
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800">
                      {c.courtName}
                      {c.courtroom && (
                        <span className="block text-[10px] text-slate-400">{c.courtroom}</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-900 block">{c.client?.name || 'Client'}</span>
                      {c.client?.organization && (
                        <span className="text-[10px] text-slate-400 block truncate">{c.client.organization}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {c.assignedLawyer?.name || 'Advocate'}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={c.status} size="sm">
                        {c.status}
                      </Badge>
                      <span className="block text-[10px] text-slate-500 mt-1 truncate max-w-[140px]">
                        {c.stage} ({c.progress || 10}%)
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => openCaseDetails(c)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-900 hover:text-white rounded-lg text-[11px] font-semibold text-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <span>View Docket</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> (
              {pagination.total} cases)
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchCases(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCases(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Case Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Register New Legal Case</h3>
                  <p className="text-xs text-slate-500">Auto-generated Reference Format: LCMS-YYYY-XXXX</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Title / Cause of Action</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Apex Technologies vs. State Revenue Department"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Court Name</label>
                  <input
                    type="text"
                    value={formData.courtName}
                    onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                    placeholder="e.g. High Court of Judicature"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Courtroom / Bench</label>
                  <input
                    type="text"
                    value={formData.courtroom}
                    onChange={(e) => setFormData({ ...formData, courtroom: e.target.value })}
                    placeholder="e.g. Courtroom #402, Bench 4"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case Type</label>
                  <select
                    value={formData.caseType}
                    onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option>Civil Writ Petition</option>
                    <option>Commercial Contract Dispute</option>
                    <option>Corporate Taxation</option>
                    <option>Criminal Appeal</option>
                    <option>Property Dispute</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Client</label>
                  <select
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((cl) => (
                      <option key={cl._id} value={cl._id}>
                        {cl.name} {cl.organization ? `(${cl.organization})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Lead Lawyer</label>
                  <select
                    value={formData.assignedLawyer}
                    onChange={(e) => setFormData({ ...formData, assignedLawyer: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  >
                    <option value="">-- Choose Lawyer --</option>
                    {lawyers.length > 0 ? (
                      lawyers.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.name} {l.barCouncilId ? `(${l.barCouncilId})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="6af07959036c48fbd5b6ca5e">Adv. Mamillapally Abhishek</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Case Description & Prayer</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summarize relief sought, statutory provisions, and litigation background..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
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
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-700 text-white rounded-lg font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Registration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Details & Stage Update Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedCase.caseReference}
                  </span>
                  <Badge variant={selectedCase.status} size="sm">
                    {selectedCase.status}
                  </Badge>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Priority: {selectedCase.priority}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedCase.title}</h3>
                <p className="text-xs text-slate-500">{selectedCase.courtName} • {selectedCase.caseType}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Case Details Info Grid */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Litigant Client</p>
                <p className="font-bold text-slate-900 mt-1">{selectedCase.client?.name}</p>
                <span className="text-slate-500 block">{selectedCase.client?.organization || 'Individual'}</span>
                <span className="text-slate-500 block">{selectedCase.client?.phone}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Counsel</p>
                <p className="font-bold text-slate-900 mt-1">{selectedCase.assignedLawyer?.name}</p>
                <span className="text-slate-500 block">{selectedCase.assignedLawyer?.designation}</span>
                <span className="text-blue-700 font-semibold block">{selectedCase.assignedLawyer?.barCouncilId}</span>
              </div>
            </div>

            <div className="py-4 border-b border-slate-100 text-xs">
              <p className="font-bold text-slate-800 mb-1">Case Description & Statutory Prayer:</p>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                {selectedCase.description}
              </p>
            </div>

            {/* Stage Progress Bar */}
            <div className="py-4 border-b border-slate-100 text-xs">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-bold text-slate-800">
                  Current Stage: <span className="text-blue-900 font-semibold">{selectedCase.stage}</span>
                </span>
                <span className="font-bold text-blue-700">{selectedCase.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${selectedCase.progress}%` }}
                />
              </div>
            </div>

            {/* Stage Update Form (Lawyer, Admin, Clerk only) */}
            {(user?.role === 'LAWYER' || user?.role === 'ADMIN' || user?.role === 'CLERK') && (
              <form onSubmit={handleUpdateCaseStage} className="pt-4 text-xs space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>Update Case Status & Stage Progress</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Case Status</label>
                    <select
                      value={updateStageData.status}
                      onChange={(e) => setUpdateStageData({ ...updateStageData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      <option value="FILED">FILED</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="HEARING_IN_PROGRESS">HEARING IN PROGRESS</option>
                      <option value="JUDGMENT_RESERVED">JUDGMENT RESERVED</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="APPEALED">APPEALED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Completion Progress (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={updateStageData.progress}
                      onChange={(e) => setUpdateStageData({ ...updateStageData, progress: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Milestone / Stage Note</label>
                  <input
                    type="text"
                    value={updateStageData.stage}
                    onChange={(e) => setUpdateStageData({ ...updateStageData, stage: e.target.value })}
                    placeholder="e.g. Cross Examination of Town Planner"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingCase}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                  >
                    {isUpdatingCase && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Docket Updates</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesPage;
