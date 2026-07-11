import React from 'react';
import { Link } from 'react-router-dom';
import { SquareParking, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-950 px-4 text-center relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center max-w-md space-y-6">
        {/* Logo Section */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-xl shadow-violet-500/20 mb-4 animate-bounce">
          <SquareParking className="h-9 w-9" />
        </div>

        <h1 className="text-7xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-violet-400 bg-clip-text text-transparent">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-slate-200">
          Page Not Found
        </h2>
        
        <p className="text-sm text-slate-400">
          The page you are looking for does not exist or has been moved to a different location.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Home className="h-4 w-4" />
          Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
