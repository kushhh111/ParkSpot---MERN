import React, { useState } from 'react';
import api from '../services/api';
import { X, Star, Sparkles, MessageSquare, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const ReviewFormModal = ({ booking, onClose, onSave }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars');
      return;
    }

    if (!comment.trim()) {
      setError('Please add a comment summarizing your parking experience');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/reviews', {
        bookingId: booking._id,
        rating,
        comment: comment.trim(),
      });

      if (res.data && res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSave) {
            onSave(res.data.data);
          }
          onClose();
        }, 1500);
      } else {
        setError(res.data?.message || 'Failed to submit review');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Review submission failed. Have you already reviewed this spot?');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl relative animate-scaleUp overflow-hidden">
        
        {/* Header */}
        <div className="border-b border-slate-850 p-5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#EAB308]/15 text-[#ca8a04] flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 tracking-tight">
                Rate Parking Experience
              </h2>
              <p className="text-[10px] text-slate-400">Share details for {booking.spot?.title || 'this listing'}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={loading || success}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-100 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        {success ? (
          <div className="p-8 text-center space-y-3.5 animate-scaleUp">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-100">Review Submitted!</h4>
              <p className="text-xs text-emerald-400 font-semibold mt-1">Thank you for rating your stay.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Error panel */}
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Stars Selector */}
            <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tap to Rate</span>
              
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isStarred = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      disabled={loading}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-slate-600 transition-transform hover:scale-110 disabled:opacity-50 cursor-pointer"
                    >
                      <Star 
                        className={`h-8 w-8 transition-colors ${
                          isStarred ? 'fill-amber-500 text-amber-500' : 'text-slate-700'
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-black text-amber-400">
                {rating === 5 ? 'Excellent (5/5)' : rating === 4 ? 'Good (4/5)' : rating === 3 ? 'Average (3/5)' : rating === 2 ? 'Poor (2/5)' : 'Terrible (1/5)'}
              </span>
            </div>

            {/* Comment details */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Feedback Details</label>
              <textarea
                required
                rows="4"
                disabled={loading}
                placeholder="How was the spot? Security camera active? Safe neighborhood? Easy parking lock entry?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="block w-full rounded-xl border border-slate-850 bg-slate-950/80 py-2.5 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#EAB308] focus:outline-none focus:ring-1 focus:ring-[#EAB308] resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="border-t border-slate-850 pt-4 flex justify-end gap-3 bg-slate-900">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 py-2.5 px-4 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#EAB308] py-2.5 px-5 text-xs font-bold text-[#262626] shadow-md hover:bg-[#ca8a04] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting Rating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ReviewFormModal;
