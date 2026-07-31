'use server';

import nodemailer from "nodemailer";

const TRACKING_URL = "https://www.posta.rs/cir/alati/pracenje-posiljke.aspx";
const DEFAULT_FROM_EMAIL = "Studio Lady Gaga <hello@ladygagastudio.rs>";

type ShipmentTrackingEmailPayload = {
  orderNumber: string;
  trackingNumber: string;
  recipientEmail: string;
  recipientName: string;
};

export type SendShipmentTrackingEmailResult =
  | { ok: true }
  | { ok: false; error: string };

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransporterKey = "";
let cachedTransporterVerified = false;

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

function formatSenderAddress(displayName: string, email: string) {
  return `${displayName} <${email.trim().toLowerCase()}>`;
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Nepoznata greška.";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() || "587";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const secure = process.env.SMTP_SECURE === "true" || portRaw === "465";
  const port = Number(portRaw);
  const from = process.env.ORDER_FROM_EMAIL?.trim() || (user ? formatSenderAddress("Studio Lady Gaga", user) : DEFAULT_FROM_EMAIL);

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

function buildShipmentTrackingText(payload: ShipmentTrackingEmailPayload) {
  return [
    `Poštovana/i ${payload.recipientName},`,
    "",
    `Vaša narudžbina ${payload.orderNumber} je sada u obradi.`,
    `Broj pošiljke: ${payload.trackingNumber}`,
    "",
    "Pošiljku možete pratiti preko Pošte Srbije na sledećem linku:",
    TRACKING_URL,
    "",
    "Unesite broj pošiljke na toj stranici kako biste pratili trenutno stanje i lokaciju pošiljke.",
    "",
    "Hvala na porudžbini,",
    "Studio Lady Gaga",
  ].join("\n");
}

function buildShipmentTrackingHtml(payload: ShipmentTrackingEmailPayload) {
  return `
    <div style="background:#f4f5f7;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
        <div style="padding:22px 22px 18px;background:linear-gradient(135deg,#fff4ef,#fffaf5);border-bottom:1px solid #f3d1c4;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9a3412;font-weight:700;">Studio Lady Gaga</p>
          <h1 style="margin:0;font-size:24px;line-height:1.3;color:#111827;">Vaša pošiljka je predata u obradu</h1>
        </div>

        <div style="padding:22px;">
          <p style="margin:0 0 14px;line-height:1.7;">Poštovana/i ${escapeHtml(payload.recipientName)},</p>
          <p style="margin:0 0 16px;line-height:1.7;">
            Vaša narudžbina <strong>${escapeHtml(payload.orderNumber)}</strong> je sada u obradi.
            Broj pošiljke koji možete koristiti za praćenje je:
          </p>

          <div style="margin:0 0 18px;padding:18px;border:1px solid #f3d1c4;border-radius:16px;background:#fff7f1;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9a3412;font-weight:700;">Broj pošiljke</p>
            <p style="margin:0;font-size:28px;line-height:1.2;font-weight:800;color:#111827;word-break:break-word;">${escapeHtml(payload.trackingNumber)}</p>
          </div>

          <p style="margin:0 0 18px;line-height:1.7;">
            Klikom na dugme ispod otvarate stranicu Pošte Srbije. Unesite ovaj broj pošiljke kako biste pratili trenutno stanje i lokaciju vaše pošiljke.
          </p>

          <p style="margin:0 0 20px;">
            <a
              href="${TRACKING_URL}"
              style="display:inline-block;padding:12px 18px;border-radius:999px;background:#ca4d2a;color:#ffffff;text-decoration:none;font-weight:700;"
            >
              Prati pošiljku
            </a>
          </p>

          <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">
            Ako dugme ne radi, kopirajte sledeći link u browser:
            <br />
            <a href="${TRACKING_URL}" style="color:#9a3412;word-break:break-all;">${TRACKING_URL}</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function sendOrderTrackingEmail(
  payload: ShipmentTrackingEmailPayload,
): Promise<SendShipmentTrackingEmailResult> {
  const orderNumber = normalizeText(payload.orderNumber);
  const trackingNumber = normalizeText(payload.trackingNumber);
  const recipientEmail = normalizeText(payload.recipientEmail).toLowerCase();
  const recipientName = normalizeText(payload.recipientName) || "kupče";

  if (orderNumber.length < 3) {
    return { ok: false, error: "Broj narudžbine nije validan." };
  }

  if (trackingNumber.length < 3) {
    return { ok: false, error: "Broj pošiljke nije validan." };
  }

  if (!isValidEmail(recipientEmail)) {
    return { ok: false, error: "Email kupca nije validan." };
  }

  const smtpConfig = readSmtpConfig();
  if (!smtpConfig.ok) {
    return { ok: false, error: smtpConfig.error };
  }

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
      to: recipientEmail,
      subject: `Broj pošiljke za narudžbinu ${orderNumber}`,
      text: buildShipmentTrackingText({
        orderNumber,
        trackingNumber,
        recipientEmail,
        recipientName,
      }),
      html: buildShipmentTrackingHtml({
        orderNumber,
        trackingNumber,
        recipientEmail,
        recipientName,
      }),
    });

    console.info("Shipment tracking email sent", {
      orderNumber,
      recipientEmail,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      messageId: info.messageId,
    });

    return { ok: true };
  } catch (error: unknown) {
    console.error("Shipment tracking email failed", {
      orderNumber,
      recipientEmail,
      error: resolveErrorMessage(error),
    });
    return {
      ok: false,
      error: `Slanje emaila nije uspelo (${resolveErrorMessage(error)}).`,
    };
  }
}
