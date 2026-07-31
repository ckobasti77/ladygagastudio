"use server";

import nodemailer from "nodemailer";

import { buildIpsPaymentDetails, isIpsConfigured, renderIpsQrPng, renderIpsQrSvg } from "@/lib/ips-qr";

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
  bonusApplied?: boolean;
  payableUnitPrice?: number;
  lineTotal: number;
};

export type CheckoutPaymentMethod = "cod" | "ips";

export type CheckoutEmailPayload = {
  orderNumber: string;
  createdAt: number;
  customer: CheckoutEmailCustomer;
  items: CheckoutEmailItem[];
  totals: {
    totalItems: number;
    totalAmount: number;
    goodsTotal?: number;
    bonusSavings?: number;
  };
  paymentMethod?: CheckoutPaymentMethod;
  freeShipping?: boolean;
  paymentPurpose?: string;
  paymentReference?: string;
};

type SendOrderEmailResult =
  | { ok: true }
  | { ok: false; error: string };

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransporterKey = "";
let cachedTransporterVerified = false;

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
    ?.split(/[;,]/)
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
      const bonusApplied = item.bonusApplied === true;
      const payableUnitPrice =
        Number.isFinite(item.payableUnitPrice) && (item.payableUnitPrice ?? -1) >= 0
          ? normalizeNonNegativeInt(item.payableUnitPrice as number)
          : finalUnitPrice;
      const lineTotal =
        Number.isFinite(item.lineTotal) && item.lineTotal >= 0
          ? normalizeNonNegativeInt(item.lineTotal)
          : payableUnitPrice * quantity;

      return {
        title: normalizeText(item.title) || "Nepoznat proizvod",
        quantity,
        unitPrice,
        discount,
        finalUnitPrice,
        bonusApplied,
        payableUnitPrice,
        lineTotal,
      } satisfies CheckoutEmailItem;
    })
    .filter((item) => item.quantity > 0);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const goodsTotal = items.reduce((sum, item) => sum + item.finalUnitPrice * item.quantity, 0);

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
      goodsTotal,
      bonusSavings: Math.max(0, goodsTotal - totalAmount),
    },
    paymentMethod: payload.paymentMethod === "ips" ? "ips" : "cod",
    freeShipping: payload.freeShipping === true,
    paymentPurpose: normalizeOptionalText(payload.paymentPurpose),
    paymentReference: normalizeOptionalText(payload.paymentReference),
  };
}

const IPS_WARNING_TITLE = "IPS ONLINE PLAĆANJE — UPLATA NIJE POTVRĐENA";
const IPS_WARNING_BODY = [
  "Novac možda još nije legao (uplate umeju da stignu tek sutradan).",
  'NE SLATI KAO POUZEĆE. Proverite priliv, pa u admin panelu kliknite "Potvrdi uplatu".',
];

function isIpsOrder(payload: CheckoutEmailPayload) {
  return payload.paymentMethod === "ips";
}

function shippingLine(payload: CheckoutEmailPayload) {
  return payload.freeShipping
    ? "Dostava: BESPLATNA — poštarinu plaća studio."
    : "Dostava: poštarinu plaća kupac kuriru pri preuzimanju.";
}

