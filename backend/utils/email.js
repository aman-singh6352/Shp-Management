const { Resend } = require("resend");
const logger = require("./logger");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Store Ledger <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    });

    if (error) {
      logger.error(`Email sending failed: ${JSON.stringify(error)}`);
      throw new Error(error.message);
    }

    logger.info(`Email sent to ${to}: ${data.id}`);
    return data;
  } catch (err) {
    logger.error(`Email sending failed: ${err.message}`);
    throw err;
  }
};
