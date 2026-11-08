import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('juris_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore authenticated session from backend on page refresh
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('juris_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.data && response.data.data.user) {
          setUser(response.data.data.user);
        }
      } catch (err) {
        console.warn('Session expired or invalid token. Clearing credentials.');
        localStorage.removeItem('juris_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Real Backend Login
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: jwtToken } = response.data.data;

      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('juris_token', jwtToken);
      return { success: true, user: userData };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Login failed. Please check your credentials or network.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Real Backend Registration (Strictly CLIENT role)
  const register = async (userData) => {
    setAuthError(null);
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, token: jwtToken } = response.data.data;

      setUser(newUser);
      setToken(jwtToken);
      localStorage.setItem('juris_token', jwtToken);
      return { success: true, user: newUser };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Real Backend Logout
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API call failed, clearing client state regardless.');
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('juris_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
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
