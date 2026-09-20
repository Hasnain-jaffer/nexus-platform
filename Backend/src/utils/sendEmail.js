const nodemailer = require('nodemailer');

// Uses Gmail SMTP by default (matches .env.example). To use Gmail specifically,
// EMAIL_PASS must be a 16-character "App Password", not your normal Gmail
// password — generate one at https://myaccount.google.com/apppasswords
// (requires 2-Step Verification to be turned on for your Google account).
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email. If EMAIL_USER / EMAIL_PASS aren't configured, logs a
 * warning and skips sending instead of crashing — keeps local dev usable
 * without forcing every contributor to set up SMTP credentials.
 */
async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  EMAIL_USER/EMAIL_PASS not set in .env — email not sent. Set them to enable real password-reset emails.');
    return;
  }

  await transporter.sendMail({
    from: `"Business Nexus" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;