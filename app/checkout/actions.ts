"use server";

const DEFAULT_RECIPIENT_EMAIL = "jovanm028@gmail.com";

type CheckoutEmailCustomer = {
  firstName: string;
  lastName: string;
  email?: string;
  street: string;
  number: string;
  postalCode: string;
  city: string;
  phone: string;
  note?: string;
};

type CheckoutEmailItem = {
  title: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  finalUnitPrice: number;
  lineTotal: number;
};

export type CheckoutEmailPayload = {
  orderNumber: string;
  createdAt: number;
  customer: CheckoutEmailCustomer;
  items: CheckoutEmailItem[];
  totals: {
    totalItems: number;
    totalAmount: number;
  };
};

type SendOrderEmailResult =
  | { ok: true }
  | { ok: false; error: string };

function formatRsd(value: number) {
  return `${Math.max(0, Math.round(value)).toLocaleString("sr-Latn-RS")} RSD`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildTextPayload(payload: CheckoutEmailPayload) {
  const lines = [
    `Narudzbina: ${payload.orderNumber}`,
    `Vreme: ${new Date(payload.createdAt).toLocaleString("sr-Latn-RS")}`,
    "",
    "Kupac:",
    `${payload.customer.firstName} ${payload.customer.lastName}`,
    payload.customer.email ? `Email: ${payload.customer.email}` : "",
    `Telefon: ${payload.customer.phone}`,
    `Adresa: ${payload.customer.street} ${payload.customer.number}, ${payload.customer.postalCode} ${payload.customer.city}`,
    payload.customer.note ? `Napomena: ${payload.customer.note}` : "",
    "",
    "Stavke:",
    ...payload.items.map(
      (item, index) =>
        `${index + 1}. ${item.title} | ${item.quantity} x ${formatRsd(item.finalUnitPrice)} = ${formatRsd(item.lineTotal)}`,
    ),
    "",
    `Ukupno komada: ${payload.totals.totalItems}`,
    `Ukupan iznos: ${formatRsd(payload.totals.totalAmount)}`,
  ];
  return lines.filter(Boolean).join("\n");
}

function buildHtmlPayload(payload: CheckoutEmailPayload) {
  const createdAt = new Date(payload.createdAt).toLocaleString("sr-Latn-RS");
  const customerFullName = `${payload.customer.firstName} ${payload.customer.lastName}`.trim();
  const rows = payload.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.title)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatRsd(item.finalUnitPrice))}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatRsd(item.lineTotal))}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="background:#f4f5f7;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#e56f4a,#ca4d2a);color:#ffffff;padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Nova narudzbina</p>
          <h1 style="margin:0;font-size:24px;">${escapeHtml(payload.orderNumber)}</h1>
          <p style="margin:8px 0 0;font-size:13px;opacity:.92;">Kreirano: ${escapeHtml(createdAt)}</p>
        </div>

        <div style="padding:20px;">
          <h2 style="margin:0 0 12px;font-size:18px;">Podaci kupca</h2>
          <p style="margin:0 0 6px;"><strong>Ime i prezime:</strong> ${escapeHtml(customerFullName)}</p>
          ${
            payload.customer.email
              ? `<p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(payload.customer.email)}</p>`
              : ""
          }
          <p style="margin:0 0 6px;"><strong>Telefon:</strong> ${escapeHtml(payload.customer.phone)}</p>
          <p style="margin:0 0 6px;">
            <strong>Adresa:</strong> ${escapeHtml(payload.customer.street)} ${escapeHtml(payload.customer.number)},
            ${escapeHtml(payload.customer.postalCode)} ${escapeHtml(payload.customer.city)}
          </p>
          ${
            payload.customer.note
              ? `<p style="margin:0;"><strong>Napomena:</strong> ${escapeHtml(payload.customer.note)}</p>`
              : ""
          }

          <h2 style="margin:24px 0 12px;font-size:18px;">Stavke porudzbine</h2>
          <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #e5e7eb;">Proizvod</th>
                <th style="text-align:center;padding:10px 12px;border-bottom:1px solid #e5e7eb;">Kolicina</th>
                <th style="text-align:right;padding:10px 12px;border-bottom:1px solid #e5e7eb;">Cena</th>
                <th style="text-align:right;padding:10px 12px;border-bottom:1px solid #e5e7eb;">Ukupno</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div style="margin-top:16px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
            <p style="margin:0 0 6px;"><strong>Ukupno komada:</strong> ${payload.totals.totalItems}</p>
            <p style="margin:0;font-size:18px;"><strong>Ukupan iznos:</strong> ${escapeHtml(formatRsd(payload.totals.totalAmount))}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function sendCheckoutOrderEmail(payload: CheckoutEmailPayload): Promise<SendOrderEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ORDER_FROM_EMAIL ?? "Studio Lady Gaga <onboarding@resend.dev>";
  const recipient = process.env.ORDER_NOTIFICATION_EMAIL ?? DEFAULT_RECIPIENT_EMAIL;

  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY nije postavljen. Narudzbina je sacuvana, ali email nije poslat.",
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
      subject: `Nova narudzbina ${payload.orderNumber}`,
      html: buildHtmlPayload(payload),
      text: buildTextPayload(payload),
      reply_to: payload.customer.email,
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
