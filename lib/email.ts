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
 * Deliberately simple: no forced light-mode background or text-color
 * overrides for the page itself — Gmail's dark mode auto-inverts our plain
 * ink-on-white design into a readable light-on-dark one just fine, the same
 * way it does for any other plain-CSS email. The one thing that inversion
 * can't fix is the logo — a raster image with dark ink baked into the
 * pixels, which goes illegible on a dark background because Gmail can't
 * recolor image content. So just the logo sits in its own small white box
 * (a background *image* — a repeating 1×1 white PNG at
 * public/email/white-pixel.png — rather than a background-color, since
 * Gmail's dark mode repaints flat colors but leaves actual images alone). */
function emailShell(bodyHtml: string): string {
  const whitePixel = "https://agenda.padelsocial.nl/email/white-pixel.png";
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;color:#0E2318;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" background="${whitePixel}" style="background-color:#ffffff;background-image:url('${whitePixel}');border-radius:14px;margin:0 0 28px;" bgcolor="#ffffff">
      <tr><td style="padding:12px 16px;">
        <img src="https://agenda.padelsocial.nl/logo/S.png" alt="Padel Social" width="140" style="display:block;height:auto;" />
      </td></tr>
    </table>
    ${bodyHtml}
  </div>`;
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
  const dayMonth = new Date(`${date}T00:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
  const html = emailShell(`
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;">Betaling ontvangen</h2>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#5C7266;">Hoi ${memberName}, we hebben je betaling voor <strong style="color:#0E2318;">${sessionTitle}</strong> ontvangen. Tot dan!</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#5C7266;">${fmtWeekday(date)} ${dayMonth}, ${startTime}<br/>${location}</p>
  `);
  await sendEmail({ to, subject: `Betaling ontvangen — ${sessionTitle}`, html });
}
