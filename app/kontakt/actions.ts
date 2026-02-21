"use server";

const DEFAULT_RECIPIENT_EMAIL = "ladygagastudio@gmail.com";

export type ContactInquiryPayload = {
  name: string;
  email: string;
  message: string;
  createdAt: number;
};

type SendInquiryEmailResult =
  | { ok: true }
  | { ok: false; error: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildInquiryText(payload: ContactInquiryPayload) {
  return [
    "Novi upit sa kontakt forme",
    `Vreme: ${new Date(payload.createdAt).toLocaleString("sr-Latn-RS")}`,
    "",
    `Ime: ${payload.name}`,
    `Email: ${payload.email}`,
    "",
    "Poruka:",
    payload.message,
  ].join("\n");
}

function buildInquiryHtml(payload: ContactInquiryPayload) {
  return `
    <div style="background:#f4f5f7;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#202735,#101828);color:#ffffff;padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Kontakt forma</p>
          <h1 style="margin:0;font-size:24px;">Novi upit klijenta</h1>
          <p style="margin:8px 0 0;font-size:13px;opacity:.92;">Vreme: ${escapeHtml(
            new Date(payload.createdAt).toLocaleString("sr-Latn-RS"),
          )}</p>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 8px;"><strong>Ime:</strong> ${escapeHtml(payload.name)}</p>
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
          <div style="margin-top:14px;border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#f9fafb;">
            <p style="margin:0 0 6px;font-weight:700;">Poruka</p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.55;">${escapeHtml(payload.message)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function sendContactInquiryEmail(payload: ContactInquiryPayload): Promise<SendInquiryEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ORDER_FROM_EMAIL ?? "Studio Lady Gaga <onboarding@resend.dev>";
  const recipient =
    process.env.CONTACT_NOTIFICATION_EMAIL ??
    process.env.ORDER_NOTIFICATION_EMAIL ??
    DEFAULT_RECIPIENT_EMAIL;

  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY nije postavljen. Upit je sačuvan, ali email nije poslat.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipient],
      subject: `Novi upit: ${payload.name}`,
      html: buildInquiryHtml(payload),
      text: buildInquiryText(payload),
      reply_to: payload.email,
    }),
  });

  if (response.ok) {
    return { ok: true };
  }

  let details = `HTTP ${response.status}`;
  try {
    const data = (await response.json()) as { message?: string; error?: string };
    if (data.message) details = data.message;
    if (data.error) details = data.error;
  } catch {
    const fallbackText = await response.text();
    if (fallbackText) {
      details = fallbackText;
    }
  }

  return {
    ok: false,
    error: `Slanje emaila nije uspelo (${details}).`,
  };
}
