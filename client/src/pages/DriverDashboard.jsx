import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import ReviewFormModal from '../components/ReviewFormModal';
import io from 'socket.io-client';
import { 
  Car, Calendar, MapPin, ClipboardList, Clock, IndianRupee, Star, 
  Map, MessageSquare, HelpCircle, Loader2, AlertCircle, CheckCircle, 
  Compass, ShieldAlert, BadgeX, Navigation 
} from 'lucide-react';

const DriverDashboard = () => {
  const { user } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  // Data states
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reviews selection
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState([]);

  // Socket notification banner
  const [socketNotification, setSocketNotification] = useState('');

  // Fetch driver bookings
  useEffect(() => {
    fetchBookings();
  }, []);

  // WebSockets Real-Time Sync
  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000');

    // Join driver private channel room
    socket.emit('join', user._id);

    // Live confirmed bookings alerts
    socket.on('booking:confirmed', (data) => {
      fetchBookings();
      setSocketNotification('🎉 Real-Time Alert: Your payment was verified and spot booking is confirmed!');
      setTimeout(() => setSocketNotification(''), 6000);
    });

    // Live cancellations alerts (e.g. host cancellations or auto-cancel refunds)
    socket.on('booking:cancelled', (data) => {
      fetchBookings();
      setSocketNotification('⚠️ Real-Time Alert: Your parking spot booking has been cancelled.');
      setTimeout(() => setSocketNotification(''), 6000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/bookings/my-bookings');
      if (res.data && res.data.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch your booking reservation history');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const start = new Date(booking.startTime);
    const hoursToStart = (start - new Date()) / (1000 * 60 * 60);
    
    // Check if cancellation occurs less than 2 hours before the start time
    const willLoseRefund = hoursToStart < 2 && booking.paymentStatus === 'paid';
    
    let confirmMsg = 'Are you sure you want to cancel this parking reservation?';
    if (willLoseRefund) {
      confirmMsg = `⚠️ WARNING: This reservation starts in less than 2 hours (in ${hoursToStart.toFixed(1)} hours). Cancelling now will FORFEIT your refund of ₹${booking.totalPrice}. Are you sure you want to cancel?`;
    } else if (booking.paymentStatus === 'paid') {
      confirmMsg = `This reservation starts in ${hoursToStart.toFixed(1)} hours. Cancelling now entitles you to a full auto-refund of ₹${booking.totalPrice}. Confirm cancellation?`;
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const res = await api.put(`/bookings/${booking._id}/cancel`);
      if (res.data && res.data.success) {
        setSuccess(res.data.refundTriggered 
          ? `Booking cancelled successfully! A full refund of ₹${booking.totalPrice} has been processed.`
          : 'Booking cancelled successfully. Note: cancellation was within the 2-hour window, so no refund is processed.'
        );
        fetchBookings();
        setTimeout(() => setSuccess(''), 6000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation request failed');
    }
  };

  // Computations
  const activeBookings = bookings.filter(b => ['pending', 'confirmed', 'active'].includes(b.status));
  const pastBookings = bookings.filter(b => ['completed', 'cancelled', 'refunded'].includes(b.status) || (b.status === 'confirmed' && new Date(b.endTime) < new Date()));

  const totalSpent = bookings
    .filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const activeCount = activeBookings.length;

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] text-slate-100 p-6 sm:p-10 relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Floating Socket Alert banner */}
      {socketNotification && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900 border border-violet-500/30 text-slate-100 rounded-xl p-4 shadow-2xl flex items-start gap-3 animate-scaleUp">
          <ShieldAlert className="h-5 w-5 text-violet-400 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <p className="text-xs font-black text-white">Live Updates Alert</p>
            <p className="text-xs text-slate-400 mt-1">{socketNotification}</p>
          </div>
          <button 
            onClick={() => setSocketNotification('')}
            className="text-slate-500 hover:text-slate-300 text-xs font-bold pl-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Driver Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, <span className="text-[#ca8a04] font-semibold">{user?.name}</span>. Manage your bookings, navigate to spots, and submit feedback.
            </p>
          </div>
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300">
            Registered phone: {user?.phone}
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-850 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Bookings</p>
                <p className="text-2xl font-black mt-0.5 text-slate-100">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-850 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Slots</p>
                <p className="text-2xl font-black mt-0.5 text-slate-100">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-md hover:border-slate-850 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center">
                <IndianRupee className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Expenses</p>
                <p className="text-2xl font-black mt-0.5 text-slate-100">₹{totalSpent.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-slate-800">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'border-[#EAB308] text-[#ca8a04] font-black'
                  : 'border-transparent text-slate-400 hover:text-[#262626]'
              }`}
            >
              Active Reservations ({activeBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-[#EAB308] text-[#ca8a04] font-black'
                  : 'border-transparent text-slate-400 hover:text-[#262626]'
              }`}
            >
              History & Feedback ({pastBookings.length})
            </button>
          </div>
        </div>

        {/* Dynamic content rendering panels */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-xs">
            <Loader2 className="h-6 w-6 animate-spin mb-2" /> Fetching your reservation history...
          </div>
        ) : activeTab === 'active' ? (
          
          /* Active reservations list */
          <div className="space-y-4">
            {activeBookings.length > 0 ? (
              activeBookings.map((booking) => {
                const coords = booking.spot?.location?.coordinates;
                const directionsUrl = coords && coords.length >= 2
                  ? `https://www.google.com/maps/search/?api=1&query=${coords[1]},${coords[0]}`
                  : '#';
                
                return (
                  <div 
                    key={booking._id} 
                    className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row justify-between lg:items-center gap-5 hover:border-slate-800 transition-all duration-200"
                  >
                    {/* Spot info & pricing */}
                    <div className="flex gap-4 items-start min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        {booking.spot?.photos && booking.spot.photos.length > 0 ? (
                          <img 
                            src={booking.spot.photos[0].startsWith('/') ? `http://127.0.0.1:5000${booking.spot.photos[0]}` : booking.spot.photos[0]} 
                            alt={booking.spot?.title}
                            className="h-full w-full object-cover rounded-xl"
                          />
                        ) : (
                          <Car className="h-5 w-5 text-slate-700" />
                        )}
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-200 truncate">{booking.spot?.title}</h4>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          {booking.spot?.address}, {booking.spot?.city}
                        </p>
                      </div>
                    </div>

                    {/* Timing Schedule details */}
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 bg-slate-950/40 border border-slate-850 p-3 rounded-xl max-w-sm lg:w-80">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#ca8a04]" /> Reservation Date
                        </span>
                        <p className="font-bold text-slate-200">
                          {new Date(booking.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#ca8a04]" /> Allocated Timings
                        </span>
                        <p className="font-bold text-slate-200">
                          {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Cost, badges & Actions panel */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between border-t border-slate-800/80 lg:border-none pt-4 lg:pt-0 gap-4 shrink-0">
                      <div className="text-left lg:text-right">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Paid Amount</p>
                        <p className="text-base font-extrabold text-[#ca8a04]">₹{booking.totalPrice} <span className="text-[10px] text-slate-500 font-semibold">({booking.durationHours} hrs)</span></p>
                      </div>
                      
                      <div className="flex gap-2.5 items-center">
                        {directionsUrl !== '#' && (
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-slate-800 hover:border-[#EAB308]/40 bg-slate-950 hover:bg-[#EAB308]/15 hover:text-[#EAB308] p-2 text-slate-400 transition-all flex items-center gap-1.5 text-xs font-bold"
                            title="Get Google Maps Navigation Directions"
                          >
                            <Navigation className="h-4 w-4" />
                            Directions
                          </a>
                        )}

                        <button
                          onClick={() => handleCancelBooking(booking)}
                          className="rounded-lg border border-slate-800 hover:border-red-500/25 bg-slate-950 hover:bg-red-500/10 hover:text-red-400 px-3 py-2 text-xs font-bold text-slate-400 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 border border-dashed border-slate-850 rounded-2xl">
                <Compass className="h-10 w-10 text-slate-700 mx-auto mb-4 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">No Active Bookings</h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
                  You don't have any active parkings scheduled. Search for spots on the home map and book a slot to begin.
                </p>
                <div className="pt-4">
                  <a 
                    href="/" 
                    className="inline-block rounded-xl bg-[#EAB308] px-5 py-2.5 text-xs font-bold text-[#262626] shadow-md hover:bg-[#EAB308] active:scale-[0.98] transition-all"
                  >
                    Search Parking Spots
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          
          /* History bookings panel list */
          <div className="space-y-4">
            {pastBookings.length > 0 ? (
              pastBookings.map((booking) => {
                const isReviewed = reviewedBookingIds.includes(booking._id);
                const isCancelled = booking.status === 'cancelled';
                
                return (
                  <div 
                    key={booking._id} 
                    className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row justify-between lg:items-center gap-5 hover:border-slate-850 transition-all duration-200"
                  >
                    {/* Spot details */}
                    <div className="flex gap-4 items-start min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0">
                        {booking.spot?.photos && booking.spot.photos.length > 0 ? (
                          <img 
                            src={booking.spot.photos[0].startsWith('/') ? `http://127.0.0.1:5000${booking.spot.photos[0]}` : booking.spot.photos[0]} 
                            alt={booking.spot?.title}
                            className="h-full w-full object-cover rounded-xl"
                          />
                        ) : (
                          <Car className="h-5 w-5 text-slate-700" />
                        )}
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-200 truncate">{booking.spot?.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border ${
                            isCancelled 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {booking.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(booking.startTime).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking duration & rate info */}
                    <div className="text-xs text-slate-400 bg-slate-950/40 border border-slate-850 px-4 py-3 rounded-xl lg:w-48 text-left lg:text-center">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cost Details</p>
                      <p className="font-black text-slate-200 mt-0.5">₹{booking.totalPrice} <span className="text-[10px] text-slate-500 font-medium">({booking.durationHours} hrs)</span></p>
                    </div>

                    {/* Actions feedback button */}
                    <div className="flex items-center justify-between border-t border-slate-800/80 lg:border-none pt-4 lg:pt-0 gap-3 shrink-0 text-right">
                      {!isCancelled && (
                        <div className="flex gap-2">
                          {isReviewed ? (
                            <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle className="h-4 w-4" /> Reviewed
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedBookingForReview(booking)}
                              className="rounded-lg border border-slate-800 hover:border-[#EAB308]/40 bg-slate-950 hover:bg-[#EAB308]/15 hover:text-[#EAB308] px-3 py-2 text-xs font-bold text-slate-400 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="h-4 w-4 text-[#EAB308]" />
                              Rate & Review
                            </button>
                          )}
                        </div>
                      )}
                      
                      {isCancelled && (
                        <span className="rounded-lg bg-slate-950 border border-slate-850 px-3.5 py-2 text-xs font-bold text-slate-500 flex items-center gap-1">
                          <BadgeX className="h-4 w-4" /> Cancellation Settled
                        </span>
                      )}
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 border border-dashed border-slate-850 rounded-2xl">
                <ClipboardList className="h-10 w-10 text-slate-700 mx-auto mb-4 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-300">No Booking History Found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  You haven't completed or cancelled any reservations yet. Active spots will list here once checkout completes.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Review Modal Form overlay */}
      {selectedBookingForReview && (
        <ReviewFormModal
          booking={selectedBookingForReview}
          onClose={() => setSelectedBookingForReview(null)}
          onSave={(review) => {
            // Track reviewed booking ID to hide button immediately
            setReviewedBookingIds([...reviewedBookingIds, selectedBookingForReview._id]);
            setSelectedBookingForReview(null);
            setSuccess('Thank you! Your review has been submitted successfully.');
            setTimeout(() => setSuccess(''), 4000);
          }}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
