# ID-Networkers LAB

Website training bertema **LAB**: katalog dinamis, panel admin, dan pendaftaran + pembayaran QRIS. Dibuat dengan **Node.js (Express)**.

- **Data** (katalog & pendaftaran) disimpan di **MariaDB / MySQL** (RDS).
- **Foto bukti pembayaran** diunggah ke **Amazon S3**, dan tetap bisa dilihat langsung dari panel admin lewat link sementara — tanpa buka konsol S3.
- Semua diatur lewat **.env**: tinggal isi endpoint RDS dan nama bucket S3.

---

## Fitur

- **Katalog training** dinamis dengan filter kategori.
- **Pendaftaran tanpa login**: isi data -> bayar via QRIS -> upload bukti -> selesai.
- **Konfirmasi otomatis** ke email peserta & admin, plus tombol kirim bukti ke **WhatsApp** admin.
- **Panel admin** (`/admin`): tambah, edit, hapus training, dan lihat pendaftar + bukti bayar.

---

## Cara menjalankan

Butuh **Node.js 18+** dan satu database **MariaDB/MySQL** (lokal atau RDS).

```bash
# 0. Install nodejs
sudo apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v

# 1. Install MariaDB
apt install mariadb-server

mysql

grant all privileges on idn.* to 'admin'@'%' identified by 'admin123'
```


```bash
# 1. Install dependency
npm install

# 2. Siapkan konfigurasi, lalu isi DB_* (dan S3_BUCKET kalau pakai S3)
cp .env.example .env

# 3. Jalankan (tabel & katalog awal dibuat otomatis saat pertama jalan)
npm start
```

Buka **http://localhost:3000** — admin di **/admin** (password default `admin123`).

---

## Konfigurasi (.env)

| Variabel | Fungsi |
|---|---|
| `PORT` | Port server (default 3000) |
| `ADMIN_PASSWORD` | Password panel admin |
| `SESSION_SECRET` | Teks acak untuk keamanan session |
| `ADMIN_PHONE` | Nomor WhatsApp admin, format `628xxx` |
| `QRIS_PAYLOAD` | Payload QRIS merchant (kosong = QR berisi ringkasan) |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | Koneksi ke MariaDB/RDS |
| `S3_BUCKET` | Nama bucket S3 untuk bukti. **Kosong = simpan lokal** |
| `AWS_REGION` | Region S3 (mis. `ap-southeast-1`) |
| `SMTP_*`, `MAIL_FROM`, `ADMIN_EMAIL` | Email konfirmasi. Kosong = dicetak di terminal |

> Di EC2, kredensial AWS untuk S3 diambil otomatis dari **IAM Role** instance, jadi di `.env` cukup isi nama bucket.

---

## Struktur folder

```
idnlab/
├── server.js              # File utama: semua route
├── lib/
│   ├── db.js              # Koneksi & query MariaDB (buat tabel + seed otomatis)
│   ├── seed.js            # Katalog awal (dipakai saat tabel kosong)
│   ├── storage.js         # Upload bukti ke S3 / lokal + link lihat langsung
│   └── mailer.js          # Kirim email (aman walau belum dikonfigurasi)
├── views/                 # Template halaman (EJS)
│   ├── partials/          # Potongan dipakai berulang (nav, footer, head)
│   ├── index.ejs          # Beranda + katalog
│   ├── register.ejs       # Form pendaftaran
│   ├── payment.ejs        # Halaman QRIS + upload bukti
│   ├── success.ejs        # Halaman selesai
│   ├── admin-login.ejs    # Login admin
│   ├── admin.ejs          # Dashboard admin
│   └── 404.ejs
├── public/                # CSS, JS, gambar (+ uploads/ untuk fallback lokal)
└── deploy/                # File untuk deploy ke AWS (lihat DEPLOY-AWS.md)
```

---

## Catatan

- **Database**: tabel `trainings` dan `registrations` dibuat otomatis. Katalog awal hanya di-seed kalau tabel masih kosong.
- **S3**: bucket boleh tetap *private*. App membuat *presigned URL* (berlaku 5 menit) saat admin klik "Lihat".
- **QRIS**: untuk transaksi sungguhan, isi `QRIS_PAYLOAD` dengan payload resmi dari penyedia pembayaran merchant.

MIT License.
