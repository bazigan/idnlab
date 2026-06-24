/**
 * storage.js
 * --------------------------------------------------------------
 * Menyimpan FOTO BUKTI PEMBAYARAN.
 *
 *  - Kalau S3_BUCKET diisi di .env  -> file diupload ke Amazon S3.
 *  - Kalau dikosongkan              -> file disimpan lokal (mode lab).
 *
 * Untuk melihat bukti, app membuat "presigned URL" (link sementara)
 * supaya admin bisa klik dan langsung lihat fotonya TANPA harus
 * buka konsol S3. Bucket tetap bisa private (lebih aman).
 *
 * Di EC2, kredensial AWS diambil otomatis dari IAM Role instance —
 * jadi di .env cukup isi NAMA BUCKET-nya saja.
 * --------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const BUCKET = process.env.S3_BUCKET; // contoh isi .env: S3_BUCKET=idn-bukti-bayar
const REGION = process.env.AWS_REGION_S3 || "ap-southeast-1";
const pakaiS3 = Boolean(BUCKET);

// Siapkan klien S3 hanya bila bucket diisi
const s3 = pakaiS3 ? new S3Client({ region: REGION }) : null;

/**
 * Menyimpan satu file bukti.
 * @param {Object} file - hasil multer memoryStorage: { buffer, originalname, mimetype }
 * @returns {string} referensi yang disimpan ke database
 *   - "s3:namafile.jpg"   bila disimpan di S3
 *   - "/uploads/namafile" bila disimpan lokal
 */
async function simpanBukti(file) {
  const ext = path.extname(file.originalname) || ".jpg";
  const namaFile = "bukti-" + Date.now() + ext;

  if (pakaiS3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: namaFile,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    return "s3:" + namaFile;
  }

  // Mode lab: simpan ke folder public/uploads
  const tujuan = path.join(__dirname, "..", "public", "uploads", namaFile);
  fs.writeFileSync(tujuan, file.buffer);
  return "/uploads/" + namaFile;
}

/**
 * Membuat URL untuk melihat bukti.
 * @param {string} referensi - nilai yang tersimpan di database
 * @returns {string|null} URL yang bisa langsung dibuka
 */
async function urlBukti(referensi) {
  if (!referensi) return null;

  // File di S3 -> buat link sementara (berlaku 5 menit)
  if (referensi.startsWith("s3:")) {
    const key = referensi.slice(3);
    return await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 300 }
    );
  }

  // File lokal -> pakai path apa adanya
  return referensi;
}

module.exports = { simpanBukti, urlBukti, pakaiS3 };
