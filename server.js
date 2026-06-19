/**
 * server.js
 * ==============================================================
 *  APLIKASI ID-NETWORKERS GALAXY
 *  Website training: katalog dinamis, panel admin, pendaftaran,
 *  dan pembayaran QRIS — tanpa perlu login bagi peserta.
 *
 *  Alur peserta:
 *   1. Buka katalog  ->  2. Klik "Daftar"  ->  3. Isi form
 *   4. Bayar via QRIS ->  5. Upload bukti  ->  6. Selesai
 *      (konfirmasi dikirim ke email peserta + admin, dan bukti
 *       bisa dikirim ke WhatsApp admin lewat tombol)
 *
 *  Alur admin (/admin):
 *   - Tambah, edit, hapus training di katalog
 *   - Lihat daftar pendaftar
 * ==============================================================
 */

require("dotenv").config(); // baca konfigurasi dari file .env

const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const QRCode = require("qrcode");

const db = require("./lib/db");
const { kirimEmail } = require("./lib/mailer");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
//  PENGATURAN DASAR
// ---------------------------------------------------------------

// Gunakan EJS sebagai mesin template (file .ejs di folder /views)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Sajikan file statis (CSS, JS, gambar, bukti upload) dari /public
app.use(express.static(path.join(__dirname, "public")));

// Agar bisa membaca data dari form HTML (req.body)
app.use(express.urlencoded({ extended: true }));

// Session untuk menandai admin yang sudah login
app.use(
  session({
    secret: process.env.SESSION_SECRET || "rahasia-default",
    resave: false,
    saveUninitialized: false,
  })
);

// Pengaturan upload bukti pembayaran -> disimpan di /public/uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "public", "uploads"),
    filename: (req, file, cb) => {
      // Nama file dibuat unik: bukti-<waktu>.<ekstensi asli>
      const ext = path.extname(file.originalname);
      cb(null, "bukti-" + Date.now() + ext);
    },
  }),
});

// Fungsi bantu: format angka jadi Rupiah, mis. 2500000 -> "Rp2.500.000"
function rupiah(angka) {
  return "Rp" + Number(angka).toLocaleString("id-ID");
}
// Buat fungsi rupiah() bisa dipakai langsung di semua template EJS
app.locals.rupiah = rupiah;

// ---------------------------------------------------------------
//  HALAMAN PUBLIK (untuk peserta)
// ---------------------------------------------------------------

// Beranda + katalog training
app.get("/", (req, res) => {
  res.render("index", { trainings: db.getTrainings() });
});

// Form pendaftaran untuk satu training tertentu
app.get("/daftar/:id", (req, res) => {
  const training = db.getTrainingById(req.params.id);
  if (!training) return res.status(404).render("404");
  res.render("register", { training, error: null, form: {} });
});

// Proses form pendaftaran -> simpan -> lanjut ke halaman pembayaran
app.post("/daftar/:id", (req, res) => {
  const training = db.getTrainingById(req.params.id);
  if (!training) return res.status(404).render("404");

  const { name, email, phone, company } = req.body;

  // Validasi sederhana: nama, email, dan no HP wajib diisi
  if (!name || !email || !phone) {
    return res.render("register", {
      training,
      error: "Nama, email, dan nomor HP wajib diisi.",
      form: req.body,
    });
  }

  // Buat data pendaftaran baru
  const registrations = db.getRegistrations();
  const pendaftaran = {
    id: "REG-" + Date.now(),
    trainingId: training.id,
    trainingTitle: training.title,
    name,
    email,
    phone,
    company: company || "-",
    amount: training.price,
    status: "menunggu pembayaran",
    proofFile: null,
    createdAt: new Date().toISOString(),
  };
  registrations.push(pendaftaran);
  db.saveRegistrations(registrations);

  // Arahkan ke halaman pembayaran QRIS
  res.redirect("/bayar/" + pendaftaran.id);
});

// Halaman pembayaran QRIS + upload bukti
app.get("/bayar/:id", async (req, res) => {
  const reg = db.getRegistrationById(req.params.id);
  if (!reg) return res.status(404).render("404");

  // Isi QR: pakai payload QRIS merchant jika ada, kalau tidak pakai ringkasan
  const isiQr =
    process.env.QRIS_PAYLOAD ||
    `Pembayaran ${reg.trainingTitle} - ${reg.id} - ${rupiah(reg.amount)}`;

  // Ubah teks di atas menjadi gambar QR (format data URL agar langsung tampil)
  const qrImage = await QRCode.toDataURL(isiQr, { width: 280, margin: 1 });

  res.render("payment", { reg, qrImage });
});

