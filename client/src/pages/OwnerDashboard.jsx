import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import SpotFormModal from '../components/SpotFormModal';
import io from 'socket.io-client';
import { 
  Building, IndianRupee, Star, ClipboardList, PlusCircle, 
  Trash2, Edit, CheckCircle, Clock, Calendar, 
  Loader2, AlertCircle, Phone, User, ShieldAlert 
} from 'lucide-react';

const OwnerDashboard = () => {
  const { user } = useAuth();
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState('spots'); // 'spots' or 'bookings'

  // Data states
  const [spots, setSpots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  // Operations UI states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardSuccess, setDashboardSuccess] = useState('');

  // Socket notification banner
  const [socketNotification, setSocketNotification] = useState('');

  // Initial Fetches
  useEffect(() => {
    fetchSpots();
    fetchBookings();
  }, []);

  // WebSockets Real-Time Sync
  useEffect(() => {
    if (!user) return;

    // Connect to backend websocket server
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000');

    // Join private channel room matching Owner Mongoose ID
    socket.emit('join', user._id);

    // Live confirmed bookings alerts
    socket.on('booking:confirmed', (data) => {
      fetchBookings();
      setSocketNotification('🎉 Real-Time Alert: A driver has paid and confirmed a booking on your spot!');
      setTimeout(() => setSocketNotification(''), 6000);
    });

    // Live cancellations alerts
    socket.on('booking:cancelled', (data) => {
      fetchBookings();
      setSocketNotification('⚠️ Real-Time Alert: A booking on your parking spot has been cancelled.');
      setTimeout(() => setSocketNotification(''), 6000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchSpots = async () => {
    try {
      setLoadingSpots(true);
      const res = await api.get('/spots/my-spots');
      if (res.data && res.data.success) {
        setSpots(res.data.data || []);
      }
    } catch (err) {
      setDashboardError('Failed to load your parking spot listings');
    } finally {
      setLoadingSpots(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await api.get('/bookings/owner-bookings');
      if (res.data && res.data.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      setDashboardError('Failed to load customer reservation logs');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleToggleActive = async (spotId, currentStatus) => {
    try {
      setDashboardError('');
      setDashboardSuccess('');
      
      const res = await api.put(`/spots/${spotId}`, {
        isActive: !currentStatus
      });

      if (res.data && res.data.success) {
        setSpots(spots.map(s => s._id === spotId ? res.data.data : s));
        setDashboardSuccess(`Spot listing ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setDashboardSuccess(''), 3000);
      }
    } catch (err) {
      setDashboardError(err.response?.data?.message || 'Toggle visibility operation failed');
    }
  };

  const handleDeleteSpot = async (spotId) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this parking listing? This action is irreversible.')) {
      return;
    }

    try {
      setDashboardError('');
      setDashboardSuccess('');

      const res = await api.delete(`/spots/${spotId}`);
      if (res.data && res.data.success) {
        setSpots(spots.filter(s => s._id !== spotId));
        setDashboardSuccess('Parking spot listed has been removed successfully');
        setTimeout(() => setDashboardSuccess(''), 3000);
      }
    } catch (err) {
      setDashboardError(err.response?.data?.message || 'Delete listed spot operation failed');
    }
  };

  // Computations
  const activeSpotsCount = spots.filter(s => s.isActive).length;
  const totalEarnings = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const averageRating = spots.length > 0
    ? (spots.reduce((sum, s) => sum + (s.rating || 0), 0) / spots.length).toFixed(1)
    : 'N/A';

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] text-slate-100 p-6 sm:p-10 relative overflow-hidden">
      
      {/* Ambient backgrounds */}
      <div className="absolute top-10 right-1/4 w-80 h-80 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Floating Socket Alert banner */}
      {socketNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 border border-violet-500/30 text-slate-100 rounded-xl p-4 shadow-2xl flex items-start gap-3 animate-scaleUp">
          <ShieldAlert className="h-5 w-5 text-violet-400 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <p className="text-xs font-black text-white">Live Update Received</p>
            <p className="text-xs text-slate-400 mt-1">{socketNotification}</p>
          </div>
          <button 
            onClick={() => setSocketNotification('')}
            className="text-slate-500 hover:text-slate-350 text-xs font-bold pl-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Owner Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, <span className="text-[#EAB308] font-bold">{user?.name}</span>. Manage listed spots, monitor bookings, and view payouts.
            </p>
          </div>
          <button 
            onClick={() => {
              setEditingSpot(null);
              setIsFormOpen(true);
            }}
            className="rounded-xl bg-[#EAB308] hover:bg-[#ca8a04] px-5 py-2.5 text-xs font-bold text-[#262626] shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            Add New Spot
          </button>
        </div>

        {/* Global Error/Success Displays */}
        {dashboardError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{dashboardError}</span>
          </div>
        )}
        {dashboardSuccess && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{dashboardSuccess}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-850 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Listings</p>
                <p className="text-2xl font-black mt-0.5 text-slate-100">{activeSpotsCount} / {spots.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-850 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
                <IndianRupee className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Earnings</p>
                <p className="text-2xl font-black mt-0.5 text-slate-100">₹{totalEarnings.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-850 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Average Rating</p>
                <p className="text-2xl font-black mt-0.5 text-slate-100">
                  {averageRating !== 'N/A' ? `${averageRating} ★` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Panels Selector Tabs */}
        <div className="border-b border-slate-800">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('spots')}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'spots'
                  ? 'border-[#EAB308] text-[#EAB308] font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              My Parking Listings ({spots.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'bookings'
                  ? 'border-[#EAB308] text-[#EAB308] font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Driver Reservations ({bookings.length})
            </button>
          </div>
        </div>

        {/* Tab content sections */}
        {activeTab === 'spots' ? (
          
          /* listings Workspace */
          <div>
            {loadingSpots ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-550 text-xs">
                <Loader2 className="h-6 w-6 animate-spin mb-2" /> Loading listing records...
              </div>
            ) : spots.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Spot Details</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Capacity (Slots)</th>
                      <th className="px-6 py-4">Rate</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                    {spots.map((spot, index) => (
                      <tr 
                        key={spot._id}
                        className={index % 2 === 0 ? 'bg-slate-900/10' : 'bg-slate-900/30'}
                      >
                        {/* Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center shrink-0">
                              {spot.photos && spot.photos.length > 0 ? (
                                <img 
                                  src={spot.photos[0].startsWith('/') ? `http://127.0.0.1:5000${spot.photos[0]}` : spot.photos[0]} 
                                  alt={spot.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Building className="h-4.5 w-4.5 text-slate-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-200 truncate max-w-[200px]">{spot.title}</h4>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                                {spot.spotType} • {spot.vehicleType === 'both' ? 'Car/Bike' : spot.vehicleType}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4">
                          <div className="min-w-0 text-slate-300">
                            <p className="truncate max-w-[150px] font-semibold">{spot.address}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{spot.city}, {spot.pincode}</p>
                          </div>
                        </td>

                        {/* Capacity */}
                        <td className="px-6 py-4 font-bold text-slate-300">
                          {spot.totalSlots || 1}
                        </td>

                        {/* Rate */}
                        <td className="px-6 py-4 font-black text-emerald-450 text-emerald-400">
                          ₹{spot.pricePerHour}/hr
                        </td>

                        {/* Status Toggle */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(spot._id, spot.isActive)}
                            className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide border shadow-sm transition-all cursor-pointer ${
                              spot.isActive 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-600 hover:text-white' 
                                : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            {spot.isActive ? 'Active' : 'Hidden'}
                          </button>
                        </td>

                        {/* Operations Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => {
                                  setEditingSpot(spot);
                                  setIsFormOpen(true);
                                }}
                              className="rounded-lg p-1.5 border border-slate-800 bg-slate-900 text-slate-400 hover:bg-[#EAB308] hover:text-[#262626] hover:border-[#EAB308] transition-all cursor-pointer"
                              title="Edit Listing"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSpot(spot._id)}
                              className="rounded-lg p-1.5 border border-slate-800 bg-slate-900 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-650 transition-all cursor-pointer"
                              title="Delete Listing"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                <Building className="h-10 w-10 text-slate-650 mx-auto mb-4 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">No Parking Spots Listed</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  You haven't listed any parking spaces yet. Click the "Add New Spot" button above to publish your first spot.
                </p>
              </div>
            )}
          </div>
        ) : (
          
          /* bookings logs workspace */
          <div>
            {loadingBookings ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-550 text-xs">
                <Loader2 className="h-6 w-6 animate-spin mb-2" /> Loading reservation logs...
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div 
                    key={booking._id}
                    className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row justify-between lg:items-center gap-5 hover:border-slate-800 transition-all duration-200"
                  >
                    {/* Spot info & customer info details */}
                    <div className="flex gap-4 items-start min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        {booking.spot?.photos && booking.spot.photos.length > 0 ? (
                          <img 
                            src={booking.spot.photos[0].startsWith('/') ? `http://127.0.0.1:5000${booking.spot.photos[0]}` : booking.spot.photos[0]} 
                            alt={booking.spot?.title}
                            className="h-full w-full object-cover rounded-xl"
                          />
                        ) : (
                          <Building className="h-5 w-5 text-slate-600" />
                        )}
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-200 truncate">{booking.spot?.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-350">
                            <User className="h-3.5 w-3.5 text-[#EAB308]" /> {booking.driver?.name}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Phone className="h-3 w-3" /> {booking.driver?.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* slot timings details */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 bg-slate-950/40 border border-slate-850 p-3 rounded-xl max-w-sm lg:w-80">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#EAB308]" /> Arrival Date
                        </span>
                        <p className="font-bold text-slate-200">
                          {new Date(booking.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#EAB308]" /> Slot Hours
                        </span>
                        <p className="font-bold text-slate-200">
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Price, status metrics */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between border-t border-slate-800/80 lg:border-none pt-4 lg:pt-0 gap-3 shrink-0">
                      <div className="text-left lg:text-right">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Earnings</p>
                        <p className="text-base font-extrabold text-[#EAB308]">₹{booking.totalPrice}</p>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        {/* Status badges */}
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border ${
                          booking.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : booking.paymentStatus === 'refunded'
                            ? 'bg-slate-900 text-slate-400 border border-slate-800'
                            : 'bg-amber-500/10 text-[#ca8a04] border border-amber-500/20'
                        }`}>
                          {booking.paymentStatus}
                        </span>

                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border ${
                          booking.status === 'confirmed' || booking.status === 'completed'
                            ? 'bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30'
                            : booking.status === 'cancelled'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-blue-550/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
                <ClipboardList className="h-10 w-10 text-slate-600 mx-auto mb-4 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-350">No Reservations Found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Drivers haven't booked any slots on your listed spaces yet. Keep listings active to increase visibility.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Spot listing modal form overlays */}
      {isFormOpen && (
        <SpotFormModal
          spot={editingSpot}
          onClose={() => {
            setIsFormOpen(false);
            setEditingSpot(null);
          }}
          onSave={(savedSpot) => {
            fetchSpots();
            setDashboardSuccess(editingSpot ? 'Listing updated successfully' : 'Parking spot listed successfully');
            setTimeout(() => setDashboardSuccess(''), 3000);
          }}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
