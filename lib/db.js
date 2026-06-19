/**
 * db.js
 * --------------------------------------------------------------
 * "Database" sederhana berbasis file JSON.
 * Tidak perlu install MySQL / MongoDB — cukup baca & tulis file.
 * Cocok untuk aplikasi kecil dan mudah dibaca pemula.
 * --------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

// Lokasi folder data (data/trainings.json, data/registrations.json)
const DATA_DIR = path.join(__dirname, "..", "data");

/** Membaca isi sebuah file JSON dan mengubahnya jadi array/objek JavaScript. */
function readJson(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const isi = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(isi);
}

/** Menyimpan array/objek JavaScript kembali ke file JSON (rapi dengan indentasi 2 spasi). */
function writeJson(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ---------- Fungsi khusus KATALOG TRAINING ----------

function getTrainings() {
  return readJson("trainings.json");
}

function getTrainingById(id) {
  return getTrainings().find((t) => t.id === id);
}

function saveTrainings(list) {
  writeJson("trainings.json", list);
}

// ---------- Fungsi khusus PENDAFTARAN ----------

function getRegistrations() {
  return readJson("registrations.json");
}

function getRegistrationById(id) {
  return getRegistrations().find((r) => r.id === id);
}

function saveRegistrations(list) {
  writeJson("registrations.json", list);
}

module.exports = {
  getTrainings,
  getTrainingById,
  saveTrainings,
  getRegistrations,
  getRegistrationById,
  saveRegistrations,
};
