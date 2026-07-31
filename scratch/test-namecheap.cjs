const nodemailer = require('nodemailer');

async function testNamecheapPort(port, secure) {
  console.log(`Testing mail.privateemail.com port ${port} (secure: ${secure})...`);
  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: port,
    secure: secure,
    connectionTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log(`Port ${port} connected (needs auth).`);
  } catch (err) {
    console.log(`Port ${port} response:`, err.message);
  }
}

async function run() {
  await testNamecheapPort(465, true);
  await testNamecheapPort(587, false);
}

run();
