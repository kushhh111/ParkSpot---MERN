import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Menu, X, SquareParking, User, LogOut, LayoutDashboard, Compass } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Search Spots', path: '/', icon: Compass, roles: ['driver', 'owner', 'admin', null] },
    { name: 'Driver Dashboard', path: '/dashboard/driver', icon: LayoutDashboard, roles: ['driver'] },
    { name: 'Owner Dashboard', path: '/dashboard/owner', icon: LayoutDashboard, roles: ['owner'] },
    { name: 'Admin Dashboard', path: '/dashboard/admin', icon: LayoutDashboard, roles: ['admin'] },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (link.roles.includes(null)) return true;
    return user && link.roles.includes(user.role);
  });

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md text-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAB308] text-[#262626] shadow-sm group-hover:scale-105 transition-transform duration-300">
                <SquareParking className="h-6 w-6" />
              </div>
              <span className="text-slate-200 text-xl font-black tracking-tight">
                Park<span className="text-[#EAB308]">Spot</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <div className="flex items-center gap-1">
              {filteredLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                      }`
                    }
                  >
                    <IconComponent className="h-4 w-4" />
                    {link.name}
                  </NavLink>
                );
              })}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
              {user ? (
                <div className="flex items-center gap-4">
                  {/* User Profile Badge */}
                  <div className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 px-3 py-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAB308] text-[10px] font-black text-[#262626] uppercase">
                      {user.name ? user.name.substring(0, 2) : 'US'}
                    </div>
                    <div className="flex flex-col">
                      <span className="max-w-[100px] truncate text-xs font-semibold text-slate-200">
                        {user.name}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-850 hover:border-red-500/30 hover:bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 transition-all duration-250 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-lg bg-[#EAB308] px-4 py-2 text-xs font-bold text-[#262626] shadow-sm hover:bg-[#ca8a04] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    Register Now
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-450 hover:bg-slate-900 hover:text-slate-100 focus:outline-none transition-colors border border-transparent hover:border-slate-800"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-2 pt-2 pb-4 space-y-1">
          {filteredLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-violet-600/10 text-violet-400 border-l-4 border-violet-500'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`
                }
              >
                <IconComponent className="h-5 w-5" />
                {link.name}
              </NavLink>
            );
          })}

          <div className="border-t border-slate-800 pt-4 mt-4 px-4">
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAB308] text-sm font-black text-[#262626] uppercase">
                    {user.name ? user.name.substring(0, 2) : 'US'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">{user.name}</p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-lg border border-slate-800 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-lg bg-[#EAB308] py-2.5 text-sm font-bold text-[#262626] shadow-sm hover:bg-[#ca8a04] transition-all"
                >
                  Register Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
