import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  UploadCloud,
  FileText,
  File,
  Image,
  Download,
  Trash2,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const DocumentsPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dropdown options
  const [cases, setCases] = useState([]);

  // Filters
  const [selectedCase, setSelectedCase] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [title, setTitle] = useState('');
  const [caseId, setCaseId] = useState('');
  const [docType, setDocType] = useState('PETITION');
  const [isConfidential, setIsConfidential] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Format file size
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper icon based on mime type
  const getFileIcon = (mimeType, fileName = '') => {
    if (mimeType?.includes('pdf') || fileName.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    if (
      mimeType?.includes('word') ||
      mimeType?.includes('officedocument') ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx')
    ) {
      return <File className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType?.includes('image') || fileName.match(/\.(jpg|jpeg|png)$/i)) {
      return <Image className="w-5 h-5 text-emerald-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  // Fetch Documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedCase !== 'ALL') params.caseId = selectedCase;
      if (selectedType !== 'ALL') params.documentType = selectedType;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/documents', { params });
      if (res.data?.success) {
        setDocuments(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.response?.data?.message || 'Failed to load case documents.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Cases for selector
  const fetchCases = async () => {
    try {
      const res = await api.get('/cases');
      if (res.data?.success) {
        setCases(res.data.data.cases || []);
      }
    } catch (err) {
      console.error('Error loading cases:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCase, selectedType]);

  useEffect(() => {
    fetchCases();
  }, []);

  // Handle Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    // 10 MB limit check
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    if (!allowed.includes(ext)) {
      setError('Invalid format. Only PDF, DOC, DOCX, JPG, and PNG documents are allowed.');
      return;
    }
    setError('');
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  // Handle Upload Submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !title || !caseId) {
      setError('Please provide document title, select a legal case, and choose a valid file.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      formData.append('case', caseId);
      formData.append('documentType', docType);
      formData.append('isConfidential', isConfidential);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setSuccessMsg(`Document "${res.data.data.title}" stored securely in vault!`);
        setShowUploadModal(false);
        setTitle('');
        setCaseId('');
        setSelectedFile(null);
        setIsConfidential(false);
        fetchDocuments();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Secure Download
  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc._id}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: doc.mimeType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = doc.fileName || 'court_document.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
      setError(err.response?.data?.message || 'Access denied or document could not be retrieved.');
    }
  };

  // Handle Delete
  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document from the vault?')) return;
    try {
      const res = await api.delete(`/documents/${docId}`);
      if (res.data?.success) {
        setSuccessMsg('Document removed from active vault.');
        fetchDocuments();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete document.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FolderOpen className="w-7 h-7 text-blue-900" />
            <span>Case Document Vault</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Encrypted court filings, vakalatnamas, writ petitions, evidentiary affidavits & judicial orders
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDocuments}
            className="p-2 border border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1"
            title="Refresh Vault"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
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

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Case Filter */}
          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800 max-w-xs"
          >
            <option value="ALL">All Legal Cases</option>
            {cases.map((c) => (
              <option key={c._id} value={c._id}>
                {c.caseReference} — {c.title.slice(0, 25)}...
              </option>
            ))}
          </select>

          {/* Document Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-800"
          >
            <option value="ALL">All Document Types</option>
            <option value="PETITION">Petitions</option>
            <option value="AFFIDAVIT">Affidavits</option>
            <option value="ORDER">Judicial Orders</option>
            <option value="EVIDENCE">Evidence Submissions</option>
            <option value="VAKALATNAMA">Vakalatnama</option>
            <option value="OTHER">Other Documents</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search document title or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDocuments()}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-800"
          />
        </div>
      </div>

      {/* Documents Table / Grid */}
      {loading ? (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200/90">
          <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Accessing secure document repository...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/90 shadow-sm">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No documents found</p>
          <p className="text-xs text-slate-400 mt-1">
            Click "Upload Document" to archive case petitions, court affidavits, or evidence.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Document Title & File</th>
                  <th className="py-3 px-4">Case Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Security Level</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => {
                  const uploadDateStr = doc.createdAt
                    ? new Date(doc.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={doc._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Title & File Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                            {getFileIcon(doc.mimeType, doc.fileName)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{doc.title}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {doc.fileName} • {uploadDateStr}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Case Reference */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-900">
                        {doc.case?.caseReference || 'General'}
                      </td>

                      {/* Document Type Badge */}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                          {doc.documentType}
                        </span>
                      </td>

                      {/* Uploaded By */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">
                          {doc.uploadedBy?.name || 'Authorized User'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {doc.uploadedBy?.role}
                        </span>
                      </td>

                      {/* File Size */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {formatBytes(doc.fileSize)}
                      </td>

                      {/* Confidentiality Level */}
                      <td className="py-3.5 px-4">
                        {doc.isConfidential ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                            <Lock className="w-3 h-3 text-purple-600" />
                            <span>Confidential</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-semibold">
                            <Unlock className="w-3 h-3 text-slate-400" />
                            <span>Standard</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200/60"
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {['ADMIN', 'LAWYER'].includes(user?.role) && (
                            <button
                              onClick={() => handleDelete(doc._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete from Vault"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-bold text-slate-900">Upload to Document Vault</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-4">
              {/* Drag and Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-900 bg-blue-50/50'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-blue-800 bg-slate-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {formatBytes(selectedFile.size)} • Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-700">
                      Click to browse or drag & drop document
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports PDF, DOC, DOCX, JPG, and PNG (Max: 10 MB)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Affidavit on Injunction Application"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Case *
                  </label>
                  <select
                    required
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    <option value="">Select Target Case...</option>
                    {cases.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.caseReference} — {c.title.slice(0, 20)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Document Classification *
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-medium"
                  >
                    <option value="PETITION">Petition / Plaint</option>
                    <option value="AFFIDAVIT">Affidavit / Rejoinder</option>
                    <option value="ORDER">Judicial Order / Judgment</option>
                    <option value="EVIDENCE">Evidence Document</option>
                    <option value="VAKALATNAMA">Vakalatnama / Power of Attorney</option>
                    <option value="OTHER">Other Legal Record</option>
                  </select>
                </div>
              </div>

              {user?.role !== 'CLIENT' && (
                <div className="pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isConfidential}
                      onChange={(e) => setIsConfidential(e.target.checked)}
                      className="w-4 h-4 text-purple-700 border-slate-300 rounded focus:ring-purple-700"
                    />
                    <span className="text-xs text-slate-800 font-semibold flex items-center space-x-1">
                      <Lock className="w-3.5 h-3.5 text-purple-700" />
                      <span>Mark as Attorney-Client Privileged / Confidential</span>
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400 pl-6 mt-0.5">
                    Restricts viewing and downloading to Advocates and Administrators only. Litigant clients cannot access confidential files.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{uploading ? 'Uploading Vault File...' : 'Upload Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
