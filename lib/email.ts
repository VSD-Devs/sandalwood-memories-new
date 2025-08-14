import { Resend } from "resend"

export function isResendAvailable() {
  return Boolean(process.env.RESEND_API_KEY)
}

export async function sendVerificationEmailResend(toEmail: string, verifyUrl: string) {
  if (!isResendAvailable()) {
    throw new Error("Resend not configured")
  }
  const resend = new Resend(process.env.RESEND_API_KEY as string)
  const from = process.env.EMAIL_FROM || "Sandalwood Memories <no-reply@sandalwoodmemories.example>"

  await resend.emails.send({
    from,
    to: toEmail,
    subject: "Verify your email",
    html: `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#0f172a">
        <h2 style="color:#E90B64;">Sandalwood Memories</h2>
        <p>Please verify your email address to secure your account.</p>
        <p><a href="${verifyUrl}" style="background:#e11d48;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Verify email</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      </div>
    `,
  })
}


