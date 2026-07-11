const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendReminder } = require('./emailService');

/**
 * Starts cron jobs to manage active bookings:
 * 1. Warns drivers 10 minutes before their booking ends.
 * 2. Auto-completes expired bookings and updates slot inventory.
 */
const startReminderScheduler = (io) => {
  // Cron 1: Run every minute to send warnings
  cron.schedule('* * * * *', async () => {
    try {
      console.log('[Scheduler] Checking for bookings ending in 10 minutes...');
      
      const now = new Date();
      const tenMinutesFromNowStart = new Date(now.getTime() + 9.5 * 60 * 1000);
      const tenMinutesFromNowEnd = new Date(now.getTime() + 10.5 * 60 * 1000);

      const bookings = await Booking.find({
        status: { $in: ['confirmed', 'active'] },
        endTime: {
          $gte: tenMinutesFromNowStart,
          $lte: tenMinutesFromNowEnd
        },
        reminderSent: { $ne: true }
      }).populate('driver');

      if (bookings.length === 0) {
        return;
      }

      console.log(`[Scheduler] Found ${bookings.length} booking(s) ending in 10 minutes. Sending reminders...`);

      for (const booking of bookings) {
        if (booking.driver && booking.driver.email) {
          try {
            await sendReminder(booking.driver.email, '10 minutes');
            booking.reminderSent = true;
            await booking.save();
          } catch (emailErr) {
            console.error(`[Scheduler] Failed to send reminder email to ${booking.driver.email}: ${emailErr.message}`);
          }
        }
      }
    } catch (err) {
      console.error(`[Scheduler] Error running reminder cron job: ${err.message}`);
    }
  });

  // Cron 2: Run every minute to auto-complete expired bookings and release slot capacity
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const expiredBookings = await Booking.find({
        status: { $in: ['confirmed', 'active'] },
        endTime: { $lt: now }
      });

      if (expiredBookings.length > 0) {
        console.log(`[Scheduler] Found ${expiredBookings.length} expired booking(s). Transitioning to completed...`);
        for (const booking of expiredBookings) {
          booking.status = 'completed';
          await booking.save();
          
          // Emit dynamic slot release event to all map dashboard pins
          if (io) {
            io.emit('spot:available', { spotId: booking.spot._id });
          }
        }
      }
    } catch (err) {
      console.error(`[Scheduler] Error running expired bookings completion cron job: ${err.message}`);
    }
  });

  console.log('[Scheduler] 10-minute warning and auto-release cron schedulers started.');
};

module.exports = startReminderScheduler;
