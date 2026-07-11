const nodemailer = require('nodemailer');

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Sends booking confirmation email
 * @param {string} email - Driver email
 * @param {Object} bookingDetails - Booking info object
 */
const sendBookingConfirmation = async (email, bookingDetails) => {
  const transporter = getTransporter();
  
  const formattedStart = new Date(bookingDetails.startTime).toLocaleString('en-IN');
  const formattedEnd = new Date(bookingDetails.endTime).toLocaleString('en-IN');

  const message = {
    from: `ParkSpot <${process.env.EMAIL_FROM || 'noreply@parkspot.in'}>`,
    to: email,
    subject: 'Booking Confirmed - ParkSpot',
    text: `Your booking is confirmed!\n\nBooking Details:\nSpot ID: ${bookingDetails.spot}\nStart Time: ${formattedStart}\nEnd Time: ${formattedEnd}\nTotal Price: ₹${bookingDetails.totalPrice}`,
    html: `<h3>Your booking is confirmed!</h3>
           <p><strong>Booking Details:</strong></p>
           <ul>
             <li><strong>Spot ID:</strong> ${bookingDetails.spot}</li>
             <li><strong>Start Time:</strong> ${formattedStart}</li>
             <li><strong>End Time:</strong> ${formattedEnd}</li>
             <li><strong>Total Price:</strong> ₹${bookingDetails.totalPrice}</li>
           </ul>`
  };

  const info = await transporter.sendMail(message);
  console.log(`Booking confirmation email sent: ${info.messageId}`);
};

/**
 * Sends a reminder email before booking ends
 * @param {string} email - Driver email
 * @param {string} timeRemaining - Description of remaining time (e.g. '10 minutes')
 */
const sendReminder = async (email, timeRemaining) => {
  const transporter = getTransporter();

  const message = {
    from: `ParkSpot <${process.env.EMAIL_FROM || 'noreply@parkspot.in'}>`,
    to: email,
    subject: `Reminder: Your booking ends in ${timeRemaining}!`,
    text: `This is a reminder that your active parking reservation ends in ${timeRemaining}. Please prepare to remove your vehicle or extend your booking if possible.`,
    html: `<h3>Parking Slot Reminder</h3>
           <p>This is a reminder that your active parking reservation ends in <strong>${timeRemaining}</strong>.</p>
           <p>Please prepare to remove your vehicle or request an extension via your driver dashboard.</p>`
  };

  const info = await transporter.sendMail(message);
  console.log(`Reminder email sent: ${info.messageId}`);
};

module.exports = {
  sendBookingConfirmation,
  sendReminder
};
