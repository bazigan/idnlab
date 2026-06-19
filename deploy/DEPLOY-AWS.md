# Deploy ke AWS EC2 + Auto Scaling

Ringkasan alur "golden AMI": siapkan satu instance → bake jadi AMI → pakai AMI itu di Launch Template → ASG launch instance dan app jalan otomatis.

## 1. Siapkan instance dasar

Launch satu EC2 (mis. Ubuntu), lalu:

```bash
git clone <repo-kamu> /tmp/idn && cd /tmp/idn
chmod +x deploy/setup.sh
sudo deploy/setup.sh
```

Script ini install Node.js, taruh app di `/opt/idnlab`, install dependency, dan meng-`enable` service `systemd`. Cek:

```bash
sudo systemctl status idnlab
curl localhost:3000/health     # harus balas: OK
```

## 2. Bake AMI

Karena service sudah di-`enable`, instance turunan AMI akan auto-start. Buat AMI:

- Console: pilih instance → Actions → Image and templates → Create image, atau
- CLI: `aws ec2 create-image --instance-id i-xxxx --name idnlab-v1`

## 3. Launch Template + Auto Scaling

Buat Launch Template pakai AMI di atas. Untuk konfigurasi per-instance (dan biar password tidak ke-bake ke AMI), isi **User data**:

```bash
#!/bin/bash
# Ambil rahasia dari SSM Parameter Store, tulis ke .env, lalu restart app.
aws ssm get-parameter --name "/idn/admin-password" --with-decryption \
  --query Parameter.Value --output text > /tmp/pw
{
  echo "PORT=3000"
  echo "ADMIN_PASSWORD=$(cat /tmp/pw)"
  echo "ADMIN_PHONE=628xxxxxxxxxx"
  # ...variabel lain sesuai .env.example
} | sudo tee /opt/idnlab/.env > /dev/null
sudo systemctl restart idnlab
```

Beri instance **IAM role** yang punya izin baca SSM (`ssm:GetParameter`) supaya user-data di atas bisa jalan.

Lalu buat Auto Scaling Group yang memakai Launch Template ini. Setiap instance baru akan boot → systemd start app → siap.

## 4. Load Balancer + Health Check

- Target group: arahkan ke **port 3000**, health check path **`/health`**.
- ASG didaftarkan ke target group itu; instance yang sehat (`/health` = 200) saja yang terima trafik.

## Catatan arsitektur (sudah didukung app)

App ini sudah siap untuk banyak instance di belakang Auto Scaling:

- **Data** (katalog & pendaftaran) di **RDS MariaDB** — tersinkron antar instance. Buat RDS, isi `DB_*` di `.env`. Tabel dibuat otomatis saat app pertama jalan.
- **File aplikasi** di **EFS** — mount permanen di AMI (mis. ke `/opt/idnlab`). Satu `.env` ikut tersinkron ke semua instance.
- **Bukti pembayaran** di **S3** — isi `S3_BUCKET` di `.env`. Beri IAM Role instance izin `s3:PutObject` dan `s3:GetObject` pada bucket itu. Admin tetap bisa lihat bukti via link sementara dari app.

IAM Role instance juga perlu izin `ssm:GetParameter` kalau secret diambil dari SSM (lihat contoh user-data di atas).

## Tips

- Lihat log: `journalctl -u idnlab -f`
- Update versi app: bake AMI baru → ganti AMI di Launch Template → instance refresh di ASG. Hindari edit manual di tiap instance.
