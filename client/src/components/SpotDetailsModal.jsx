import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import { 
  X, Calendar, Clock, Star, MapPin, Mail, Car, ShieldCheck, 
  Sparkles, ShieldAlert, BadgeCheck, AlertCircle, ArrowRight, Loader2, SquareParking 
} from 'lucide-react';

const SpotDetailsModal = ({ spot: initialSpot, onClose, onBookingSuccess }) => {
  const { user } = useAuth();
  const [spot, setSpot] = useState(initialSpot);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [spotLoading, setSpotLoading] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  // Booking form states
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // Cost & state states
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // Load reviews and spot details on mount or initialSpot change
  useEffect(() => {
    if (!initialSpot) return;

    // Reset states
    setSpot(initialSpot);
    setActivePhoto(0);
    setBookingDate('');
    setStartTime('');
    setEndTime('');
    setCalculatedHours(0);
    setTotalCost(0);
    setValidationError('');
    setBookingSuccessData(null);

    const fetchSpotDetails = async () => {
      try {
        setSpotLoading(true);
        const res = await api.get(`/spots/${initialSpot._id}`);
        if (res.data && res.data.success) {
          setSpot(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load spot details:', err.message);
      } finally {
        setSpotLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const res = await api.get(`/reviews/spot/${initialSpot._id}`);
        if (res.data && res.data.success) {
          setReviews(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err.message);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchSpotDetails();
    fetchReviews();
  }, [initialSpot]);

  // Handle live price computation
  useEffect(() => {
    if (!bookingDate || !startTime || !endTime) {
      setCalculatedHours(0);
      setTotalCost(0);
      return;
    }

    const startDateTime = new Date(`${bookingDate}T${startTime}`);
    const endDateTime = new Date(`${bookingDate}T${endTime}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setValidationError('Invalid date or time format');
      return;
    }

    if (endDateTime <= startDateTime) {
      setCalculatedHours(0);
      setTotalCost(0);
      setValidationError('End time must be strictly after start time');
      return;
    }

    // Verify booking is not in the past (with a 5-minute grace period for latency/clock drift)
    const graceLimit = new Date(Date.now() - 5 * 60 * 1000);
    if (startDateTime < graceLimit) {
      setCalculatedHours(0);
      setTotalCost(0);
      setValidationError('Start time must be in the future');
      return;
    }

    // Verify booking is within next 24 hours
    const maxLimit = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (startDateTime > maxLimit || endDateTime > maxLimit) {
      setCalculatedHours(0);
      setTotalCost(0);
      setValidationError('Bookings are restricted to the next 24 hours only');
      return;
    }

    // Calculate hours (rounded up, matching backend)
    const diffMs = endDateTime - startDateTime;
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    setCalculatedHours(hours);
    setTotalCost(hours * spot.pricePerHour);
    setValidationError('');
  }, [bookingDate, startTime, endTime, spot]);

  if (!spot) return null;

  const isDriver = user && user.role === 'driver';

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isDriver) return;
    
    if (!bookingDate || !startTime || !endTime) {
      setValidationError('Please fill in all booking fields');
      return;
    }

    const startDateTime = new Date(`${bookingDate}T${startTime}`);
    const endDateTime = new Date(`${bookingDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      setValidationError('End time must be after start time');
      return;
    }

    // Verify booking is not in the past (with a 5-minute grace period for latency/clock drift)
    const graceLimit = new Date(Date.now() - 5 * 60 * 1000);
    if (startDateTime < graceLimit) {
      setValidationError('Booking start time must be in the future');
      return;
    }

    // Verify booking is within next 24 hours
    const maxLimit = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (startDateTime > maxLimit || endDateTime > maxLimit) {
      setValidationError('Bookings are restricted to the next 24 hours only.');
      return;
    }

    // Check if the weekday is active for this spot
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chosenDay = weekdayNames[startDateTime.getDay()];
    const isDayAvailable = spot.availability?.days?.includes(chosenDay);

    if (!isDayAvailable) {
      setValidationError(`This parking spot is not listed as active on ${chosenDay}s`);
      return;
    }

    // Check times boundaries (e.g. comparing HH:MM strings)
    const formatTimeNum = (tStr) => parseInt(tStr.replace(':', ''), 10);
    const chosenStart = formatTimeNum(startTime);
    const chosenEnd = formatTimeNum(endTime);
    const limitStart = formatTimeNum(spot.availability?.startTime || '00:00');
    const limitEnd = formatTimeNum(spot.availability?.endTime || '23:59');

    if (chosenStart < limitStart || chosenEnd > limitEnd) {
      setValidationError(
        `Selected hours must fit within the spot's operational slot: ${spot.availability?.startTime} - ${spot.availability?.endTime}`
      );
      return;
    }

    try {
      setCheckoutLoading(true);
      setValidationError('');

      // 1. Create Pending Booking
      const bookingRes = await api.post('/bookings', {
        spot: spot._id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      if (!bookingRes.data || !bookingRes.data.success) {
        throw new Error(bookingRes.data?.message || 'Booking reservation failed');
      }

      const booking = bookingRes.data.data;

      // 2. Initiate Payment Order
      const orderRes = await api.post('/payments/create-order', {
        bookingId: booking._id,
      });

      if (!orderRes.data || !orderRes.data.success) {
        throw new Error(orderRes.data?.message || 'Failed to create payment order');
      }

      const orderData = orderRes.data;

      // 3. Complete Checkout (Mock vs Production Razorpay flow)
      if (orderData.mockMode) {
        // Automatically verify mock payment in test mode
        const verifyRes = await api.post('/payments/verify', {
          bookingId: booking._id,
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}`,
          razorpay_signature: `sig_mock_${Math.random().toString(36).substring(7)}`,
        });

        if (verifyRes.data && verifyRes.data.success) {
          setBookingSuccessData(verifyRes.data.data || booking);
          if (onBookingSuccess) {
            onBookingSuccess(verifyRes.data.data || booking);
          }
        } else {
          throw new Error(verifyRes.data?.message || 'Mock payment verification failed');
        }
      } else {
        // Production Razorpay integration: load Razorpay checkout dialog box
        const options = {
          key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'ParkSpot India',
          description: `Booking for ${spot.title}`,
          order_id: orderData.orderId,
          handler: async (response) => {
            try {
              setCheckoutLoading(true);
              const verifyRes = await api.post('/payments/verify', {
                bookingId: booking._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              if (verifyRes.data && verifyRes.data.success) {
                setBookingSuccessData(verifyRes.data.data || booking);
                if (onBookingSuccess) {
                  onBookingSuccess(verifyRes.data.data || booking);
                }
              } else {
                setValidationError(verifyRes.data?.message || 'Payment signature verification failed.');
              }
            } catch (err) {
              setValidationError(err.response?.data?.message || err.message || 'Signature handshake failed');
            } finally {
              setCheckoutLoading(false);
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone,
          },
          theme: {
            color: '#7c3aed',
          },
        };

        if (window.Razorpay) {
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (resp) {
            setValidationError(`Payment failed: ${resp.error.description}`);
          });
          rzp.open();
        } else {
          throw new Error('Razorpay SDK failed to load. Please refresh the page and try again.');
        }
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Slide-over panel container */}
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto text-slate-100">
          
          {/* Header */}
          <div className="border-b border-slate-800 p-6 flex justify-between items-start bg-slate-900/60 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                  spot.spotType === 'covered' 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' 
                    : spot.spotType === 'basement'
                    ? 'bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20'
                    : 'bg-amber-500/10 text-[#ca8a04] border border-amber-500/20'
                }`}>
                  {spot.spotType} Spot
                </span>
                <span className="inline-flex rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {spot.vehicleType === 'both' ? 'Car & Bike' : `${spot.vehicleType} Only`}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-2 tracking-tight">
                {spot.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <MapPin className="h-3.5 w-3.5 text-[#EAB308] shrink-0" />
                <span className="truncate">{spot.address}, {spot.city}</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="rounded-lg p-2 text-slate-450 hover:bg-slate-850 hover:text-white border border-transparent hover:border-slate-800 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)] bg-slate-900 text-slate-200">
            
            {/* Photos Slider */}
            <div className="relative h-48 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80">
              {spot.photos && spot.photos.length > 0 ? (
                <>
                  <img 
                    src={spot.photos[activePhoto].startsWith('/') ? `http://127.0.0.1:5000${spot.photos[activePhoto]}` : spot.photos[activePhoto]} 
                    alt={spot.title}
                    className="h-full w-full object-cover transition-all duration-300"
                  />
                  {spot.photos.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800">
                      {spot.photos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePhoto(idx)}
                          className={`h-1.5 w-1.5 rounded-full transition-all ${
                            idx === activePhoto ? 'bg-[#EAB308] w-3' : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <SquareParking className="h-10 w-10 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-500">No Photo Listings Uploaded</span>
                </div>
              )}
            </div>

            {/* Price & Rating Bar */}
            <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800 rounded-xl px-5 py-3">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rate</p>
                <div className="flex items-baseline mt-0.5">
                  <span className="text-2xl font-black text-[#EAB308]">₹{spot.pricePerHour}</span>
                  <span className="text-slate-550 text-xs ml-1 font-medium">/ hour</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reviews</p>
                <div className="flex items-center gap-1 mt-1 justify-end">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm font-extrabold text-white">{spot.rating > 0 ? spot.rating.toFixed(1) : 'New'}</span>
                  <span className="text-slate-400 text-xs font-semibold">({spot.totalReviews})</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Spot Description</h4>
              <p className="text-sm text-slate-350 leading-relaxed bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                {spot.description}
              </p>
            </div>

            {/* Operational details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-955/5 bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-[#EAB308]" /> Available Days
                </span>
                <p className="text-xs font-bold text-slate-200 truncate">
                  {spot.availability?.days?.join(', ')}
                </p>
              </div>
              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-[#EAB308]" /> Operating Hours
                </span>
                <p className="text-xs font-bold text-slate-200">
                  {spot.availability?.startTime} - {spot.availability?.endTime}
                </p>
              </div>
            </div>

            {/* Capacity & Occupancy Status Card */}
            <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <SquareParking className="h-3.5 w-3.5 text-[#EAB308]" /> Slot Occupancy
                </span>
                <span className="text-slate-200 font-extrabold normal-case text-xs">
                  {spot.activeBookingsCount || 0} / {spot.totalSlots || 1} slots filled
                </span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="w-full h-2.5 rounded-full bg-slate-800 border border-slate-700/50 overflow-hidden flex">
                <div 
                  className="bg-[#EAB308] transition-all duration-500" 
                  style={{ width: `${((spot.activeBookingsCount || 0) / (spot.totalSlots || 1)) * 100}%` }}
                />
                <div 
                  className="bg-emerald-600 transition-all duration-500 flex-1" 
                />
              </div>

              <div className="flex justify-between text-[10px] font-bold">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308] animate-pulse" />
                  <span>{spot.activeBookingsCount || 0} Booked</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-450 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>{Math.max(0, (spot.totalSlots || 1) - (spot.activeBookingsCount || 0))} Available</span>
                </div>
              </div>
            </div>

            {/* Host Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Listed By (Host)</h4>
              <div className="bg-slate-955/5 bg-slate-950/40 p-4 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#EAB308] text-[#262626] flex items-center justify-center font-bold text-sm">
                  {spot.owner?.name ? spot.owner.name.substring(0, 2).toUpperCase() : 'OW'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{spot.owner?.name}</p>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3 w-3" /> {spot.owner?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Form Card */}
            {bookingSuccessData ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-4 animate-scaleUp">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <BadgeCheck className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">Booking Confirmed!</h4>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">Payment Successful & Spot Reserved</p>
                </div>
                <div className="bg-slate-955/5 bg-slate-950/60 p-4 border border-slate-800 rounded-xl text-left space-y-2.5 text-xs text-slate-300">
                  <p className="flex justify-between font-medium"><span>Booking ID:</span> <span className="font-mono text-slate-200">{bookingSuccessData._id}</span></p>
                  <p className="flex justify-between font-medium"><span>Date:</span> <span className="font-bold text-slate-200">{bookingDate}</span></p>
                  <p className="flex justify-between font-medium"><span>Time slot:</span> <span className="font-bold text-slate-200">{startTime} - {endTime}</span></p>
                  <p className="flex justify-between font-medium"><span>Duration:</span> <span className="font-bold text-slate-200">{calculatedHours} hrs</span></p>
                  <p className="flex justify-between font-medium border-t border-slate-800 pt-2 text-sm text-slate-200 font-bold">
                    <span>Amount Paid:</span> <span>₹{totalCost}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                >
                  Close & View Dashboard
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#EAB308] animate-pulse" /> Reserve Parking Space
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Real-time scheduling</span>
                </div>

                {isDriver ? (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {/* Date Picker */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Calendar className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                          type="date"
                          required
                          value={bookingDate}
                          min={new Date().toLocaleDateString('en-CA')}
                          max={new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-CA')}
                          onChange={(e) => setBookingDate(e.target.value)}
                          disabled={checkoutLoading}
                          className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:border-[#EAB308] focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Time Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Clock className="h-4 w-4 text-slate-500" />
                          </div>
                          <input
                            type="time"
                            required
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            disabled={checkoutLoading}
                            className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:border-[#EAB308] focus:outline-none disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Time</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Clock className="h-4 w-4 text-slate-500" />
                          </div>
                          <input
                            type="time"
                            required
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            disabled={checkoutLoading}
                            className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:border-[#EAB308] focus:outline-none disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Validation Errors */}
                    {validationError && (
                      <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs font-semibold text-red-400 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Calculated Invoice display */}
                    {calculatedHours > 0 && !validationError && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2 text-xs text-slate-400 animate-scaleUp">
                        <p className="flex justify-between"><span>Duration:</span> <span className="font-bold text-slate-200">{calculatedHours} hrs (rounded up)</span></p>
                        <p className="flex justify-between"><span>Rate per hour:</span> <span className="font-bold text-slate-200">₹{spot.pricePerHour}</span></p>
                        <p className="flex justify-between border-t border-slate-800 pt-2 text-sm text-slate-200 font-black">
                          <span>Total Cost:</span> <span>₹{totalCost}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed pt-1.5 flex items-start gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Includes free auto-refunds on cancellation &gt;2h before arrival.</span>
                        </p>
                      </div>
                    )}

                    {/* CTA button */}
                    <button
                      type="submit"
                      disabled={checkoutLoading}
                      className="w-full relative flex items-center justify-center rounded-xl bg-[#EAB308] text-[#262626] hover:bg-[#ca8a04] hover:scale-[1.01] active:scale-[0.99] shadow-sm py-3 px-4 text-sm font-bold disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying Channels...
                        </>
                      ) : (
                        <>
                          Book & Pay Securely <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="rounded-xl border border-[#EAB308]/20 bg-[#EAB308]/5 p-4 text-center space-y-2">
                    <ShieldAlert className="h-5 w-5 text-[#ca8a04] mx-auto" />
                    <p className="text-xs font-semibold text-[#ca8a04]">
                      {user ? 'Only Driver profiles can reserve parking spots.' : 'Sign in to reserve your parking spot.'}
                    </p>
                    {!user && (
                      <div className="pt-2">
                        <a 
                          href="/login" 
                          className="inline-block rounded-lg bg-[#EAB308] hover:bg-[#ca8a04] px-4 py-1.5 text-xs font-bold text-[#262626] transition-colors"
                        >
                          Sign In Now
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Spot Reviews Panel */}
            <div className="space-y-4 border-t border-slate-800 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Feedback & Ratings ({reviews.length})</h4>
              
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-6 text-slate-500 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading reviews...
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-3.5">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="bg-slate-955/5 bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#EAB308] text-[10px] font-bold text-[#262626] flex items-center justify-center uppercase">
                            {rev.driver?.name ? rev.driver.name.substring(0, 2) : 'DR'}
                          </div>
                          <span className="text-xs font-bold text-slate-200">{rev.driver?.name}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${
                                i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-800'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {rev.comment}
                      </p>
                      <p className="text-[9px] text-slate-500 font-medium">
                        Posted on: {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 bg-slate-950/20">
                  No ratings posted for this spot yet.
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SpotDetailsModal;
