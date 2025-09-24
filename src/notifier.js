import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: +process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

/**
 * Send an alert if something goes wrong—but never crash your job.
 */
export async function notifyError(err) {
  // skip if no mail host configured
  if (!process.env.MAIL_HOST) return

  try {
    await transporter.sendMail({
      to:      process.env.ALERT_EMAIL_TO   || 'you@yourdomain.com',
      from:    process.env.ALERT_EMAIL_FROM || 'bot@yourdomain.com',
      subject: 'TikTok Analytics Job Failed',
      text:    `The analytics job threw an error:\n\n${err.stack}`
    })
  } catch (mailErr) {
    console.warn('⚠️ notifyError failed, continuing:', mailErr.message)
    // do not re-throw
  }
}
