"use server";

import nodemailer from "nodemailer";

const DEFAULT_RECIPIENT_EMAIL = "hello@ladygagastudio.rs";
const DEFAULT_FROM_EMAIL = "Studio Lady Gaga <hello@ladygagastudio.rs>";

export type ContactInquiryPayload = {
  name: string;
  email: string;
  message: string;
  createdAt: number;
};

type SendInquiryEmailResult =
  | { ok: true }
  | { ok: false; error: string };

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransporterKey = "";

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

function normalizePayload(payload: ContactInquiryPayload): ContactInquiryPayload {
  const now = Date.now();
  return {
    name: normalizeText(payload.name) || "Nepoznat klijent",
    email: normalizeText(payload.email),
    message: normalizeText(payload.message),
    createdAt:
      Number.isFinite(payload.createdAt) && payload.createdAt > 0
        ? payload.createdAt
        : now,
  };
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

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Slanje emaila nije uspelo.";
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim() || "587";
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const secure = process.env.SMTP_SECURE === "true" || portRaw === "465";
  const port = Number(portRaw);
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim()
    || process.env.ORDER_FROM_EMAIL?.trim()
    || user
    || DEFAULT_FROM_EMAIL;

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

function resolveRecipients() {
  const raw =
    process.env.CONTACT_NOTIFICATION_EMAIL
    || process.env.ORDER_NOTIFICATION_EMAIL
    || DEFAULT_RECIPIENT_EMAIL;

  const recipients = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return recipients.length > 0 ? recipients : [DEFAULT_RECIPIENT_EMAIL];
}

export async function sendContactInquiryEmail(payload: ContactInquiryPayload): Promise<SendInquiryEmailResult> {
  const normalizedPayload = normalizePayload(payload);
  if (!normalizedPayload.email || !normalizedPayload.message) {
    return { ok: false, error: "Email i poruka su obavezni." };
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
    await transporter.sendMail({
      from: smtpConfig.value.from,
      to: resolveRecipients(),
      subject: `Novi upit: ${normalizedPayload.name}`,
      text: buildInquiryText(normalizedPayload),
      html: buildInquiryHtml(normalizedPayload),
      replyTo: normalizedPayload.email,
    });
    return { ok: true };
  } catch (error: unknown) {
    return {
      ok: false,
      error: `Slanje emaila nije uspelo (${resolveErrorMessage(error)}).`,
    };
  }
}
