import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboardView } from '../components/dashboard/AdminDashboardView';
import { LawyerDashboardView } from '../components/dashboard/LawyerDashboardView';
import { ClientDashboardView } from '../components/dashboard/ClientDashboardView';
import { ClerkDashboardView } from '../components/dashboard/ClerkDashboardView';

export const DashboardPage = () => {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  switch (role) {
    case 'ADMIN':
      return <AdminDashboardView />;
    case 'LAWYER':
      return <LawyerDashboardView />;
    case 'CLIENT':
      return <ClientDashboardView />;
    case 'CLERK':
      return <ClerkDashboardView />;
    default:
      return <AdminDashboardView />;
  }
};

export default DashboardPage;
