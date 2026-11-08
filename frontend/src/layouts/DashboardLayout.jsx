import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { Info } from 'lucide-react';

export const DashboardLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Navbar */}
        <Navbar setIsMobileOpen={setIsMobileOpen} />

        {/* Phase 2 Prototype Information Banner */}
        <div className="bg-slate-900 text-slate-300 text-[11px] px-6 py-1.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>
              <strong>Phase 2 Design & Layout Inspection Mode:</strong> Active Role is <strong className="text-white bg-blue-700/80 px-1.5 py-0.5 rounded text-[10px]">{user?.role}</strong>. (Switch roles anytime in the top bar to inspect each user interface).
            </span>
          </div>
          <span className="hidden md:inline text-slate-400">
            Frontend: React 18 + Tailwind CSS • Dev Server Active
          </span>
        </div>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
