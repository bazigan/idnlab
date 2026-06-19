/**
 * mailer.js
 * --------------------------------------------------------------
 * Mengirim email konfirmasi pendaftaran.
 *
 * Kalau konfigurasi SMTP di file .env BELUM diisi, aplikasi tidak
 * error — isi email cukup dicetak ke terminal supaya tetap bisa
 * dites tanpa setup email.
 * --------------------------------------------------------------
 */

const nodemailer = require("nodemailer");

// Cek apakah konfigurasi email sudah lengkap
const emailAktif = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

// Siapkan "transporter" hanya jika email aktif
let transporter = null;
if (emailAktif) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // 465 = SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Mengirim satu email.
 * @param {Object} opsi - { to, subject, html }
 */
async function kirimEmail({ to, subject, html }) {
  // Jika email belum dikonfigurasi: cukup tampilkan di terminal
  if (!emailAktif) {
    console.log("\n[EMAIL - mode simulasi karena SMTP belum diisi]");
    console.log("Kepada :", to);
    console.log("Subjek :", subject);
    console.log("Isi    :", html.replace(/<[^>]+>/g, " ").trim(), "\n");
    return;
  }

  // Jika sudah dikonfigurasi: kirim sungguhan
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

module.exports = { kirimEmail };
