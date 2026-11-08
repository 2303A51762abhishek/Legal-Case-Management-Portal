import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Shield,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const UsersPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    {
      id: 'USR-01',
      name: 'Adv. Rajeshwar Sharma',
      email: 'admin@jurismanagement.in',
      phone: '+91 98111 22334',
      role: 'ADMIN',
      status: 'Active',
      casesCount: 24
    },
    {
      id: 'USR-02',
      name: 'Adv. Mamillapally Abhishek',
      email: 'abhishek@jurismanagement.in',
      phone: '+91 98765 43210',
      role: 'LAWYER',
      status: 'Active',
      casesCount: 14
    },
    {
      id: 'USR-03',
      name: 'Vikramaditya Rao',
      email: 'vikram.rao@enterprise.com',
      phone: '+91 94440 12345',
      role: 'CLIENT',
      status: 'Active',
      casesCount: 2
    },
    {
      id: 'USR-04',
      name: 'Suresh Chandra',
      email: 'suresh.clerk@jurismanagement.in',
      phone: '+91 99887 76655',
      role: 'CLERK',
      status: 'Active',
      casesCount: 68
    },
    {
      id: 'USR-05',
      name: 'Adv. Priya Deshmukh',
      email: 'priya.legal@jurismanagement.in',
      phone: '+91 97766 55443',
      role: 'LAWYER',
      status: 'Active',
      casesCount: 11
    }
  ];

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User & Stakeholder Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Role assignments, bar council verifications, and client access management
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/70 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Associated Cases</th>
                <th className="py-3 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {u.name}
                    <span className="block text-[11px] font-normal text-slate-400">{u.id}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-slate-800">{u.email}</p>
                    <span className="text-[11px] text-slate-400">{u.phone}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={u.role} size="sm">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {u.casesCount} Cases
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-[11px]">
                      <CheckCircle className="w-3 h-3" />
                      <span>{u.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Stakeholder / User</h3>
                  <p className="text-xs text-slate-500">Configure role permissions and login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Adv. Mamillapally Abhishek"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="advocate@juris.in"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role Type</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none">
                    <option value="LAWYER">LAWYER (Advocate)</option>
                    <option value="CLIENT">CLIENT (Litigant)</option>
                    <option value="CLERK">CLERK (Registry)</option>
                    <option value="ADMIN">ADMIN (Partner)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bar / ID Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TS/2026/51762"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
