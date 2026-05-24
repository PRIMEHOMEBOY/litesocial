import { Resend } from 'resend';
import { logger } from '../lib/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'noreply@litesocial.xyz';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function sendVerificationEmail(email, token, username) {
  const url = `${APP_URL}/auth/verify-email?token=${token}`;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Verify your LiteSocial email',
      html: emailTemplate({
        title: 'Verify your email',
        body: `Hi ${username}, welcome to LiteSocial! Click the button below to verify your email address.`,
        cta: { label: 'Verify Email', url },
        footer: 'This link expires in 24 hours.',
      }),
    });
  } catch (e) {
    logger.error('Failed to send verification email:', e.message);
  }
}

export async function sendPasswordResetEmail(email, token, username) {
  const url = `${APP_URL}/auth/reset-password?token=${token}`;
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Reset your LiteSocial password',
      html: emailTemplate({
        title: 'Reset your password',
        body: `Hi ${username}, we received a request to reset your password. Click the button below to set a new password.`,
        cta: { label: 'Reset Password', url },
        footer: 'This link expires in 1 hour. If you didn\'t request this, ignore this email.',
      }),
    });
  } catch (e) {
    logger.error('Failed to send password reset email:', e.message);
  }
}

export async function sendPaymentConfirmationEmail(email, amount, creatorName, expiresAt) {
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Payment confirmed — subscribed to ${creatorName}`,
      html: emailTemplate({
        title: 'Subscription Activated!',
        body: `Your payment of ${amount} LTC has been confirmed on the Litecoin blockchain. You now have access to all premium content from ${creatorName}.`,
        cta: { label: 'View Premium Content', url: `${APP_URL}` },
        footer: `Your subscription expires on ${new Date(expiresAt).toLocaleDateString()}.`,
      }),
    });
  } catch (e) {
    logger.error('Failed to send payment confirmation:', e.message);
  }
}

// ── Simple HTML email template ────────────────────────────────────────────────
function emailTemplate({ title, body, cta, footer }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#0d0d0d;border:1px solid #1a1a1a;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#9b63ff,#f7931a);padding:24px;text-align:center;">
      <span style="font-family:monospace;font-weight:700;font-size:22px;color:#fff;">LiteSocial</span>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#fff;font-size:20px;margin:0 0 12px;">${title}</h2>
      <p style="color:#888;font-size:15px;line-height:1.6;margin:0 0 24px;">${body}</p>
      <a href="${cta.url}" style="display:inline-block;background:#9b63ff;color:#fff;text-decoration:none;padding:13px 28px;border-radius:12px;font-weight:600;font-size:15px;">${cta.label}</a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #1a1a1a;">
      <p style="color:#444;font-size:12px;margin:0;">${footer}</p>
    </div>
  </div>
</body>
</html>`;
}
