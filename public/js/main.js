/* ==============================================================
   main.js — semua interaksi & animasi di sisi browser.
   ============================================================== */

// Tandai bahwa JS aktif. Class ini yang "mengizinkan" animasi reveal.
// Kalau JS gagal jalan, class ini tidak pernah ada -> konten tetap tampil.
document.documentElement.classList.add("js-anim");

document.addEventListener("DOMContentLoaded", function () {
  // ---------- 1. ANIMASI MUNCUL SAAT SCROLL ----------
  const targets = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach(function (el) { observer.observe(el); });
  } else {
    // Browser lama: langsung tampilkan semua
    targets.forEach(function (el) { el.classList.add("in"); });
  }

  // ---------- 2. EFEK RIPPLE SAAT TOMBOL DIKLIK ----------
  document.querySelectorAll("[data-ripple]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const size = Math.max(btn.clientWidth, btn.clientHeight);
      const rect = btn.getBoundingClientRect();
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = e.clientX - rect.left - size / 2 + "px";
      ripple.style.top = e.clientY - rect.top - size / 2 + "px";
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 600);
    });
  });

  // ---------- 3. FILTER KATALOG (chip kategori) ----------
  const chips = document.querySelectorAll(".chip");
  const cards = document.querySelectorAll(".prod-grid .card");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelector(".chip.active")?.classList.remove("active");
      chip.classList.add("active");
      const filter = chip.dataset.filter;
      cards.forEach(function (card) {
        const cocok = filter === "all" || card.dataset.cat === filter;
        card.style.display = cocok ? "" : "none";
      });
    });
  });

  // ---------- 4. PROGRESS BAR & TOMBOL KE ATAS ----------
  const progress = document.getElementById("progress");
  const totop = document.getElementById("totop");

  window.addEventListener("scroll", function () {
    const y = window.scrollY;
    const tinggi = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (y / tinggi) * 100 + "%";
    if (totop) totop.classList.toggle("show", y > 500);
  });

  if (totop) {
    totop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});
