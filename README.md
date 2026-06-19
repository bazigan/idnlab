# ID-Networkers Galaxy

Website training bertema **Samsung Galaxy**: katalog dinamis, panel admin, dan pendaftaran + pembayaran QRIS. Dibuat dengan **Node.js (Express)** dan penyimpanan data berbasis file JSON, jadi tidak perlu setup database.

---

## Fitur

- **Katalog training** yang tampil dari data, lengkap dengan filter kategori.
- **Pendaftaran tanpa login**: peserta isi data → bayar via QRIS → upload bukti → selesai.
- **Konfirmasi otomatis** dikirim ke email peserta & admin, plus tombol kirim bukti ke **WhatsApp** admin.
- **Panel admin** (`/admin`) untuk **tambah, edit, hapus** training dan melihat daftar pendaftar.

---

## Cara menjalankan

Pastikan sudah ada **Node.js versi 18 atau lebih baru**.
# 0. Install nodejs
```bash
sudo apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

```bash
# 1. Install dependency
npm install

# 2. Siapkan konfigurasi (salin lalu edit)
cp .env.example .env

# 3. Jalankan
npm start
```

Buka di browser:

- Website: **http://localhost:3000**
- Panel admin: **http://localhost:3000/admin** (password default: `admin123`)

> Mode pengembangan dengan auto-reload: `npm run dev`

---

## Konfigurasi (.env)

Semua opsional kecuali kalau ingin fitur tertentu aktif:

| Variabel | Fungsi |
|---|---|
| `PORT` | Port server (default 3000) |
| `ADMIN_PASSWORD` | Password masuk panel admin |
| `SESSION_SECRET` | Teks acak untuk keamanan session |
| `ADMIN_PHONE` | Nomor WhatsApp admin, format `628xxx` |
| `QRIS_PAYLOAD` | Teks QRIS merchant kamu (kalau kosong, QR berisi ringkasan pesanan) |
| `SMTP_*`, `MAIL_FROM`, `ADMIN_EMAIL` | Pengaturan email. Kalau kosong, isi email cukup dicetak di terminal |

---

## Struktur folder

```
idn-galaxy/
├── server.js              # File utama: semua route ada di sini
├── lib/
│   ├── db.js              # Baca/tulis data ke file JSON
│   └── mailer.js          # Kirim email (aman walau belum dikonfigurasi)
├── data/
│   ├── trainings.json     # Katalog training
│   └── registrations.json # Data pendaftar (terisi otomatis)
├── views/                 # Template halaman (EJS)
│   ├── partials/          # Potongan dipakai berulang (nav, footer, head)
│   ├── index.ejs          # Beranda + katalog
│   ├── register.ejs       # Form pendaftaran
│   ├── payment.ejs        # Halaman QRIS + upload bukti
│   ├── success.ejs        # Halaman selesai
│   ├── admin-login.ejs    # Login admin
│   ├── admin.ejs          # Dashboard admin
│   └── 404.ejs            # Halaman tidak ditemukan
└── public/                # File statis (CSS, JS, gambar, upload)
    ├── css/style.css
    ├── js/main.js
    └── uploads/           # Bukti pembayaran tersimpan di sini
```

---

## Catatan

- **QRIS**: untuk transaksi sungguhan, isi `QRIS_PAYLOAD` dengan payload QRIS resmi dari penyedia pembayaran merchant kamu.
- **Harga training** pada data contoh bukan harga resmi — sesuaikan lewat panel admin.
- Data tersimpan di file JSON, cocok untuk skala kecil. Untuk skala besar, ganti `lib/db.js` dengan database seperti SQLite/PostgreSQL tanpa mengubah bagian lain.

MIT License.
