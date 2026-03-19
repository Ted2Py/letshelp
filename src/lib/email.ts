/**
 * Email Utilities for LetsHelp
 *
 * This module provides email functionality for session summaries and notifications.
 * Currently logs to console - can be extended with Resend, SendGrid, or other providers.
 *
 * To enable email sending:
 * 1. Install an email package (e.g., `pnpm add resend`)
 * 2. Add API key to .env
 * 3. Update sendEmail() function
 */

export interface SessionSummaryEmailParams {
  recipientEmail: string;
  recipientName: string;
  sessionDate: Date;
  duration: number; // in seconds
  summary: string | undefined;
  transcript: string | undefined;
  issueCategory: string | undefined;
}

/**
 * Generate HTML email template for session summary
 */
export function generateSummaryEmailTemplate(params: SessionSummaryEmailParams): string {
  const { recipientName, sessionDate, duration, summary, transcript, issueCategory } = params;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LetsHelp Session Summary</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1E5A8D 0%, #2563EB 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
    .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
    .section h3 { margin-top: 0; color: #1E5A8D; }
    .label { font-weight: 600; color: #5A6B7F; }
    .transcript { background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
    .footer { text-align: center; padding: 20px; color: #5A6B7F; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-resolved { background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤝 LetsHelp Session Summary</h1>
    </div>
    <div class="content">
      <div class="section">
        <h3>Session Details</h3>
        <p><span class="label">For:</span> ${recipientName}</p>
        <p><span class="label">When:</span> ${formatDate(sessionDate)}</p>
        <p><span class="label">Duration:</span> ${formatDuration(duration)}</p>
        ${issueCategory ? `<p><span class="label">Topic:</span> <span class="badge badge-resolved">${issueCategory}</span></p>` : ''}
      </div>

      ${summary ? `
      <div class="section">
        <h3>What Was Discussed</h3>
        <p>${summary}</p>
      </div>
      ` : ''}

      ${transcript ? `
      <div class="section">
        <h3>Full Transcript</h3>
        <div class="transcript">${transcript}</div>
      </div>
      ` : ''}

      <div class="footer">
        <p>This summary was automatically generated after a LetsHelp support session.</p>
        <p>Questions? Contact us at support@letshelp.com</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send session summary email
 *
 * NOTE: Currently just logs to console. To enable actual email sending:
 * 1. Install Resend: `pnpm add resend`
 * 2. Add RESEND_API_KEY to .env
 * 3. Uncomment the Resend code below
 */
export async function sendSessionSummaryEmail(params: SessionSummaryEmailParams): Promise<{ success: boolean; error?: string }> {
  const html = generateSummaryEmailTemplate(params);

  // Log to console (for development)
  // eslint-disable-next-line no-console
  console.log(`
═══════════════════════════════════════════════════════════════
📧 SESSION SUMMARY EMAIL
═══════════════════════════════════════════════════════════════
To: ${params.recipientEmail}
Subject: LetsHelp Session Summary - ${new Date(params.sessionDate).toLocaleDateString()}

${html}
═══════════════════════════════════════════════════════════════
  `);

  // TODO: Enable actual email sending with Resend or similar
  //
  // if (typeof process.env.RESEND_API_KEY === 'string') {
  //   const { Resend } = await import('resend');
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //
  //   try {
  //     await resend.emails.send({
  //       from: 'LetsHelp <noreply@letshelp.com>',
  //       to: params.recipientEmail,
  //       subject: `LetsHelp Session Summary - ${new Date(params.sessionDate).toLocaleDateString()}`,
  //       html,
  //     });
  //     return { success: true };
  //   } catch (error) {
  //     console.error('Failed to send email:', error);
  //     return { success: false, error: 'Failed to send email' };
  //   }
  // }

  return { success: true };
}

/**
 * Check if email summaries are enabled
 */
export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY || !!process.env.SENDGRID_API_KEY;
}
