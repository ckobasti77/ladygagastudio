"use server";

import nodemailer from "nodemailer";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const RESET_TOKEN_MIN_LENGTH = 16;

type RequestPasswordResetPayload = {
  email: string;
};

type ResetPasswordPayload = {
  token: string;
  password: string;
};

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type PasswordResetIssueResult = {
  ok: true;
  token: string | null;
  email?: string;
  firstName?: string;
  expiresAt?: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Dogodila se greska. Pokusajte ponovo.";
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT ?? "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.AUTH_FROM_EMAIL ?? process.env.OFFER_FROM_EMAIL ?? user;
  const secure = process.env.SMTP_SECURE === "true" || portRaw === "465";
  const port = Number(portRaw);

  if (!host || !user || !pass || !from) {
    return { ok: false as const, error: "Nedostaju SMTP varijable za slanje reset email-a." };
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

function readConvexUrl() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return { ok: false as const, error: "NEXT_PUBLIC_CONVEX_URL nije postavljen." };
  }
  return { ok: true as const, value: convexUrl };
}

function buildResetUrl(token: string) {
  const appBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${appBaseUrl}/prijava?reset=${encodeURIComponent(token)}`;
}

function buildResetEmailText({
  firstName,
  link,
  expiresAt,
}: {
  firstName?: string;
  link: string;
  expiresAt?: number;
}) {
  return [
    firstName ? `Zdravo ${firstName},` : "Zdravo,",
    "",
    "Primili smo zahtev za reset sifre.",
    `Link za reset: ${link}`,
    expiresAt ? `Link vazi do: ${new Date(expiresAt).toLocaleString("sr-Latn-RS")}` : "",
    "",
    "Ako niste vi trazili reset, ignorisite ovu poruku.",
    "Studio Lady Gaga",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildResetEmailHtml({
  firstName,
  link,
  expiresAt,
}: {
  firstName?: string;
  link: string;
  expiresAt?: number;
}) {
  return `
    <div style="background:#f4f5f7;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
        <div style="background:linear-gradient(130deg,#202735,#0f1728);padding:20px;color:#ffffff;">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Studio Lady Gaga</p>
          <h1 style="margin:0;font-size:24px;">Reset sifre</h1>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 10px;">${escapeHtml(firstName ? `Zdravo ${firstName},` : "Zdravo,")}</p>
          <p style="margin:0 0 14px;line-height:1.6;">Kliknite dugme ispod da postavite novu sifru.</p>
          <p style="margin:0 0 14px;">
            <a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#e56f4a;color:#fff;text-decoration:none;font-weight:700;">
              Resetuj sifru
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#4b5563;">Ako dugme ne radi, otvorite ovaj link:</p>
          <p style="margin:0 0 8px;word-break:break-all;font-size:13px;">
            <a href="${escapeHtml(link)}" style="color:#0f1728;">${escapeHtml(link)}</a>
          </p>
          ${
            expiresAt
              ? `<p style="margin:0;font-size:13px;color:#4b5563;">Link vazi do: ${escapeHtml(
                  new Date(expiresAt).toLocaleString("sr-Latn-RS"),
                )}</p>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

export async function requestPasswordResetEmail(payload: RequestPasswordResetPayload): Promise<ActionResult> {
  const email = normalizeEmail(payload.email);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Unesite validnu email adresu." };
  }

  const convexUrl = readConvexUrl();
  if (!convexUrl.ok) {
    return { ok: false, error: convexUrl.error };
  }

  const smtpConfig = readSmtpConfig();
  if (!smtpConfig.ok) {
    return { ok: false, error: smtpConfig.error };
  }

  try {
    const convex = new ConvexHttpClient(convexUrl.value);
    const resetResult = (await convex.mutation(api.users.issuePasswordResetToken, {
      email,
    })) as PasswordResetIssueResult;

    if (!resetResult.token) {
      return {
        ok: true,
        message: "Ako nalog postoji, link za reset sifre je poslat na email adresu.",
      };
    }

    const link = buildResetUrl(resetResult.token);

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
      to: [email],
      subject: "Reset sifre - Studio Lady Gaga",
      text: buildResetEmailText({
        firstName: resetResult.firstName,
        link,
        expiresAt: resetResult.expiresAt,
      }),
      html: buildResetEmailHtml({
        firstName: resetResult.firstName,
        link,
        expiresAt: resetResult.expiresAt,
      }),
    });

    return {
      ok: true,
      message: "Ako nalog postoji, link za reset sifre je poslat na email adresu.",
    };
  } catch (error: unknown) {
    return { ok: false, error: resolveErrorMessage(error) };
  }
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<ActionResult> {
  const token = payload.token.trim();
  const password = payload.password.trim();

  if (token.length < RESET_TOKEN_MIN_LENGTH) {
    return { ok: false, error: "Reset token nije validan." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Nova sifra mora imati najmanje 6 karaktera." };
  }

  const convexUrl = readConvexUrl();
  if (!convexUrl.ok) {
    return { ok: false, error: convexUrl.error };
  }

  try {
    const convex = new ConvexHttpClient(convexUrl.value);
    await convex.mutation(api.users.resetPasswordWithToken, {
      token,
      password,
    });
    return { ok: true, message: "Sifra je uspesno promenjena. Sada se prijavite." };
  } catch (error: unknown) {
    return { ok: false, error: resolveErrorMessage(error) };
  }
}
