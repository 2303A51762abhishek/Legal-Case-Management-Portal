import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@jurismanagement.in');
  const [password, setPassword] = useState('Admin@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-fills demo credentials into input fields for real MongoDB authentication
  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 shadow-xl shadow-blue-500/20 text-white mb-3">
            <Scale className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">JurisFlow Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Legal Case & Court Hearing Management System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-7 shadow-2xl">
          <div className="mb-5 pb-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Secure Portal Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">Authenticating against MongoDB with JWT & bcrypt</p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="name@jurismanagement.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Access Legal Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credential Autofill */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-2.5">
              Autofill Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin@jurismanagement.in', 'Admin@123')}
                className="px-3 py-2 bg-slate-800/80 hover:bg-blue-900/60 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 text-[11px] font-semibold transition-all text-left flex items-center justify-between"
              >
                <span>ADMIN</span>
                <CheckCircle className="w-3 h-3 text-purple-400" />
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('abhishek@jurismanagement.in', 'Lawyer@123')}
                className="px-3 py-2 bg-slate-800/80 hover:bg-blue-900/60 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 text-[11px] font-semibold transition-all text-left flex items-center justify-between"
              >
                <span>LAWYER</span>
                <CheckCircle className="w-3 h-3 text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('vikram.rao@enterprise.com', 'Client@123')}
                className="px-3 py-2 bg-slate-800/80 hover:bg-blue-900/60 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 text-[11px] font-semibold transition-all text-left flex items-center justify-between"
              >
                <span>CLIENT</span>
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('suresh.clerk@jurismanagement.in', 'Clerk@123')}
                className="px-3 py-2 bg-slate-800/80 hover:bg-blue-900/60 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 text-[11px] font-semibold transition-all text-left flex items-center justify-between"
              >
                <span>CLERK</span>
                <CheckCircle className="w-3 h-3 text-amber-400" />
              </button>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Need client portal access?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
              Register as Client
            </Link>
          </div>
        </div>

        {/* University Student Credentials Footer */}
        <div className="text-center mt-6 text-slate-400 text-[11px] leading-relaxed">
          <p className="font-semibold text-slate-300">MAMILLAPALLY ABHISHEK • Roll No: 2303A51762</p>
          <p>B.Tech IV-I Project • DevOps & Full Stack • Academic Year 2026–2027</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
