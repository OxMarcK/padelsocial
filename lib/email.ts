import "server-only";
import { fmtWeekday } from "./share-metadata";

const FROM = "Padel Social <no-reply@auth.padelsocial.nl>";

/**
 * Thin wrapper around Resend's HTTP API — no SDK dependency for one endpoint.
 * Never throws: a failed transactional email shouldn't roll back the admin
 * action that triggered it (e.g. a reservation already marked paid in the DB).
 * Missing RESEND_API_KEY (e.g. local dev without it set) just skips sending.
 */
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`RESEND_API_KEY ontbreekt — e-mail niet verstuurd (${subject}, naar ${to})`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) console.error(`Resend-mail mislukt (${subject}, naar ${to}): ${await res.text()}`);
  } catch (err) {
    console.error(`Resend-mail mislukt (${subject}, naar ${to}):`, err);
  }
}

/** Same visual language as the Supabase auth-email template: logo, ink text,
 * muted grey for secondary lines — see the "Magic link or OTP" template in
 * the Supabase dashboard for the sibling version of this layout.
 *
 * Explicit white backgrounds (on both <body> and the card) plus the
 * color-scheme meta tags keep this light in Gmail/Apple Mail dark mode —
 * without them, clients repaint the transparent card dark and the dark-ink
 * logo/text become unreadable. This one goes through Resend directly (full
 * control over the HTML document), unlike the Supabase auth-email template,
 * which only accepts a body fragment and can't carry a <head>. */
function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
</head>
<body style="margin:0;padding:0;background-color:#F5F8F5;">
<div style="background-color:#F5F8F5;padding:32px 16px;">
<div style="max-width:420px;margin:0 auto;background-color:#ffffff;border-radius:20px;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0E2318;">
<img src="https://agenda.padelsocial.nl/logo/S.png" alt="Padel Social" width="140" style="display:block;height:auto;margin:0 0 28px;" />
${bodyHtml}
</div>
</div>
</body>
</html>`;
}

export async function sendPaymentConfirmedEmail({
  to,
  memberName,
  sessionTitle,
  date,
  startTime,
  location,
}: {
  to: string;
  memberName: string;
  sessionTitle: string;
  date: string;
  startTime: string;
  location: string;
}): Promise<void> {
  const html = emailShell(`
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;">Betaling ontvangen</h2>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#5C7266;">Hoi ${memberName}, we hebben je betaling voor <strong style="color:#0E2318;">${sessionTitle}</strong> ontvangen. Tot dan!</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#5C7266;">${fmtWeekday(date)} ${startTime}<br/>${location}</p>
  `);
  await sendEmail({ to, subject: `Betaling ontvangen — ${sessionTitle}`, html });
}
