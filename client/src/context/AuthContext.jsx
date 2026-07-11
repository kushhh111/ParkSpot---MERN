import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

// Create authentication context
export const AuthContext = createContext();

// Create AuthProvider wrapper component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Checks for an active session by fetching /me on app load
  const loadUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data && res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      setUser(null);
      // Suppress console errors on initial load check since guest visits are expected
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        setUser(res.data.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (name, email, password, role) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
      });
      if (res.data && res.data.success) {
        setUser(res.data.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Request Driver OTP handler
  const requestDriverRegisterOtp = async (name, email, phone, password) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/register/driver', {
        name,
        email,
        phone,
        password,
      });
      if (res.data && res.data.success) {
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send OTP code';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Verify Driver OTP and complete Login handler
  const verifyDriverOtpAndLogin = async (name, email, phone, password, otp) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/auth/register/driver/verify', {
        name,
        email,
        phone,
        password,
        otp,
      });
      if (res.data && res.data.success) {
        setUser(res.data.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'OTP verification failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      setLoading(true);
      await api.post('/auth/logout');
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout failed:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        loadUser,
        setError,
        requestDriverRegisterOtp,
        verifyDriverOtpAndLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
