import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building2,
  Briefcase,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit2
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const ClientsPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedClientCases, setSelectedClientCases] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    street: '',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchClients = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/clients?page=${page}&limit=15`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      const res = await api.get(url);
      setClients(res.data.data.clients);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');

    try {
      await api.post('/clients', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        organization: formData.organization,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
        },
      });

      setAlertMessage({
        type: 'success',
        text: `Client ${formData.name} successfully registered.`,
      });
      setShowRegisterModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        organization: '',
        street: '',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
      });
      fetchClients(1);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to register client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewClientHistory = async (client) => {
    try {
      const res = await api.get(`/clients/${client._id}/cases`);
      setSelectedClientCases(res.data.data);
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err.response?.data?.message || 'Could not load client case history.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Management Directory</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {pagination.total} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Litigant profiles, corporate representations, and historical case portfolios
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'CLERK') && (
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register Client</span>
          </button>
        )}
      </div>

      {/* Alert Banner */}
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
          <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, email, phone, or organization..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-medium">Loading Clients from MongoDB...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Clients Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No client records match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Client Name & Organization</th>
                  <th className="py-3 px-4">Contact Information</th>
                  <th className="py-3 px-4">Address / Jurisdiction</th>
                  <th className="py-3 px-4">Assigned Counsel</th>
                  <th className="py-3 px-4">Registered Cases</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {clients.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {c.name}
                      {c.organization && (
                        <span className="block text-[11px] font-normal text-slate-500">{c.organization}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800">{c.email}</p>
                      <span className="text-[11px] text-slate-400">{c.phone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {c.address?.city ? `${c.address.city}, ${c.address.state}` : 'Not Specified'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {c.assignedLawyer?.name || <span className="text-slate-400 font-normal">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 font-bold border border-blue-200">
                        {c.totalCases || 0} Case(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => viewClientHistory(c)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-900 hover:text-white rounded-lg text-[11px] font-semibold text-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Case History</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Client Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Register New Client</h3>
                  <p className="text-xs text-slate-500">Record litigant details and contact information</p>
                </div>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterClient} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Client Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra / Zenith Tech Ltd"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@enterprise.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Organization (Optional)</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Zenith Technologies Ltd"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
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
                  <span>Save Client</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Case History Modal */}
      {selectedClientCases && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Case Portfolio: {selectedClientCases.client.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedClientCases.client.email}</p>
              </div>
              <button onClick={() => setSelectedClientCases(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {selectedClientCases.cases.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No cases registered under this client yet.
                </div>
              ) : (
                selectedClientCases.cases.map((cs) => (
                  <div key={cs._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-900">{cs.caseReference}</span>
                      <Badge variant={cs.status} size="sm">{cs.status}</Badge>
                    </div>
                    <h4 className="font-bold text-slate-900">{cs.title}</h4>
                    <p className="text-slate-500">{cs.courtName} • {cs.caseType}</p>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
                      <span>Advocate: <strong className="text-slate-700">{cs.assignedLawyer?.name}</strong></span>
                      <span>Filed: {new Date(cs.filingDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
