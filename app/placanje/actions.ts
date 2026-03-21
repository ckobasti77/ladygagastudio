"use server";

import nodemailer from "nodemailer";

const DEFAULT_RECIPIENT_EMAIL = "hello@ladygagastudio.rs";
const DEFAULT_FROM_EMAIL = "Studio Lady Gaga <hello@ladygagastudio.rs>";

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

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransporterKey = "";

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

function normalizeText(value: string) {
  return value.trim();
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function normalizeNonNegativeInt(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeDiscount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveFinalUnitPrice(unitPrice: number, discount: number) {
  if (discount <= 0) return unitPrice;
  return Math.max(0, Math.round(unitPrice * (1 - discount / 100)));
}

function normalizeRecipients(rawRecipients: string | undefined) {
  const recipients = rawRecipients
    ?.split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (!recipients || recipients.length === 0) {
    return [DEFAULT_RECIPIENT_EMAIL];
  }

  return recipients;
}

function normalizePayload(payload: CheckoutEmailPayload): CheckoutEmailPayload {
  const customer: CheckoutEmailCustomer = {
    firstName: normalizeText(payload.customer.firstName),
    lastName: normalizeText(payload.customer.lastName),
    email: normalizeOptionalText(payload.customer.email),
    street: normalizeText(payload.customer.street),
    number: normalizeText(payload.customer.number),
    postalCode: normalizeText(payload.customer.postalCode),
    city: normalizeText(payload.customer.city),
    phone: normalizeText(payload.customer.phone),
    note: normalizeOptionalText(payload.customer.note),
  };

  const items = payload.items
    .map((item) => {
      const quantity = normalizeQuantity(item.quantity);
      const unitPrice = normalizeNonNegativeInt(item.unitPrice);
      const discount = normalizeDiscount(item.discount);
      const safeFinalUnitPrice = resolveFinalUnitPrice(unitPrice, discount);
      const finalUnitPrice =
        Number.isFinite(item.finalUnitPrice) && item.finalUnitPrice >= 0
          ? normalizeNonNegativeInt(item.finalUnitPrice)
          : safeFinalUnitPrice;
      const lineTotal =
        Number.isFinite(item.lineTotal) && item.lineTotal >= 0
          ? normalizeNonNegativeInt(item.lineTotal)
          : finalUnitPrice * quantity;

      return {
        title: normalizeText(item.title) || "Nepoznat proizvod",
        quantity,
        unitPrice,
        discount,
        finalUnitPrice,
        lineTotal,
      } satisfies CheckoutEmailItem;
    })
    .filter((item) => item.quantity > 0);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    orderNumber: normalizeText(payload.orderNumber) || "SLG-NEPOZNATO",
    createdAt:
      Number.isFinite(payload.createdAt) && payload.createdAt > 0
        ? payload.createdAt
        : Date.now(),
    customer,
    items,
    totals: {
      totalItems,
      totalAmount,
    },
  };
}

function buildTextPayload(payload: CheckoutEmailPayload) {
  const lines = [
    `Narudžbina: ${payload.orderNumber}`,
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
      (item) => {
        return `
        <div style="margin:0 0 10px;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="vertical-align:top;">
                <p style="margin:0 0 10px;font-size:16px;line-height:1.35;font-weight:700;word-break:break-word;overflow-wrap:anywhere;">
                  ${escapeHtml(item.title)}
                </p>
                <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr>
                    <td style="padding:4px 0;color:#4b5563;">Kolicina</td>
                    <td style="padding:4px 0;text-align:right;font-weight:600;color:#111827;">${item.quantity}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#4b5563;">Cena</td>
                    <td style="padding:4px 0;text-align:right;color:#111827;">${escapeHtml(formatRsd(item.finalUnitPrice))}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0 0;border-top:1px solid #e5e7eb;font-weight:700;color:#111827;">Ukupno</td>
                    <td style="padding:8px 0 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:700;color:#111827;">
                      ${escapeHtml(formatRsd(item.lineTotal))}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `;
      },
    )
    .join("");

  return `
    <div style="background:#f4f5f7;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#e56f4a,#ca4d2a);color:#ffffff;padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Nova narudžbina</p>
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

          <h2 style="margin:24px 0 12px;font-size:18px;">Stavke porudžbine</h2>
          <div style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
            ${rows}
          </div>

          <div style="margin-top:16px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
            <p style="margin:0 0 6px;"><strong>Ukupno komada:</strong> ${payload.totals.totalItems}</p>
            <p style="margin:0;font-size:18px;"><strong>Ukupan iznos:</strong> ${escapeHtml(formatRsd(payload.totals.totalAmount))}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Nepoznata greska";
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() || "587";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const secure = process.env.SMTP_SECURE === "true" || portRaw === "465";
  const port = Number(portRaw);
  const from = process.env.ORDER_FROM_EMAIL?.trim() || user || DEFAULT_FROM_EMAIL;

  if (!host || !user || !pass) {
    return {
      ok: false as const,
      error: "Nedostaju SMTP varijable: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.",
    };
  }

  if (!Number.isFinite(port) || port <= 0) {
    return { ok: false as const, error: "SMTP_PORT nije validan broj." };
  }

  return {
    ok: true as const,
    value: {
      host,
      port,
      user,
      pass,
      from,
      secure,
    },
  };
}

function getTransporter(config: {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
}) {
  const cacheKey = `${config.host}:${config.port}:${config.user}:${config.secure}`;
  if (cachedTransporter && cachedTransporterKey === cacheKey) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 120000,
    greetingTimeout: 30000,
    socketTimeout: 600000,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  cachedTransporterKey = cacheKey;
  return cachedTransporter;
}

export async function sendCheckoutOrderEmail(payload: CheckoutEmailPayload): Promise<SendOrderEmailResult> {
  const normalizedPayload = normalizePayload(payload);
  if (normalizedPayload.items.length === 0) {
    return {
      ok: false,
      error: "Email nije poslat jer narudžbina nema validne stavke.",
    };
  }

  const smtpConfig = readSmtpConfig();
  if (!smtpConfig.ok) {
    return { ok: false, error: smtpConfig.error };
  }

  const recipients = normalizeRecipients(process.env.ORDER_NOTIFICATION_EMAIL);
  const transporter = getTransporter({
    host: smtpConfig.value.host,
    port: smtpConfig.value.port,
    secure: smtpConfig.value.secure,
    user: smtpConfig.value.user,
    pass: smtpConfig.value.pass,
  });

  try {
    await transporter.sendMail({
      from: smtpConfig.value.from,
      to: recipients,
      subject: `Nova narudžbina ${normalizedPayload.orderNumber}`,
      text: buildTextPayload(normalizedPayload),
      html: buildHtmlPayload(normalizedPayload),
      replyTo: normalizedPayload.customer.email,
    });
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      error: `Slanje emaila nije uspelo (${resolveErrorMessage(error)}).`,
    };
  }
}
