import { buildPaymentPurpose, buildPaymentReference, toAscii } from "@/lib/ips-purpose";

/**
 * IPS QR kod po standardu Narodne banke Srbije.
 *
 * Format:
 *   K:PR|V:01|C:1|R:<racun>|N:<primalac>|I:RSD<iznos>,00|SF:<sifra>|S:<svrha>|RO:00<poziv na broj>
 *
 * Ovaj modul je isključivo serverski — broj računa se nikad ne šalje u klijentski bundle.
 */

export const IPS_MAX_PAYLOAD_BYTES = 331;
const DEFAULT_PAYMENT_CODE = "221";
const RECIPIENT_NAME_MAX_LENGTH = 70;

export type IpsConfig = {
  account: string;
  recipientName: string;
  paymentCode: string;
};

export type IpsPaymentDetails = {
  payload: string;
  account: string;
  formattedAccount: string;
  recipientName: string;
  amount: number;
  formattedAmount: string;
  purpose: string;
  reference: string;
  paymentCode: string;
};

/** Račun mora da bude tačno 18 cifara, bez crtica i razmaka. */
function normalizeAccount(raw: string | undefined) {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length === 18 ? digits : null;
}

/** Prikaz računa u uobičajenom obliku 000-0000000000000-00. */
export function formatAccount(account: string) {
  if (account.length !== 18) return account;
  return `${account.slice(0, 3)}-${account.slice(3, 16)}-${account.slice(16)}`;
}

export function readIpsConfig(): IpsConfig | null {
  const account = normalizeAccount(process.env.IPS_RECIPIENT_ACCOUNT);
  const recipientName = toAscii(process.env.IPS_RECIPIENT_NAME ?? "").slice(
    0,
    RECIPIENT_NAME_MAX_LENGTH,
  );
  if (!account || recipientName.length === 0) {
    return null;
  }

  const rawCode = (process.env.IPS_PAYMENT_CODE ?? DEFAULT_PAYMENT_CODE).replace(/\D/g, "");
  const paymentCode = rawCode.length === 3 ? rawCode : DEFAULT_PAYMENT_CODE;

  return { account, recipientName, paymentCode };
}

export function isIpsConfigured() {
  return readIpsConfig() !== null;
}

/** IPS traži zarez kao decimalni separator i bez separatora hiljada. */
function formatIpsAmount(amount: number) {
  const safe = Math.max(0, Math.round(amount));
  return `${safe},00`;
}

export function buildIpsPayload(options: {
  config: IpsConfig;
  amount: number;
  purpose: string;
  reference: string;
}): string {
  const { config, amount, purpose, reference } = options;

  const fields = [
    "K:PR",
    "V:01",
    "C:1",
    `R:${config.account}`,
    `N:${config.recipientName}`,
    `I:RSD${formatIpsAmount(amount)}`,
    `SF:${config.paymentCode}`,
    `S:${purpose}`,
    `RO:00${reference}`,
  ];

  const payload = fields.join("|");
  const byteLength = new TextEncoder().encode(payload).length;
  if (byteLength > IPS_MAX_PAYLOAD_BYTES) {
    throw new Error(`IPS QR sadržaj je predugačak (${byteLength} B, dozvoljeno ${IPS_MAX_PAYLOAD_BYTES} B).`);
  }

  return payload;
}

export function buildIpsPaymentDetails(options: {
  amount: number;
  orderNumber: string;
  productShortNames: string[];
  purpose?: string;
  reference?: string;
}): IpsPaymentDetails | null {
  const config = readIpsConfig();
  if (!config) return null;

  const amount = Math.max(0, Math.round(options.amount));
  if (amount <= 0) return null;

  const purpose = toAscii(options.purpose ?? "") || buildPaymentPurpose(options.productShortNames);
  const reference = (options.reference ?? "").replace(/\D/g, "") || buildPaymentReference(options.orderNumber);

  const payload = buildIpsPayload({ config, amount, purpose, reference });

  return {
    payload,
    account: config.account,
    formattedAccount: formatAccount(config.account),
    recipientName: config.recipientName,
    amount,
    formattedAmount: `${amount.toLocaleString("sr-Latn-RS")} RSD`,
    purpose,
    reference,
    paymentCode: config.paymentCode,
  };
}

/** SVG se renderuje na serveru — QR biblioteka nikad ne ulazi u klijentski bundle. */
export async function renderIpsQrSvg(payload: string) {
  const QRCode = (await import("qrcode")).default;
  return await QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 460,
    color: { dark: "#101828", light: "#ffffff" },
  });
}

export async function renderIpsQrPng(payload: string) {
  const QRCode = (await import("qrcode")).default;
  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 900,
    color: { dark: "#101828", light: "#ffffff" },
  });
}
