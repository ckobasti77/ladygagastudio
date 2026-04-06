"use server";

import nodemailer from "nodemailer";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const ADMIN_EMAIL = "hello@ladygagastudio.rs";

type OfferCampaignPayload = {
  subject: string;
  message: string;
};

type SendOfferCampaignResult =
  | {
      ok: true;
      recipients: number;
    }
  | {
      ok: false;
      error: string;
    };

type OfferRecipientsPreviewResult =
  | {
      ok: true;
      monitorEmail: string;
      recipients: OfferRecipient[];
    }
  | {
      ok: false;
      error: string;
    };

type OfferRecipient = {
  email: string;
  firstName: string;
  lastName: string;
};

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

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Slanje ponude nije uspelo.";
}

function buildOfferText(payload: OfferCampaignPayload) {
  return [
    payload.subject,
    "",
    payload.message,
    "",
    "Studio Lady Gaga",
  ].join("\n");
}

function buildOfferHtml(payload: OfferCampaignPayload) {
  const normalizedLines = payload.message
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line, index, list) => line.length > 0 || (index > 0 && list[index - 1].length > 0));

  const htmlMessage = normalizedLines.map((line) => escapeHtml(line)).join("<br/>");

  return `
    <div style="background-color:#f4f5f7;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:700px;margin:0 auto;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="padding:20px;">
          <div style="margin:0 0 18px;padding:16px 18px;border-left:4px solid #ca4d2a;background-color:#fff4ef;border-radius:12px;">
            <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#9a3412;font-weight:700;">Studio Lady Gaga</p>
            <h1 style="margin:0;font-size:24px;line-height:1.3;color:#111827;font-weight:700;">${escapeHtml(payload.subject)}</h1>
          </div>
          <p style="margin:0;white-space:normal;line-height:1.6;color:#111827;">${htmlMessage || "Nova ponuda je dostupna."}</p>
          <p style="margin:18px 0 0;color:#4b5563;">Hvala sto ste deo nase zajednice.</p>
        </div>
      </div>
    </div>
  `;
}

function resolveOfferMonitorEmail() {
  return (process.env.OFFER_MONITOR_EMAIL?.trim() || ADMIN_EMAIL).trim().toLowerCase();
}

function formatSenderAddress(displayName: string, email: string) {
  return `${displayName} <${email.trim().toLowerCase()}>`;
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT ?? "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const senderEmail = user?.trim() || ADMIN_EMAIL;
  const from = process.env.OFFER_FROM_EMAIL?.trim() || formatSenderAddress("Studio Lady Gaga", senderEmail);
  const secure = process.env.SMTP_SECURE === "true" || portRaw === "465";
  const port = Number(portRaw);

  if (!host || !user || !pass || !from) {
    return { ok: false as const, error: "Nedostaju SMTP varijable: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS." };
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

async function listOfferRecipients() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL nije postavljen.");
  }

  const convex = new ConvexHttpClient(convexUrl);
  const recipients = (await convex.query(api.users.listOfferRecipients, {})) as OfferRecipient[];
  const uniqueRecipients = new Map<string, OfferRecipient>();

  for (const recipient of recipients) {
    const email = recipient.email.trim().toLowerCase();
    if (email.length === 0 || uniqueRecipients.has(email)) {
      continue;
    }

    uniqueRecipients.set(email, {
      email,
      firstName: recipient.firstName.trim(),
      lastName: recipient.lastName.trim(),
    });
  }

  return [...uniqueRecipients.values()].sort((a, b) => a.email.localeCompare(b.email, "sr-Latn-RS"));
}

export async function getOfferRecipientsPreview(): Promise<OfferRecipientsPreviewResult> {
  try {
    const recipients = await listOfferRecipients();
    return {
      ok: true,
      monitorEmail: resolveOfferMonitorEmail(),
      recipients,
    };
  } catch (error: unknown) {
    return { ok: false, error: resolveErrorMessage(error) };
  }
}

export async function sendOfferCampaign(payload: OfferCampaignPayload): Promise<SendOfferCampaignResult> {
  const subject = payload.subject.trim();
  const message = payload.message.trim();

  if (subject.length < 3) {
    return { ok: false, error: "Naslov mora imati najmanje 3 karaktera." };
  }

  if (message.length < 10) {
    return { ok: false, error: "Poruka mora imati najmanje 10 karaktera." };
  }

  const smtpConfig = readSmtpConfig();
  if (!smtpConfig.ok) {
    return { ok: false, error: smtpConfig.error };
  }

  try {
    const recipients = await listOfferRecipients();
    const recipientEmails = recipients.map((recipient) => recipient.email);

    if (recipientEmails.length === 0) {
      return { ok: true, recipients: 0 };
    }

    const transporter = getTransporter({
      host: smtpConfig.value.host,
      port: smtpConfig.value.port,
      secure: smtpConfig.value.secure,
      user: smtpConfig.value.user,
      pass: smtpConfig.value.pass,
    });

    await transporter.sendMail({
      from: smtpConfig.value.from,
      to: [resolveOfferMonitorEmail()],
      bcc: recipientEmails,
      subject,
      text: buildOfferText({ subject, message }),
      html: buildOfferHtml({ subject, message }),
    });

    return { ok: true, recipients: recipientEmails.length };
  } catch (error: unknown) {
    return { ok: false, error: resolveErrorMessage(error) };
  }
}