// Proses upload bukti pembayaran
app.post("/bayar/:id", upload.single("proof"), async (req, res) => {
  const registrations = db.getRegistrations();
  const reg = registrations.find((r) => r.id === req.params.id);
  if (!reg) return res.status(404).render("404");

  // Catat nama file bukti dan ubah status
  reg.proofFile = req.file ? "/uploads/" + req.file.filename : null;
  reg.status = "menunggu verifikasi";
  db.saveRegistrations(registrations);

  // Kirim email konfirmasi ke peserta dan ke admin
  const ringkasan = `
    <h2>Pendaftaran ${reg.trainingTitle}</h2>
    <p>Halo ${reg.name}, terima kasih sudah mendaftar.</p>
    <ul>
      <li>Kode pendaftaran: <b>${reg.id}</b></li>
      <li>Training: ${reg.trainingTitle}</li>
      <li>Biaya: ${rupiah(reg.amount)}</li>
      <li>Email: ${reg.email}</li>
      <li>No HP: ${reg.phone}</li>
    </ul>
    <p>Bukti pembayaran kamu sedang kami verifikasi. Tim kami akan menghubungi kamu segera.</p>`;

  try {
    await kirimEmail({
      to: reg.email,
      subject: "Konfirmasi Pendaftaran - " + reg.trainingTitle,
      html: ringkasan,
    });
    if (process.env.ADMIN_EMAIL) {
      await kirimEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "Pendaftar baru - " + reg.trainingTitle,
        html: ringkasan,
      });
    }
  } catch (err) {
    console.error("Gagal mengirim email:", err.message);
  }

  res.redirect("/selesai/" + reg.id);
});

// Halaman selesai: tampilkan tombol kirim bukti ke WhatsApp admin
app.get("/selesai/:id", (req, res) => {
  const reg = db.getRegistrationById(req.params.id);
  if (!reg) return res.status(404).render("404");

  // Siapkan link WhatsApp ke admin dengan pesan otomatis
  const pesan = encodeURIComponent(
    `Halo admin, saya sudah daftar & bayar.\n` +
      `Kode: ${reg.id}\nNama: ${reg.name}\nTraining: ${reg.trainingTitle}\n` +
      `Biaya: ${rupiah(reg.amount)}\nMohon dicek ya, terima kasih.`
  );
  const waLink = `https://wa.me/${process.env.ADMIN_PHONE || ""}?text=${pesan}`;

  res.render("success", { reg, waLink });
});

// ---------------------------------------------------------------
//  HALAMAN ADMIN (dilindungi password sederhana)
// ---------------------------------------------------------------

// "Penjaga pintu": memastikan admin sudah login sebelum masuk
function wajibLogin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect("/admin/login");
}

// Tampilkan form login
app.get("/admin/login", (req, res) => {
  res.render("admin-login", { error: null });
});

// Proses login: cek password dengan yang ada di .env
app.post("/admin/login", (req, res) => {
  if (req.body.password === (process.env.ADMIN_PASSWORD || "admin123")) {
    req.session.isAdmin = true;
    return res.redirect("/admin");
  }
  res.render("admin-login", { error: "Password salah." });
});

// Logout
app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

// Dashboard admin: daftar training + daftar pendaftar
app.get("/admin", wajibLogin, (req, res) => {
  res.render("admin", {
    trainings: db.getTrainings(),
    registrations: db.getRegistrations().slice().reverse(), // terbaru di atas
    editing: null,
  });
});

// Tampilkan form admin dalam mode EDIT satu training
app.get("/admin/edit/:id", wajibLogin, (req, res) => {
  const editing = db.getTrainingById(req.params.id);
  if (!editing) return res.redirect("/admin");
  res.render("admin", {
    trainings: db.getTrainings(),
    registrations: db.getRegistrations().slice().reverse(),
    editing,
  });
});

// Tambah training baru ke katalog
app.post("/admin/training", wajibLogin, (req, res) => {
  const { title, category, level, description, duration, certificate, price, color } =
    req.body;

  const trainings = db.getTrainings();
  trainings.push({
    // id dibuat otomatis dari judul, mis. "Cisco CCNA" -> "cisco-ccna"
    id: slugify(title) + "-" + Date.now().toString().slice(-4),
    title,
    category,
    level,
    description,
    duration,
    certificate,
    price: Number(price) || 0,
    color: color || "linear-gradient(135deg,#1428a0,#27c4ff)",
  });
  db.saveTrainings(trainings);
  res.redirect("/admin");
});

// Simpan perubahan training (mode edit)
app.post("/admin/training/:id/update", wajibLogin, (req, res) => {
  const trainings = db.getTrainings();
  const t = trainings.find((x) => x.id === req.params.id);
  if (t) {
    t.title = req.body.title;
    t.category = req.body.category;
    t.level = req.body.level;
    t.description = req.body.description;
    t.duration = req.body.duration;
    t.certificate = req.body.certificate;
    t.price = Number(req.body.price) || 0;
    t.color = req.body.color || t.color;
    db.saveTrainings(trainings);
  }
  res.redirect("/admin");
});

// Hapus training dari katalog
app.post("/admin/training/:id/delete", wajibLogin, (req, res) => {
  const sisa = db.getTrainings().filter((t) => t.id !== req.params.id);
  db.saveTrainings(sisa);
  res.redirect("/admin");
});

// Fungsi bantu: ubah judul menjadi slug (huruf kecil, spasi jadi "-")
function slugify(teks) {
  return String(teks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------
//  HALAMAN TIDAK DITEMUKAN (404)
// ---------------------------------------------------------------
app.use((req, res) => {
  res.status(404).render("404");
});

// ---------------------------------------------------------------
//  JALANKAN SERVER
// ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n  ID-Networkers Galaxy berjalan di http://localhost:${PORT}`);
  console.log(`  Panel admin: http://localhost:${PORT}/admin\n`);
});
