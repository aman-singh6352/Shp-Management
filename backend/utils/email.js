const nodemailer = require("nodemailer");
const logger = require("./logger");

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,       // ⚠️ FILL in .env
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,     // ⚠️ FILL in .env
      pass: process.env.EMAIL_PASS,     // ⚠️ FILL in .env
    },
  });

exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Store Ledger 🏪" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email sending failed: ${err.message}`);
    throw err;
  }
};
