import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axios from 'axios';
import { SquareParking, User, Mail, Lock, Phone, Loader2, AlertCircle, LogIn, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const RegisterDriver = () => {
  const { loadUser } = useAuth();
  const navigate = useNavigate();

  // Mode state: 'login' or 'register'
  const [mode, setMode] = useState('login');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setFormError('');
    // Reset fields
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
  };

  const validateForm = () => {
    if (!email.trim() || !password) {
      setFormError('Email and password are required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (password.length < 5) {
      setFormError('Password must be at least 5 characters long');
      return false;
    }

    if (mode === 'register') {
      if (!name.trim() || !phone.trim() || !confirmPassword) {
        setFormError('All fields are required for registration');
        return false;
      }

      if (name.trim().length < 2) {
        setFormError('Name must be at least 2 characters long');
        return false;
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone.trim())) {
        setFormError('Please enter a valid 10-digit phone number');
        return false;
      }

      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setFormError('');

      if (mode === 'register') {
        // Driver Registration Call
        const res = await axios.post(
          `${API_URL}/auth/register-driver`,
          {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            password,
          },
          { withCredentials: true }
        );

        if (res.data && res.data.success) {
          // Synchronize auth context state
          await loadUser();
          navigate('/dashboard/driver');
        } else {
          setFormError(res.data.message || 'Registration failed');
        }
      } else {
        // Driver Login Call
        const res = await axios.post(
          `${API_URL}/auth/login-driver`,
          {
            email: email.trim().toLowerCase(),
            password,
          },
          { withCredentials: true }
        );

        if (res.data && res.data.success) {
          // Synchronize auth context state
          await loadUser();
          navigate('/dashboard/driver');
        } else {
          setFormError(res.data.message || 'Login failed');
        }
      }
    } catch (err) {
      console.error('Submit Error:', err);
      const errMsg = err.response?.data?.message || 'An error occurred. Please try again.';
      setFormError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-800">
      {/* Decorative gradient glowing ambient circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Light Clean Card Container */}
      <div className="w-full max-w-md space-y-6 bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-2xl relative z-10">
        
        {/* Toggle Mode Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-slate-955 shadow-sm border border-slate-200/50 font-semibold'
                : 'text-white/70 hover:text-white font-medium'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            Driver Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-slate-955 shadow-sm border border-slate-200/50 font-semibold'
                : 'text-white/70 hover:text-white font-medium'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Register Driver
          </button>
        </div>

        {/* Header branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-500/30 mb-4 hover:scale-105 transition-transform duration-300">
            <SquareParking className="h-8 w-8" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-2">
            Driver Portal
          </span>
          <h2 className="text-3xl font-black tracking-tight text-slate-955">
            {mode === 'login' ? 'Driver Sign In' : 'Create Driver Account'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-[280px] mx-auto">
            {mode === 'login' 
              ? 'Sign in to access your reserved spots and live bookings.' 
              : 'Sign up to map and instantly book secure parking spots in seconds.'}
          </p>
        </div>

        {/* Form Notifications */}
        {formError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Register Mode Only) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-955">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-450" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFormError(''); }}
                  disabled={loading}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-sm text-neutral-800 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:opacity-50 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-955">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-slate-450" />
              </div>
              <input
                id="email"
                type="email"
                required
                placeholder="john@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormError(''); }}
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-sm text-neutral-800 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          {/* Phone Field (Register Mode Only) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-955">
                Phone Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-slate-450" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  maxLength="10"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setFormError(''); }}
                  disabled={loading}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-sm text-neutral-800 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:opacity-50 transition-all"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-955">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-slate-450" />
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
                disabled={loading}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-sm text-neutral-800 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          {/* Confirm Password (Register Mode Only) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-955">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-450" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFormError(''); }}
                  disabled={loading}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-sm text-neutral-800 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none disabled:opacity-50 transition-all"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3.5 px-6 text-sm font-bold text-slate-955 shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing request...
              </>
            ) : (
              mode === 'login' ? 'Sign In as Driver' : 'Register as Driver'
            )}
          </button>
        </form>

        {/* Footer selector fallback */}
        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-700">
            Want to list your parking spaces instead?{' '}
            <Link
              to="/register/owner"
              className="font-bold text-amber-600 hover:text-amber-800 transition-colors hover:underline"
            >
              Join as Spot Owner
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterDriver;
