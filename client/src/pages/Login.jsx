import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { SquareParking, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login, error: authError, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get redirect path from ProtectedRoute context, default to home page
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear any previous errors when user types
    setFormError('');
    setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setFormError('All fields are required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 5) {
      setFormError('Password must be at least 5 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await login(formData.email, formData.password);
      if (res.success) {
        // Redirection based on role or original path
        navigate(from, { replace: true });
      } else {
        setFormError(res.error || 'Login failed');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async (role) => {
    const credentials = {
      driver: { email: 'driver@parkspot.in', password: 'password123' },
      owner: { email: 'owner@parkspot.in', password: 'password123' },
      admin: { email: 'admin@parkspot.in', password: 'password123' },
    };

    const target = credentials[role];
    setFormData(target);
    setFormError('');
    setError(null);

    try {
      setLoading(true);
      const res = await login(target.email, target.password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setFormError(res.error || 'Login failed');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-xl shadow-violet-500/20 mb-4 hover:rotate-12 transition-transform duration-300">
            <SquareParking className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Securely sign in to manage your bookings or parking spots.
          </p>
        </div>

        {/* Login Glassmorphic Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error alerts */}
            {(formError || authError) && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError || authError}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#ca8a04] hover:text-[#a16207] transition-colors hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick-fill helper for local MVP testing */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Developer Quick-Test Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTestLogin('driver')}
                disabled={loading}
                className="rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Driver Account
              </button>
              <button
                type="button"
                onClick={() => handleTestLogin('owner')}
                disabled={loading}
                className="rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Owner Account
              </button>
              <button
                type="button"
                onClick={() => handleTestLogin('admin')}
                disabled={loading}
                className="rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-950 py-2 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Admin Account
              </button>
            </div>
          </div>
        </div>

        {/* Footer link to registration */}
        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-bold text-[#ca8a04] hover:text-[#a16207] transition-colors hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
