import React from 'react';
import useAuth from '../hooks/useAuth';
import { Shield, Users, Building, ClipboardCheck, Star } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] text-slate-100 p-6 sm:p-10 relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-red-500" />
              Admin Portal
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome, Administrator <span className="text-red-400 font-semibold">{user?.name}</span>. Perform system health audits, moderate lists, and track platform telemetry.
            </p>
          </div>
          <div className="rounded-xl bg-red-950/20 border border-red-500/20 px-4 py-2 text-xs font-semibold text-red-400">
            System Status: Healthy
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-600/10 text-red-400 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-bold mt-1 text-slate-100">3</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-600/10 text-red-400 flex items-center justify-center">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Spots</p>
                <p className="text-2xl font-bold mt-1 text-slate-100">0</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-600/10 text-red-400 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Bookings Processed</p>
                <p className="text-2xl font-bold mt-1 text-slate-100">0</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-600/10 text-red-400 flex items-center justify-center">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Platform Rating</p>
                <p className="text-2xl font-bold mt-1 text-slate-100">5.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Administration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="font-extrabold text-lg text-slate-200 border-b border-slate-800/80 pb-4 mb-6">
              Spot Verification Queue
            </h3>
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <Building className="h-12 w-12 mb-4" />
              <p className="text-sm font-semibold text-slate-300">All spot listings are currently verified</p>
              <p className="text-xs mt-1">
                New listings submitted by hosts will appear here for verification reviews.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <h3 className="font-extrabold text-lg text-slate-200 border-b border-slate-800/80 pb-4">
              System Log Monitor
            </h3>
            
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-850 font-mono text-[11px] text-slate-400 leading-relaxed space-y-2 h-[200px] overflow-y-auto">
              <div>[SYSTEM] <span className="text-green-500">OK</span> - HTTP server listening on port 5000</div>
              <div>[SYSTEM] <span className="text-green-500">OK</span> - MongoDB cluster connected successfully</div>
              <div>[SYSTEM] <span className="text-green-500">OK</span> - Socket.io engine initialized</div>
              <div>[TELEMETRY] 0 drivers online, 0 hosts active</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
