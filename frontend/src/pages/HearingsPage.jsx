import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Gavel,
  Plus,
  Search,
  Filter,
  CheckCircle,
  X,
  AlertTriangle,
  Loader2,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Edit2,
  Ban
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const HearingsPage = () => {
  const { user } = useAuth();

  // State
  const [hearings, setHearings] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'month'

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUpcoming, setFilterUpcoming] = useState('all'); // 'all' | 'upcoming' | 'past'

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [conflictError, setConflictError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    case: '',
    courtName: 'High Court of Judicature',
    courtroom: 'Courtroom #402',
    judgeName: 'Hon. Justice K. Raman',
    hearingDate: '',
    hearingTime: '10:30 AM',
    durationMinutes: 60,
    purpose: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar date navigator
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const fetchHearings = async () => {
    setLoading(true);
    try {
      let url = '/hearings?';
      if (selectedStatus !== 'ALL') url += `status=${selectedStatus}&`;
      if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;
      if (filterUpcoming === 'upcoming') url += 'upcoming=true&';
      if (filterUpcoming === 'past') url += 'upcoming=false&';

      const res = await api.get(url);
      setHearings(res.data.data);
    } catch (err) {
      console.error('Failed to load hearings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCasesForDropdown = async () => {
    try {
      if (user?.role !== 'CLIENT') {
        const res = await api.get('/cases?limit=50');
        setCases(res.data.data.cases || []);
      }
    } catch (err) {
      console.warn('Could not load cases list:', err);
    }
  };

  useEffect(() => {
    fetchHearings();
    fetchCasesForDropdown();
  }, [selectedStatus, filterUpcoming]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHearings();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setConflictError(null);

    try {
      await api.post('/hearings', formData);
      setAlertMessage({
        type: 'success',
        text: 'Court appearance scheduled successfully without calendar conflicts!',
      });
      setShowScheduleModal(false);
      setFormData({
        case: '',
        courtName: 'High Court of Judicature',
        courtroom: 'Courtroom #402',
        judgeName: 'Hon. Justice K. Raman',
        hearingDate: '',
        hearingTime: '10:30 AM',
        durationMinutes: 60,
        purpose: '',
        notes: '',
      });
      fetchHearings();
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError(err.response.data.message);
      } else {
        setConflictError(err.response?.data?.message || 'Failed to schedule hearing.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setConflictError(null);

    try {
      await api.put(`/hearings/${editingHearing._id}`, {
        courtName: editingHearing.courtName,
        courtroom: editingHearing.courtroom,
        judgeName: editingHearing.judgeName,
        hearingDate: editingHearing.hearingDate,
        hearingTime: editingHearing.hearingTime,
        durationMinutes: editingHearing.durationMinutes,
        purpose: editingHearing.purpose,
        status: editingHearing.status,
        notes: editingHearing.notes,
      });

      setAlertMessage({
        type: 'success',
        text: 'Hearing schedule updated successfully!',
      });
      setEditingHearing(null);
      fetchHearings();
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError(err.response.data.message);
      } else {
        setConflictError(err.response?.data?.message || 'Failed to reschedule hearing.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelHearing = async (hearingId) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled court appearance?')) return;

    try {
      await api.delete(`/hearings/${hearingId}`);
      setAlertMessage({
        type: 'success',
        text: 'Hearing marked as CANCELLED. Courtroom slot released.',
      });
      fetchHearings();
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel hearing.',
      });
    }
  };

  // Calendar Month Calculations
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Court Hearing Calendar</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {hearings.length} Proceedings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Judicial schedule rosters, cause lists, courtroom conflict prevention, and hearing status tracking
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Monthly Grid</span>
            </button>
          </div>

          {(user?.role === 'ADMIN' || user?.role === 'CLERK' || user?.role === 'LAWYER') && (
            <button
              onClick={() => {
                setShowScheduleModal(true);
                setConflictError(null);
              }}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Hearing</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Notification Banner */}
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by case reference (e.g. LCMS-2026), court, courtroom, judge..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-800"
          />
        </div>

        {/* Timeline Filter (All / Upcoming / Past) */}
        <div className="flex items-center space-x-1">
          {['all', 'upcoming', 'past'].map((tm) => (
            <button
              key={tm}
              onClick={() => setFilterUpcoming(tm)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterUpcoming === tm
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tm}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          {['ALL', 'SCHEDULED', 'ADJOURNED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === st
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: List View vs Monthly Calendar View */}
      {loading ? (
        <div className="py-24 bg-white rounded-xl border border-slate-200/90 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-medium">Loading Hearing Cause List & Schedules from MongoDB...</p>
        </div>
      ) : viewMode === 'month' ? (
        /* Monthly Calendar Grid */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              {currentMonthDate.toLocaleString('default', { month: 'long' })} {currentYear}
            </h3>
            <div className="flex items-center space-x-1">
              <button onClick={prevMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonthDate(new Date())}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Today
              </button>
              <button onClick={nextMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="bg-slate-50 py-2 text-center text-xs font-bold text-slate-500">
                {d}
              </div>
            ))}

            {/* Empty prefix days */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white min-h-[100px] p-2 text-slate-300" />
            ))}

            {/* Calendar month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentYear, currentMonth, day);
              const dayHearings = hearings.filter((h) => {
                const hd = new Date(h.hearingDate);
                return (
                  hd.getDate() === day &&
                  hd.getMonth() === currentMonth &&
                  hd.getFullYear() === currentYear
                );
              });

              return (
                <div key={day} className="bg-white min-h-[100px] p-2 flex flex-col justify-between hover:bg-slate-50/50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{day}</span>
                    {dayHearings.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
                        {dayHearings.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 mt-1 flex-1">
                    {dayHearings.slice(0, 2).map((h) => (
                      <div
                        key={h._id}
                        onClick={() => setEditingHearing(h)}
                        className="text-[10px] p-1 rounded bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 truncate"
                      >
                        <span className="font-bold text-blue-900">{h.caseReference}</span>: {h.hearingTime}
                      </div>
                    ))}
                    {dayHearings.length > 2 && (
                      <span className="text-[9px] text-slate-400 block font-semibold">
                        +{dayHearings.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : hearings.length === 0 ? (
        /* Empty State */
        <div className="py-20 bg-white rounded-xl border border-slate-200/90 text-center text-slate-500">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Scheduled Court Appearances Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedStatus !== 'ALL' || searchTerm
              ? 'Try clearing search terms or selecting a different status filter.'
              : 'There are currently no hearings registered in the calendar.'}
          </p>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hearings.map((h) => (
            <div
              key={h._id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {h.caseReference || h.case?.caseReference}
                    </span>
                    <Badge variant={h.status} size="sm">
                      {h.status}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    {new Date(h.hearingDate).toLocaleDateString()} at {h.hearingTime}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mt-3 line-clamp-1">
                  {h.case?.title || 'Legal Cause Hearing'}
                </h3>
                <p className="text-xs text-blue-800 font-semibold mt-0.5">{h.purpose}</p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      <strong>Court:</strong> {h.courtName} ({h.courtroom})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Gavel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      <strong>Bench:</strong> {h.judgeName}
                    </span>
                  </div>
                  {h.notes && (
                    <div className="flex items-start space-x-2 pt-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="italic text-slate-500">{h.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Authorized Roles */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Advocate: <strong className="text-slate-700">{h.case?.assignedLawyer?.name || 'Assigned'}</strong>
                </span>

                {(user?.role === 'ADMIN' || user?.role === 'CLERK' || user?.role === 'LAWYER') && (
                  <div className="flex items-center space-x-2">
                    {h.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelHearing(h._id)}
                        className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 hover:border-rose-200 transition-colors inline-flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingHearing(h);
                        setConflictError(null);
                      }}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded font-medium hover:bg-blue-900 transition-colors inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Reschedule</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Hearing Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 text-amber-900 rounded-lg">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Schedule Court Hearing</h3>
                  <p className="text-xs text-slate-500">Automated Courtroom & Judge Conflict Prevention Active</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prominent Conflict Alert Banner (HTTP 409 rejection display) */}
            {conflictError && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2.5 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Scheduling Conflict Detected!</p>
                  <p className="mt-0.5 leading-relaxed">{conflictError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Registered Case</label>
                <select
                  value={formData.case}
                  onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                >
                  <option value="">-- Choose Case Docket --</option>
                  {cases.map((cs) => (
                    <option key={cs._id} value={cs._id}>
                      {cs.caseReference} - {cs.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Court Name</label>
                  <input
                    type="text"
                    value={formData.courtName}
                    onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Presiding Judge</label>
                <input
                  type="text"
                  value={formData.judgeName}
                  onChange={(e) => setFormData({ ...formData, judgeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.hearingDate}
                    onChange={(e) => setFormData({ ...formData, hearingDate: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={formData.hearingTime}
                    onChange={(e) => setFormData({ ...formData, hearingTime: e.target.value })}
                    placeholder="10:30 AM"
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    min="15"
                    max="480"
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose of Hearing</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g. Final Arguments on Transitional Credit Admissibility"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instructions for counsel, witness attendance, or evidence copies..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
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
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule / Edit Hearing Modal */}
      {editingHearing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reschedule Hearing: {editingHearing.caseReference}
                </h3>
                <p className="text-xs text-slate-500">Update time slot, courtroom, judge, or status</p>
              </div>
              <button
                onClick={() => setEditingHearing(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {conflictError && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Rescheduling Conflict Detected!</p>
                  <p className="mt-0.5 leading-relaxed">{conflictError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingHearing.status}
                    onChange={(e) => setEditingHearing({ ...editingHearing, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="ADJOURNED">ADJOURNED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Courtroom</label>
                  <input
                    type="text"
                    value={editingHearing.courtroom}
                    onChange={(e) => setEditingHearing({ ...editingHearing, courtroom: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hearing Date</label>
                  <input
                    type="date"
                    value={
                      editingHearing.hearingDate
                        ? new Date(editingHearing.hearingDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) => setEditingHearing({ ...editingHearing, hearingDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={editingHearing.hearingTime}
                    onChange={(e) => setEditingHearing({ ...editingHearing, hearingTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Presiding Judge</label>
                <input
                  type="text"
                  value={editingHearing.judgeName}
                  onChange={(e) => setEditingHearing({ ...editingHearing, judgeName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose</label>
                <input
                  type="text"
                  value={editingHearing.purpose}
                  onChange={(e) => setEditingHearing({ ...editingHearing, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingHearing(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Reschedule</span>
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
