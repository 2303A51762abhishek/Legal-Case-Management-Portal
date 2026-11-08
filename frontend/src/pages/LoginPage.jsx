import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Lock, Mail, Shield, User, ArrowRight, Gavel, CheckCircle } from 'lucide-react';
import { useAuth, DEMO_PROFILES } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@jurismanagement.in');
  const [password, setPassword] = useState('Admin@123');
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const profile = DEMO_PROFILES[selectedRole];
    login(profile, 'demo_jwt_token_phase2');
    navigate('/dashboard');
  };

  const handleQuickLogin = (role) => {
    setSelectedRole(role);
    const profile = DEMO_PROFILES[role];
    setEmail(profile.email);
    setPassword(`${role.charAt(0) + role.slice(1).toLowerCase()}@123`);
    login(profile, 'demo_jwt_token_phase2');
    navigate('/dashboard');
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
            <p className="text-xs text-slate-400 mt-0.5">Enter your bar/client credentials to access dockets</p>
          </div>

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
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all mt-2"
            >
              <span>Access Legal Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-2.5">
              1-Click Demo Evaluation Sign In
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['ADMIN', 'LAWYER', 'CLIENT', 'CLERK'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleQuickLogin(role)}
                  className="px-3 py-2 bg-slate-800/80 hover:bg-blue-900/60 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 text-[11px] font-semibold transition-all text-left flex items-center justify-between"
                >
                  <span>{role}</span>
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                </button>
              ))}
            </div>
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
