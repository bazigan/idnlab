/**
 * server.js
 * ==============================================================
 *  APLIKASI ID-NETWORKERS GALAXY
 *  Website training: katalog dinamis, panel admin, pendaftaran,
 *  dan pembayaran QRIS — tanpa perlu login bagi peserta.
 *
 *  Penyimpanan:
 *   - Data (katalog & pendaftaran) -> database MariaDB/RDS (lib/db.js)
 *   - Foto bukti pembayaran        -> Amazon S3 (lib/storage.js)
 *
 *  Alur peserta:
 *   1. Buka katalog -> 2. Klik "Daftar" -> 3. Isi form
 *   4. Bayar QRIS   -> 5. Upload bukti  -> 6. Selesai
 * ==============================================================
 */

require("dotenv").config(); // baca konfigurasi dari file .env

const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const QRCode = require("qrcode");

const db = require("./lib/db");
const storage = require("./lib/storage");
const { kirimEmail } = require("./lib/mailer");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
//  PENGATURAN DASAR
// ---------------------------------------------------------------

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "rahasia-default",
    resave: false,
    saveUninitialized: false,
  })
);

// Upload disimpan dulu di memori, lalu diteruskan ke S3 oleh storage.js
const upload = multer({ storage: multer.memoryStorage() });

// Format angka jadi Rupiah, mis. 2500000 -> "Rp2.500.000"
function rupiah(angka) {
  return "Rp" + Number(angka).toLocaleString("id-ID");
}
app.locals.rupiah = rupiah;

// ---------------------------------------------------------------
//  AWS LAMBDA - Serverless Endpoints
// ---------------------------------------------------------------

