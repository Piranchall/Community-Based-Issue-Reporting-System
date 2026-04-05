const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPasswordResetEmail = async (toEmail, resetToken) => {
  const mailOptions = {
    from: `"CivicReport" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'CivicReport — Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your CivicReport account.</p>
      <p>Use the token below to reset your password:</p>
      <h3 style="background:#f4f4f4;padding:10px;letter-spacing:4px;">${resetToken}</h3>
      <p>This token expires in <strong>1 hour</strong>.</p>
      <p>If you did not request this, ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };
