import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { SquareParking, User, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const RegisterOwner = () => {
  const { register, error: authError, setError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setFormError('');
    setError(null);
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name.trim() || !email.trim() || !password) {
      setFormError('All fields are required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (password.length < 5) {
      setFormError('Password must be at least 5 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await register(
        formData.name,
        formData.email,
        formData.password,
        'owner'
      );

      if (res.success) {
        navigate('/dashboard/owner');
      } else {
        setFormError(res.error || 'Registration failed');
      }
    } catch (err) {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 relative text-slate-700">
      
      {/* Light Clean Card Container */}
      <div className="w-full max-w-lg space-y-8 bg-white border border-slate-200 rounded-2xl p-10 md:p-12 shadow-xl relative z-10">
        
        {/* Header branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-500/20 mb-4 hover:rotate-12 transition-transform duration-300">
            <SquareParking className="h-7 w-7" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 bg-amber-100 px-2.5 py-1 rounded-md mb-2">
            Spot Owner
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#262626]">
            Register as Owner
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            List your unused spots, configure dynamic pricing, and earn payouts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Error messaging */}
          {(formError || authError) && (
            <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError || authError}</span>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-[#262626]">
              Full Name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-10 text-sm text-[#262626] placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#262626]">
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
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-10 text-sm text-[#262626] placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#262626]">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-slate-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-10 text-sm text-[#262626] placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-[#262626]">
              Confirm Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-slate-500" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-10 text-sm text-[#262626] placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 py-3 px-6 text-sm font-bold text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Owner Account...
              </>
            ) : (
              'Register as Owner'
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="text-center pt-2">
          <p className="text-sm text-slate-650">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-amber-600 hover:text-amber-800 transition-colors hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterOwner;