// Proxy request ke Lambda Hello API
app.get("/api/lambda/hello", async (req, res) => {
  try {
    if (!process.env.LAMBDA_HELLO_URL) {
      return res.status(400).json({ error: "LAMBDA_HELLO_URL tidak dikonfigurasi di .env" });
    }
    const response = await fetch(process.env.LAMBDA_HELLO_URL);
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("Lambda Hello Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Proxy request ke Lambda Test Connection
app.get("/api/lambda/test", async (req, res) => {
  try {
    if (!process.env.LAMBDA_TEST_URL) {
      return res.status(400).json({ error: "LAMBDA_TEST_URL tidak dikonfigurasi di .env" });
    }
    const response = await fetch(process.env.LAMBDA_TEST_URL);
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("Lambda Test Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
//  AWS COGNITO - Authentication (Optional)
// ---------------------------------------------------------------

// Generate Cognito login URL
app.get("/login", (req, res) => {
  if (process.env.COGNITO_ENABLED !== "true") {
    return res.status(400).send("Cognito belum diaktifkan. Set COGNITO_ENABLED=true di .env");
  }

  const redirectUri = process.env.COGNITO_REDIRECT_URI || `http://localhost:${PORT}/callback`;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const domain = process.env.COGNITO_DOMAIN;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: redirectUri,
  });

  res.redirect(`https://${domain}/login?${params.toString()}`);
});

// Cognito callback redirect - tukar auth code dengan token
app.get("/callback", async (req, res) => {
  const { code, error, error_description } = req.query;
  
  if (error) {
    console.error("Cognito error:", error, error_description);
    return res.redirect("/?login=failed");
  }

  if (!code) {
    return res.redirect("/");
  }

  try {
    // Tukar auth code dengan token
    const domain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;
    const redirectUri = process.env.COGNITO_REDIRECT_URI || `http://localhost:${PORT}/callback`;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenResponse = await fetch(`https://${domain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange error:", tokenData);
      return res.redirect("/?login=failed");
    }

    // Decode ID token (simple JWT decode tanpa verifikasi signature)
    const idToken = tokenData.id_token;
    const payloadBase64 = idToken.split(".")[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());

    // Simpan user info ke session
    req.session.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      authenticatedAt: new Date(),
      idToken: idToken,
      accessToken: tokenData.access_token,
    };

    console.log(`✅ User ${payload.email} berhasil login via Cognito`);
    res.redirect("/?login=success");
  } catch (err) {
    console.error("Callback error:", err.message);
    res.redirect("/?login=error");
  }
});

// Logout dari Cognito
app.get("/logout", (req, res) => {
  const redirectUri = encodeURIComponent(`http://localhost:${PORT}/`);
  const domain = process.env.COGNITO_DOMAIN;
  const clientId = process.env.COGNITO_CLIENT_ID;

  req.session.destroy(() => {
    if (process.env.COGNITO_ENABLED === "true") {
      const cognitoLogoutUrl = `https://${domain}/logout?client_id=${clientId}&logout_uri=${redirectUri}`;
      res.redirect(cognitoLogoutUrl);
    } else {
      res.redirect("/");
    }
  });
});

// Check login status (untuk UI)
app.get("/api/user", (req, res) => {
  if (req.session.user) {
    return res.json({
      authenticated: true,
      user: {
        id: req.session.user.id,
        email: req.session.user.email,
        name: req.session.user.name,
      },
    });
  }
  res.json({ authenticated: false });
});

// ---------------------------------------------------------------
//  HALAMAN PUBLIK (untuk peserta)
// ---------------------------------------------------------------

// Beranda + katalog training
app.get("/", async (req, res) => {
  res.render("index", { 
    trainings: await db.getTrainings(),
    user: req.session.user || null,
    lambdaHelloUrl: process.env.LAMBDA_HELLO_URL || "",
    lambdaTestUrl: process.env.LAMBDA_TEST_URL || "",
  });
});

// Form pendaftaran untuk satu training
app.get("/daftar/:id", async (req, res) => {
  const training = await db.getTrainingById(req.params.id);
  if (!training) return res.status(404).render("404");
  res.render("register", { training, error: null, form: {} });
});

// Proses form pendaftaran -> simpan -> lanjut ke pembayaran
app.post("/daftar/:id", async (req, res) => {
  const training = await db.getTrainingById(req.params.id);
  if (!training) return res.status(404).render("404");

  const { name, email, phone, company } = req.body;
  if (!name || !email || !phone) {
    return res.render("register", {
      training,
      error: "Nama, email, dan nomor HP wajib diisi.",
      form: req.body,
    });
  }

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
  };
  await db.addRegistration(pendaftaran);

  res.redirect("/bayar/" + pendaftaran.id);
});

// Halaman pembayaran QRIS + upload bukti
app.get("/bayar/:id", async (req, res) => {
  const reg = await db.getRegistrationById(req.params.id);
  if (!reg) return res.status(404).render("404");

  const isiQr =
    process.env.QRIS_PAYLOAD ||
    `Pembayaran ${reg.trainingTitle} - ${reg.id} - ${rupiah(reg.amount)}`;
  const qrImage = await QRCode.toDataURL(isiQr, { width: 280, margin: 1 });

  res.render("payment", { reg, qrImage });
});

// Proses upload bukti pembayaran
app.post("/bayar/:id", upload.single("proof"), async (req, res) => {
  const reg = await db.getRegistrationById(req.params.id);
  if (!reg) return res.status(404).render("404");

  // Simpan bukti (ke S3 atau lokal) lalu catat referensinya di database
  let referensi = null;
  if (req.file) referensi = await storage.simpanBukti(req.file);
  await db.updateRegistrationProof(reg.id, referensi, "menunggu verifikasi");

  // Kirim email konfirmasi ke peserta dan admin
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
    <p>Bukti pembayaranmu sedang kami verifikasi. Tim kami akan menghubungi kamu segera.</p>`;

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

// Halaman selesai + tombol kirim bukti ke WhatsApp admin
app.get("/selesai/:id", async (req, res) => {
  const reg = await db.getRegistrationById(req.params.id);
  if (!reg) return res.status(404).render("404");

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

function wajibLogin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect("/admin/login");
}

app.get("/admin/login", (req, res) => {
  res.render("admin-login", { error: null });
});

app.post("/admin/login", (req, res) => {
  if (req.body.password === (process.env.ADMIN_PASSWORD || "admin123")) {
    req.session.isAdmin = true;
    return res.redirect("/admin");
  }
  res.render("admin-login", { error: "Password salah." });
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

// Dashboard admin: daftar training + daftar pendaftar
app.get("/admin", wajibLogin, async (req, res) => {
  res.render("admin", {
    trainings: await db.getTrainings(),
    registrations: await db.getRegistrations(),
    editing: null,
  });
});

// Form admin dalam mode EDIT satu training
app.get("/admin/edit/:id", wajibLogin, async (req, res) => {
  const editing = await db.getTrainingById(req.params.id);
  if (!editing) return res.redirect("/admin");
  res.render("admin", {
    trainings: await db.getTrainings(),
    registrations: await db.getRegistrations(),
    editing,
  });
});

// Tambah training baru
app.post("/admin/training", wajibLogin, async (req, res) => {
  const b = req.body;
  await db.addTraining({
    id: slugify(b.title) + "-" + Date.now().toString().slice(-4),
    title: b.title,
    category: b.category,
    level: b.level,
    description: b.description,
    duration: b.duration,
    certificate: b.certificate,
    price: Number(b.price) || 0,
    color: b.color || "linear-gradient(135deg,#1428a0,#27c4ff)",
  });
  res.redirect("/admin");
});

// Simpan perubahan training (mode edit)
app.post("/admin/training/:id/update", wajibLogin, async (req, res) => {
  const b = req.body;
  await db.updateTraining(req.params.id, {
    title: b.title,
    category: b.category,
    level: b.level,
    description: b.description,
    duration: b.duration,
    certificate: b.certificate,
    price: Number(b.price) || 0,
    color: b.color,
  });
  res.redirect("/admin");
});

// Hapus training
app.post("/admin/training/:id/delete", wajibLogin, async (req, res) => {
  await db.deleteTraining(req.params.id);
  res.redirect("/admin");
});

// Lihat bukti pembayaran (mengarahkan ke link sementara S3 / file lokal)
app.get("/admin/bukti/:id", wajibLogin, async (req, res) => {
  const reg = await db.getRegistrationById(req.params.id);
  if (!reg || !reg.proofFile) return res.status(404).render("404");
  const url = await storage.urlBukti(reg.proofFile);
  res.redirect(url);
});

// Ubah judul menjadi slug, mis. "Cisco CCNA" -> "cisco-ccna"
function slugify(teks) {
  return String(teks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------
//  HEALTH CHECK (untuk Load Balancer / Auto Scaling)
// ---------------------------------------------------------------
app.get("/health", (req, res) => res.status(200).send("OK"));

// Halaman tidak ditemukan
app.use((req, res) => res.status(404).render("404"));

// ---------------------------------------------------------------
//  JALANKAN SERVER (siapkan database dulu, baru menerima trafik)
// ---------------------------------------------------------------
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n  ID-Networkers Galaxy berjalan di http://localhost:${PORT}`);
      console.log(`  Penyimpanan bukti : ${storage.pakaiS3 ? "Amazon S3" : "lokal (folder uploads)"}`);
      console.log(`  Panel admin       : http://localhost:${PORT}/admin\n`);
    });
  })
  .catch((err) => {
    console.error("\n  GAGAL terhubung ke database. Cek konfigurasi DB_* di .env.");
    console.error("  Pesan:", err.message, "\n");
    process.exit(1); // systemd akan mencoba menjalankan ulang
  });
