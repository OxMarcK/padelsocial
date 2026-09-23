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
 * Gmail's dark mode (especially the mobile app) repaints flat background
 * colors dark regardless of `color-scheme` meta tags, `bgcolor` attributes,
 * or inline CSS — all three were tried and all three got overridden. What
 * Gmail's color-flip doesn't touch is an actual background *image*, so the
 * white fill here is a repeating 1×1 white PNG (public/email/white-pixel.png)
 * rather than a color, on both the page and the card. */
function emailShell(bodyHtml: string): string {
  const whitePixel = "https://agenda.padelsocial.nl/email/white-pixel.png";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<style>
/* Gmail's dark mode also flips any near-black inline text color (like our
   #0E2318 ink) to near-white — even inside a forced-white card — regardless
   of the color-scheme meta tag above. When dark mode repaints an element it
   tags it with data-ogsc; this selector uses that tag to force our original
   color straight back. Mid-grey text (#5C7266) is under Gmail's flip
   threshold and doesn't need this. */
[data-ogsc] .ps-ink { color: #0E2318 !important; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#F5F8F5;" bgcolor="#F5F8F5" background="${whitePixel}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" background="${whitePixel}" style="background-color:#F5F8F5;background-image:url('${whitePixel}');" bgcolor="#F5F8F5">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="420" cellpadding="0" cellspacing="0" border="0" background="${whitePixel}" style="max-width:420px;background-color:#ffffff;background-image:url('${whitePixel}');border-radius:20px;" bgcolor="#ffffff">
<tr>
<td background="${whitePixel}" style="padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0E2318;background-color:#ffffff;background-image:url('${whitePixel}');" bgcolor="#ffffff">
<img src="https://agenda.padelsocial.nl/logo/S.png" alt="Padel Social" width="140" style="display:block;height:auto;margin:0 0 28px;" />
${bodyHtml}
</td>
</tr>
</table>
</td>
</tr>
</table>
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
  const dayMonth = new Date(`${date}T00:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
  const html = emailShell(`
    <h2 class="ps-ink" style="margin:0 0 12px;font-size:22px;font-weight:800;color:#0E2318;">Betaling ontvangen</h2>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#5C7266;">Hoi ${memberName}, we hebben je betaling voor <strong class="ps-ink" style="color:#0E2318;">${sessionTitle}</strong> ontvangen. Tot dan!</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#5C7266;">${fmtWeekday(date)} ${dayMonth}, ${startTime}<br/>${location}</p>
  `);
  await sendEmail({ to, subject: `Betaling ontvangen — ${sessionTitle}`, html });
}
