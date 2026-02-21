"use server";

import nodemailer from "nodemailer";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const ADMIN_EMAIL = "ladygagastudio@gmail.com";

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

type OfferRecipient = {
  email: string;
  firstName: string;
  lastName: string;
};

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
    <div style="background:#f4f5f7;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(140deg,#e56f4a,#ca4d2a);padding:20px;color:#ffffff;">
          <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Studio Lady Gaga</p>
          <h1 style="margin:0;font-size:24px;">${escapeHtml(payload.subject)}</h1>
        </div>
        <div style="padding:20px;">
          <p style="margin:0;white-space:normal;line-height:1.6;">${htmlMessage || "Nova ponuda je dostupna."}</p>
          <p style="margin:18px 0 0;color:#4b5563;">Hvala sto ste deo nase zajednice.</p>
        </div>
      </div>
    </div>
  `;
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT ?? "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.OFFER_FROM_EMAIL ?? user;
  const secure = process.env.SMTP_SECURE === "true" || portRaw === "465";
  const port = Number(portRaw);

  if (!host || !user || !pass || !from) {
    return { ok: false as const, error: "Nedostaju SMTP varijable: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, OFFER_FROM_EMAIL." };
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

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return { ok: false, error: "NEXT_PUBLIC_CONVEX_URL nije postavljen." };
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const recipients = (await convex.query(api.users.listOfferRecipients, {})) as OfferRecipient[];
    const recipientEmails = Array.from(
      new Set(
        recipients
          .map((recipient) => recipient.email.trim().toLowerCase())
          .filter((email) => email.length > 0),
      ),
    );

    if (recipientEmails.length === 0) {
      return { ok: true, recipients: 0 };
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.value.host,
      port: smtpConfig.value.port,
      secure: smtpConfig.value.secure,
      auth: {
        user: smtpConfig.value.user,
        pass: smtpConfig.value.pass,
      },
    });

    await transporter.sendMail({
      from: smtpConfig.value.from,
      to: [process.env.OFFER_MONITOR_EMAIL ?? ADMIN_EMAIL],
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
