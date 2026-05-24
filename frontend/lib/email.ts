// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'LiteSocial <noreply@litesocial.xyz>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/auth/verify-email?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your LiteSocial email',
    html: `
      <div style="background:#080808;color:#fff;font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;border-radius:16px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Welcome to <span style="color:#9b63ff;">LiteSocial</span></h1>
        <p style="color:#888;margin-bottom:24px;">Click the button below to verify your email address.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#9b63ff;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:600;">
          Verify Email
        </a>
        <p style="color:#444;font-size:12px;margin-top:24px;">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your LiteSocial password',
    html: `
      <div style="background:#080808;color:#fff;font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;border-radius:16px;">
        <h1 style="font-size:24px;margin-bottom:8px;"><span style="color:#9b63ff;">LiteSocial</span> Password Reset</h1>
        <p style="color:#888;margin-bottom:24px;">You requested a password reset. Click below to set a new password.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#9b63ff;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
        <p style="color:#444;font-size:12px;margin-top:24px;">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

export async function sendPaymentConfirmationEmail(email: string, amount: string, txHash: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `💰 ${amount} LTC received on LiteSocial`,
    html: `
      <div style="background:#080808;color:#fff;font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;border-radius:16px;">
        <h1 style="font-size:24px;margin-bottom:8px;color:#7ee8a2;">Payment Confirmed ✓</h1>
        <p style="color:#888;margin-bottom:16px;">You received a subscription payment.</p>
        <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:16px;margin-bottom:24px;">
          <div style="font-size:28px;font-weight:700;color:#7ee8a2;font-family:monospace;">${amount} LTC</div>
          <div style="color:#444;font-size:12px;margin-top:8px;font-family:monospace;word-break:break-all;">TX: ${txHash}</div>
        </div>
        <a href="${APP_URL}/earnings" style="display:inline-block;background:#9b63ff;color:#fff;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:600;">
          View Earnings Dashboard
        </a>
      </div>
    `,
  })
}
