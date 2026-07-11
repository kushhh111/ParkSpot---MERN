const nodemailer = require('nodemailer');

/**
 * Sends an email using Nodemailer.
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Text version of the email body
 * @param {string} [options.html] - HTML version of the email body
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `ParkSpot <${process.env.EMAIL_FROM || 'noreply@parkspot.in'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  const info = await transporter.sendMail(message);
  console.log(`Email sent successfully: ${info.messageId}`);
};

module.exports = sendEmail;
