const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    val = val.replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

async function sendTestMail() {
  console.log('--- Test Slanje Maila ---');
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: env.SMTP_SECURE === 'true' || env.SMTP_PORT === '465',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 15000,
  });

  try {
    await transporter.verify();
    console.log('1. Autentifikacija uspešna!');

    const info = await transporter.sendMail({
      from: env.ORDER_FROM_EMAIL || `"Studio Lady Gaga" <${env.SMTP_USER}>`,
      to: env.ORDER_NOTIFICATION_EMAIL,
      subject: 'Test poruka sa sajta Studio Lady Gaga',
      text: 'Ovo je test poruka radi provere SMTP slanja mailova.',
      html: '<b>Ovo je test poruka radi provere SMTP slanja mailova.</b>',
    });

    console.log('2. Email uspešno poslat!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('GREŠKA pri slanju:', err);
  }
}

sendTestMail();
