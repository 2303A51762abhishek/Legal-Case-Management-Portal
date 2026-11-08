import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  User,
  Briefcase,
  CheckCircle2,
  X,
  Search,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  Flame,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dropdown options
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New task form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    case: '',
    assignedUser: '',
    priority: 'MEDIUM',
    deadline: '',
    isClientVisible: false,
  });

  const canManageTasks = ['ADMIN', 'LAWYER', 'CLERK'].includes(user?.role);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'OVERDUE') {
          params.overdue = 'true';
        } else {
          params.status = selectedStatus;
        }
      }
      if (selectedPriority !== 'ALL') {
        params.priority = selectedPriority;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get('/tasks', { params });
      if (res.data?.success) {
        setTasks(res.data.data.tasks || []);
        setStats(res.data.data.stats || {});
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Failed to load task records.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cases and users for dropdowns
  const fetchMetadata = async () => {
    if (!canManageTasks) return;
    try {
      const casesRes = await api.get('/cases');
      if (casesRes.data?.success) {
        setCases(casesRes.data.data.cases || []);
      }

      if (['ADMIN', 'CLERK'].includes(user?.role)) {
        const usersRes = await api.get('/users');
        if (usersRes.data?.success) {
          // Filter to lawyers and clerks for task assignment
          const assignable = (usersRes.data.data || []).filter((u) =>
            ['LAWYER', 'CLERK', 'ADMIN'].includes(u.role)
          );
          setUsers(assignable);
        }
      } else if (user?.role === 'LAWYER') {
        // Lawyer can assign to self or clerk
        setUsers([{ _id: user.id || user._id, name: user.name, role: user.role }]);
      }
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedStatus, selectedPriority]);

  useEffect(() => {
    fetchMetadata();
  }, [user]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline || !formData.assignedUser) {
      setError('Please provide task title, deadline, and assigned user.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/tasks', {
        ...formData,
        case: formData.case || undefined,
      });

      if (res.data?.success) {
        setSuccessMsg(`Task "${res.data.data.title}" assigned successfully!`);
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          case: '',
          assignedUser: '',
          priority: 'MEDIUM',
          deadline: '',
          isClientVisible: false,
        });
        fetchTasks();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status transition handler
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data?.success) {
        setSuccessMsg(`Task status updated to ${newStatus}`);
        fetchTasks();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to remove this task?')) return;
    try {
      const res = await api.delete(`/tasks/${taskId}`);
      if (res.data?.success) {
        setSuccessMsg('Task removed successfully.');
        fetchTasks();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CheckSquare className="w-7 h-7 text-blue-900" />
            <span>Legal Tasks & Deadlines</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Litigation action items, affidavit filings, registry submissions, and client action alerts
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchTasks}
            className="p-2 border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
            title="Refresh Tasks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canManageTasks && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Legal Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4 text-rose-500" />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm bg-rose-50/30">
          <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue</span>
          </p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.overdue || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm bg-purple-50/20">
          <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-purple-600" />
            <span>Urgent</span>
          </p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{stats.urgent || 0}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedStatus === st
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL'
                ? 'All Statuses'
                : st === 'IN_PROGRESS'
                ? 'In Progress'
                : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Priority Filter & Search */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-40 sm:w-56 focus:outline-none focus:ring-1 focus:ring-blue-800"
            />
          </form>
        </div>
      </div>

      {/* Task Cards List */}
      {loading ? (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
          <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading legal action items...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/90 shadow-sm">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No tasks match your current filter</p>
          <p className="text-xs text-slate-400 mt-1">
            {canManageTasks
              ? 'Click "Add Legal Task" to schedule court action items and drafting deadlines.'
              : 'There are currently no pending court notices or actions required for your cases.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const isCompleted = t.status === 'COMPLETED';
            const isOverdue = t.status === 'OVERDUE' || t.isOverdue;
            const deadlineFormatted = t.deadline
              ? new Date(t.deadline).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'No deadline';

            return (
              <div
                key={t._id}
                className={`bg-white rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                  isOverdue
                    ? 'border-rose-300 bg-rose-50/10'
                    : isCompleted
                    ? 'border-slate-200/80 bg-slate-50/40 opacity-80'
                    : 'border-slate-200/90 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Status Icon + Title + Metadata */}
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() =>
                        canManageTasks &&
                        handleStatusChange(
                          t._id,
                          isCompleted ? 'IN_PROGRESS' : 'COMPLETED'
                        )
                      }
                      disabled={!canManageTasks}
                      className={`pt-1 shrink-0 ${
                        canManageTasks ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
                      }`}
                      title={
                        canManageTasks
                          ? isCompleted
                            ? 'Mark In Progress'
                            : 'Mark Completed'
                          : undefined
                      }
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : isOverdue ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {t.case && (
                          <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                            {t.case.caseReference}
                          </span>
                        )}

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

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isOverdue && !isCompleted ? 'OVERDUE' : t.status}
                        </span>

                        {t.isClientVisible ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>Client Visible</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center space-x-1">
                            <EyeOff className="w-3 h-3" />
                            <span>Internal</span>
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-bold tracking-tight ${
                          isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}
                      >
                        {t.title}
                      </h3>

                      {t.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Assignee: </span>
                          <strong className="text-slate-700 font-semibold">
                            {t.assignedUser?.name || 'Unassigned'}
                          </strong>
                        </span>

                        {t.case && (
                          <span className="flex items-center space-x-1 text-slate-500">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-xs">{t.case.title}</span>
                          </span>
                        )}

                        <span
                          className={`flex items-center space-x-1 ${
                            isOverdue && !isCompleted ? 'text-rose-600 font-bold' : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Deadline: {deadlineFormatted}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  {canManageTasks && (
                    <div className="flex items-center space-x-2 self-end lg:self-center pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {t.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(t._id, 'IN_PROGRESS')}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <span>Start</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {t.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusChange(t._id, 'COMPLETED')}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Complete</span>
                        </button>
                      )}

                      {['ADMIN', 'LAWYER'].includes(user?.role) && (
                        <button
                          onClick={() => handleDeleteTask(t._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">Schedule Legal Action Task</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Draft Rejoinder Affidavit on Injunction"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Filing Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed directions for drafting, evidence inspection, or registry filing..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Linked Case (Optional)
                  </label>
                  <select
                    value={formData.case}
                    onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    <option value="">No linked case (General Office Task)</option>
                    {cases.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.caseReference} — {c.title.slice(0, 25)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assignee (Advocate or Clerk) *
                  </label>
                  <select
                    required
                    value={formData.assignedUser}
                    onChange={(e) => setFormData({ ...formData, assignedUser: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    <option value="">Select Assignee...</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Immediate Filing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deadline Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isClientVisible}
                    onChange={(e) => setFormData({ ...formData, isClientVisible: e.target.checked })}
                    className="w-4 h-4 text-blue-900 border-slate-300 rounded focus:ring-blue-800"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Make visible to Litigant Client (Client Action / Notice)
                  </span>
                </label>
                <p className="text-[11px] text-slate-400 pl-6 mt-0.5">
                  Keep unchecked for confidential internal attorney research, strategy drafts, or clerk filings.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Assign Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