function buildTextPayload(payload: CheckoutEmailPayload) {
  const ips = isIpsOrder(payload);
  const banner = ips
    ? [
        "=========================================",
        IPS_WARNING_TITLE,
        ...IPS_WARNING_BODY,
        payload.paymentReference ? `Poziv na broj: ${payload.paymentReference}` : "",
        payload.paymentPurpose ? `Svrha uplate: ${payload.paymentPurpose}` : "",
        "=========================================",
        "",
      ]
    : [
        "=========================================",
        `PLAĆANJE POUZEĆEM — naplatiti ${formatRsd(payload.totals.totalAmount)} pri preuzimanju.`,
        "=========================================",
        "",
      ];

  const lines = [
    ...banner,
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
        `${index + 1}. ${item.title}${item.bonusApplied ? " [BONUS -15%]" : ""} | ${item.quantity} x ${formatRsd(
          item.payableUnitPrice ?? item.finalUnitPrice,
        )} = ${formatRsd(item.lineTotal)}`,
    ),
    "",
    `Ukupno komada: ${payload.totals.totalItems}`,
    `Vrednost artikala: ${formatRsd(payload.totals.goodsTotal ?? payload.totals.totalAmount)}`,
    (payload.totals.bonusSavings ?? 0) > 0
      ? `Bonus popust -15%: -${formatRsd(payload.totals.bonusSavings ?? 0)}`
      : "",
    shippingLine(payload),
    `Ukupan iznos: ${formatRsd(payload.totals.totalAmount)}`,
    `Način plaćanja: ${isIpsOrder(payload) ? "IPS QR (online, čeka potvrdu uplate)" : "Pouzeće"}`,
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
                  ${
                    item.bonusApplied
                      ? '<span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:#fde8dd;color:#9a3412;font-size:11px;font-weight:700;letter-spacing:0.06em;">BONUS -15%</span>'
                      : ""
                  }
                </p>
                <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr>
                    <td style="padding:4px 0;color:#4b5563;">Količina</td>
                    <td style="padding:4px 0;text-align:right;font-weight:600;color:#111827;">${item.quantity}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#4b5563;">Cena</td>
                    <td style="padding:4px 0;text-align:right;color:#111827;">${escapeHtml(
                      formatRsd(item.payableUnitPrice ?? item.finalUnitPrice),
                    )}</td>
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

  const ips = isIpsOrder(payload);
  const paymentBanner = ips
    ? `
        <div style="background:#7f1d1d;color:#ffffff;padding:18px 20px;">
          <p style="margin:0 0 8px;font-size:16px;font-weight:800;letter-spacing:0.04em;">🔴 ${escapeHtml(
            IPS_WARNING_TITLE,
          )}</p>
          <p style="margin:0 0 6px;font-size:14px;line-height:1.5;">${escapeHtml(IPS_WARNING_BODY[0])}</p>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.5;font-weight:700;">${escapeHtml(
            IPS_WARNING_BODY[1],
          )}</p>
          ${
            payload.paymentReference
              ? `<p style="margin:0 0 4px;font-size:13px;">Poziv na broj: <strong>${escapeHtml(payload.paymentReference)}</strong></p>`
              : ""
          }
          ${
            payload.paymentPurpose
              ? `<p style="margin:0;font-size:13px;">Svrha uplate: <strong>${escapeHtml(payload.paymentPurpose)}</strong></p>`
              : ""
          }
        </div>
      `
    : `
        <div style="background:#065f46;color:#ffffff;padding:18px 20px;">
          <p style="margin:0 0 6px;font-size:16px;font-weight:800;letter-spacing:0.04em;">🟢 PLAĆANJE POUZEĆEM</p>
          <p style="margin:0;font-size:14px;line-height:1.5;">
            Naplatiti <strong>${escapeHtml(formatRsd(payload.totals.totalAmount))}</strong> pri preuzimanju.
          </p>
        </div>
      `;

  return `
    <div style="background:#f4f5f7;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        ${paymentBanner}
        <div style="background-color:#fff4ef;color:#9a3412;padding:18px 20px;border-bottom:1px solid #f3d1c4;">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Nova narudžbina</p>
          <h1 style="margin:0;font-size:24px;line-height:1.3;color:#111827;font-weight:700;">${escapeHtml(payload.orderNumber)}</h1>
          <p style="margin:8px 0 0;font-size:13px;color:#7c2d12;">Kreirano: ${escapeHtml(createdAt)}</p>
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
            <p style="margin:0 0 6px;"><strong>Vrednost artikala:</strong> ${escapeHtml(
              formatRsd(payload.totals.goodsTotal ?? payload.totals.totalAmount),
            )}</p>
            ${
              (payload.totals.bonusSavings ?? 0) > 0
                ? `<p style="margin:0 0 6px;color:#9a3412;"><strong>Bonus popust −15%:</strong> −${escapeHtml(
                    formatRsd(payload.totals.bonusSavings ?? 0),
                  )}</p>`
                : ""
            }
            <p style="margin:0 0 6px;${payload.freeShipping ? "color:#065f46;font-weight:700;" : ""}">
              <strong>Dostava:</strong> ${escapeHtml(
                payload.freeShipping
                  ? "BESPLATNA — poštarinu plaća studio"
                  : "poštarinu plaća kupac kuriru pri preuzimanju",
              )}
            </p>
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
  return "Nepoznata greška";
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() || "587";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
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
  cachedTransporterVerified = false;
  return cachedTransporter;
}

async function ensureTransporterReady(transporter: nodemailer.Transporter) {
  if (cachedTransporterVerified) {
    return;
  }

  await transporter.verify();
  cachedTransporterVerified = true;
}

export type IpsQrResult =
  | {
      ok: true;
      svg: string;
      pngDataUrl: string;
      recipientName: string;
      account: string;
      amount: number;
      formattedAmount: string;
      purpose: string;
      reference: string;
      paymentCode: string;
    }
  | { ok: false; error: string };

/** Da li checkout uopšte sme da ponudi IPS — bez računa u env-u opcija se sakriva. */
export async function isIpsPaymentAvailable(): Promise<boolean> {
  return isIpsConfigured();
}

/**
 * QR se generiše na serveru: broj računa i QR biblioteka nikad ne idu u klijentski bundle.
 */
export async function buildIpsQrForOrder(input: {
  orderNumber: string;
  amount: number;
  productShortNames: string[];
  purpose?: string;
  reference?: string;
}): Promise<IpsQrResult> {
  try {
    const details = buildIpsPaymentDetails({
      orderNumber: normalizeText(input.orderNumber),
      amount: normalizeNonNegativeInt(input.amount),
      productShortNames: input.productShortNames.filter((name) => typeof name === "string"),
      purpose: input.purpose,
      reference: input.reference,
    });

    if (!details) {
      return {
        ok: false,
        error:
          "IPS plaćanje trenutno nije podešeno (nedostaje IPS_RECIPIENT_ACCOUNT ili IPS_RECIPIENT_NAME).",
      };
    }

    const [svg, pngDataUrl] = await Promise.all([
      renderIpsQrSvg(details.payload),
      renderIpsQrPng(details.payload),
    ]);

    return {
      ok: true,
      svg,
      pngDataUrl,
      recipientName: details.recipientName,
      account: details.formattedAccount,
      amount: details.amount,
      formattedAmount: details.formattedAmount,
      purpose: details.purpose,
      reference: details.reference,
      paymentCode: details.paymentCode,
    };
  } catch (error: unknown) {
    console.error("IPS QR generation failed", {
      orderNumber: input.orderNumber,
      error: resolveErrorMessage(error),
    });
    return { ok: false, error: `Generisanje IPS QR koda nije uspelo (${resolveErrorMessage(error)}).` };
  }
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
    await ensureTransporterReady(transporter);
    const info = await transporter.sendMail({
      from: smtpConfig.value.from,
      to: recipients,
      subject: `${
        isIpsOrder(normalizedPayload) ? "[IPS – ČEKA UPLATU]" : "[POUZEĆE]"
      } Nova narudžbina ${normalizedPayload.orderNumber}`,
      text: buildTextPayload(normalizedPayload),
      html: buildHtmlPayload(normalizedPayload),
      ...(normalizedPayload.customer.email ? { replyTo: normalizedPayload.customer.email } : {}),
    });
    console.info("Checkout order email sent", {
      orderNumber: normalizedPayload.orderNumber,
      recipients,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
    });
    return { ok: true };
  } catch (error: unknown) {
    console.error("Checkout order email failed", {
      orderNumber: normalizedPayload.orderNumber,
      recipients,
      error: resolveErrorMessage(error),
    });
    return {
      ok: false,
      error: `Slanje emaila nije uspelo (${resolveErrorMessage(error)}).`,
    };
  }
}
