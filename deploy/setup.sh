#!/usr/bin/env bash
# ==============================================================
#  setup.sh — Menyiapkan satu instance EC2 SEBELUM dibuat AMI.
#
#  Jalankan SEKALI di instance dasar, lalu buat AMI dari instance
#  itu. Karena service di-"enable", semua instance turunan AMI
#  (termasuk dari Auto Scaling) akan otomatis menjalankan app.
#
#  Cara pakai (contoh Ubuntu):
#     git clone <repo-mu> /tmp/idn && cd /tmp/idn
#     chmod +x deploy/setup.sh && sudo deploy/setup.sh
# ==============================================================
set -euo pipefail

APP_DIR=/opt/idn-galaxy
APP_USER=ubuntu   # Amazon Linux: ganti jadi ec2-user

echo ">> 1. Install Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo ">> 2. Salin project ke ${APP_DIR}"
sudo mkdir -p "${APP_DIR}"
# Disalin dari folder tempat script ini dijalankan (root project)
sudo cp -r "$(dirname "$0")/.." "${APP_DIR}.tmp"
sudo rm -rf "${APP_DIR}"
sudo mv "${APP_DIR}.tmp" "${APP_DIR}"
sudo chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

echo ">> 3. Install dependency (production saja)"
cd "${APP_DIR}"
sudo -u "${APP_USER}" npm install --omit=dev

echo ">> 4. Siapkan file .env"
# PENTING: jangan menaruh password asli di dalam AMI.
# Idealnya ambil dari AWS SSM Parameter Store / Secrets Manager
# lewat user-data saat instance booting. Untuk awal, salin contoh:
if [ ! -f "${APP_DIR}/.env" ]; then
  sudo -u "${APP_USER}" cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
fi

echo ">> 5. Pasang & aktifkan service systemd"
sudo cp "${APP_DIR}/deploy/idn-galaxy.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable idn-galaxy   # <-- kunci auto-start saat boot
sudo systemctl restart idn-galaxy

echo ">> Selesai. Cek status:"
echo "   sudo systemctl status idn-galaxy"
echo "   curl localhost:3000/health"
echo ""
echo ">> Sekarang buat AMI dari instance ini. Instance baru dari AMI"
echo "   (termasuk dari Auto Scaling) akan menjalankan app otomatis."
