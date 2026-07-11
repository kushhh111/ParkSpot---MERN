import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Building, SquareParking } from 'lucide-react';

const Register = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 relative text-slate-700">
      
      {/* Light Clean Card Container */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-10 md:p-14 shadow-xl text-center space-y-12 relative z-10">
        
        {/* Header Title */}
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xl shadow-amber-500/20 mx-auto mb-4 hover:rotate-12 transition-transform duration-300">
            <SquareParking className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-200 sm:text-4xl">
            Choose Your Account Type
          </h2>
          <p className="max-w-md mx-auto text-sm text-slate-600">
            Select how you would like to join ParkSpot today to search for secure spots or list your empty space to start earning.
          </p>
        </div>

        {/* Two selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          
          {/* Option 1: Driver */}
          <div className="flex flex-col items-center p-8 bg-slate-50 border border-slate-200 hover:border-amber-500/60 rounded-2xl hover:shadow-md transition-all duration-300 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-550/10 text-amber-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Car className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-[#262626] mb-3">
              Driver
            </h3>
            <p className="text-xs text-slate-600 text-center mb-8 h-12 flex items-center justify-center">
              Search, map, and instantly book secure parking spaces near you.
            </p>
            <Link
              to="/register/driver"
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-center block cursor-pointer"
            >
              Register as a Driver
            </Link>
          </div>

          {/* Option 2: Owner */}
          <div className="flex flex-col items-center p-8 bg-slate-50 border border-slate-200 hover:border-amber-500/60 rounded-2xl hover:shadow-md transition-all duration-300 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-550/10 text-amber-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Building className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-[#262626] mb-3">
              Spot Owner
            </h3>
            <p className="text-xs text-slate-600 text-center mb-8 h-12 flex items-center justify-center">
              List your unused spots, configure pricing, and receive payouts.
            </p>
            <Link
              to="/register/owner"
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 py-3.5 px-4 text-sm font-bold text-white shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-center block cursor-pointer"
            >
              Register as an Owner
            </Link>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-sm text-[#4b5563]">
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

export default Register;
