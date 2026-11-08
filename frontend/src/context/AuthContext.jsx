import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Default mock profiles for each role to demonstrate the Phase 2 UI
export const DEMO_PROFILES = {
  ADMIN: {
    _id: 'usr_admin_01',
    name: 'Adv. Rajeshwar Sharma',
    email: 'admin@jurismanagement.in',
    role: 'ADMIN',
    designation: 'Managing Partner & Chief Administrator',
    avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=80',
    badge: 'Senior Advocate / Administrator'
  },
  LAWYER: {
    _id: 'usr_lawyer_01',
    name: 'Adv. Mamillapally Abhishek',
    email: 'abhishek@jurismanagement.in',
    role: 'LAWYER',
    designation: 'Senior Litigation Counsel (Bar ID: TS/2026/51762)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badge: 'High Court Counsel'
  },
  CLIENT: {
    _id: 'usr_client_01',
    name: 'Vikramaditya Rao',
    email: 'vikram.rao@enterprise.com',
    role: 'CLIENT',
    designation: 'Director, Zenith Technologies Ltd',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badge: 'Corporate Litigant'
  },
  CLERK: {
    _id: 'usr_clerk_01',
    name: 'Suresh Chandra',
    email: 'suresh.clerk@jurismanagement.in',
    role: 'CLERK',
    designation: 'Registrar & Court Records Clerk',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    badge: 'Bench Clerk'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('juris_user');
    return saved ? JSON.parse(saved) : DEMO_PROFILES.ADMIN;
  });
  const [token, setToken] = useState(() => localStorage.getItem('juris_token') || 'demo_jwt_token_phase2');

  useEffect(() => {
    if (user) {
      localStorage.setItem('juris_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('juris_user');
    }
  }, [user]);

  // Role Switcher for Phase 2 UI Testing
  const switchRole = (newRole) => {
    if (DEMO_PROFILES[newRole]) {
      setUser(DEMO_PROFILES[newRole]);
    }
  };

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('juris_token', jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('juris_token');
    localStorage.removeItem('juris_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, switchRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
