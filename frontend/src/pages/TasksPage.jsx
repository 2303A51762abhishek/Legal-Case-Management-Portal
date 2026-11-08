import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  User,
  Briefcase,
  CheckCircle2,
  X
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const TasksPage = () => {
  const [showTaskModal, setShowTaskModal] = useState(false);

  const initialTasks = [
    {
      id: 'TSK-101',
      title: 'Draft Rejoinder Affidavit for Apex Technologies',
      caseId: 'LCMS-2026-0104',
      assignedTo: 'Adv. Mamillapally Abhishek',
      priority: 'urgent',
      deadline: 'Tomorrow, 05:00 PM',
      status: 'In Progress'
    },
    {
      id: 'TSK-102',
      title: 'Obtain Certified Copy of Interim Order from Registry',
      caseId: 'LCMS-2026-0098',
      assignedTo: 'Suresh Chandra (Clerk)',
      priority: 'high',
      deadline: '12 Nov 2026',
      status: 'Pending'
    },
    {
      id: 'TSK-103',
      title: 'Prepare Evidence Affidavit & Schedule Witness Prep',
      caseId: 'LCMS-2026-0095',
      assignedTo: 'Adv. Priya Deshmukh',
      priority: 'medium',
      deadline: '15 Nov 2026',
      status: 'In Progress'
    },
    {
      id: 'TSK-104',
      title: 'Serve Legal Notice via Registered Post AD',
      caseId: 'LCMS-2026-0089',
      assignedTo: 'Suresh Chandra (Clerk)',
      priority: 'low',
      deadline: '18 Nov 2026',
      status: 'Completed'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Legal Tasks & Deadlines</h1>
          <p className="text-xs text-slate-500 mt-1">
            Litigation action items, affidavit filings, registry submissions, and client conferences
          </p>
        </div>

        <button
          onClick={() => setShowTaskModal(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Legal Task</span>
        </button>
      </div>

      {/* Task List Cards */}
      <div className="space-y-3">
        {initialTasks.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start space-x-3">
              <div className="pt-1">
                {t.status === 'Completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-blue-900">{t.caseId}</span>
                  <Badge variant={t.priority} size="sm">{t.priority}</Badge>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mt-1">{t.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assigned to: <strong className="text-slate-700">{t.assignedTo}</strong></p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[11px] text-slate-400 block">Due Date</span>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 inline-block mt-0.5">
                {t.deadline}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal Preview */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Legal Task</h3>
                  <p className="text-xs text-slate-500">Assign task deadline and priority level</p>
                </div>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowTaskModal(false); }} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g., Draft Written Statement and Verify Affidavits"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case Reference</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none">
                    <option>LCMS-2026-0104</option>
                    <option>LCMS-2026-0098</option>
                    <option>LCMS-2026-0095</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none">
                    <option>Urgent</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none">
                    <option>Adv. Mamillapally Abhishek</option>
                    <option>Adv. Rajeshwar Sharma</option>
                    <option>Suresh Chandra (Clerk)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
