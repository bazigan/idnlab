/**
 * seed.js
 * --------------------------------------------------------------
 * Data katalog awal. Dipakai HANYA saat tabel trainings masih
 * kosong (mis. database RDS baru pertama kali dipakai).
 * Setelah itu pengelolaan lewat panel admin.
 * --------------------------------------------------------------
 */

module.exports = [
  { id: "mtcna", title: "MikroTik MTCNA", category: "network", level: "Pemula", description: "Dasar routing & switching MikroTik plus ujian sertifikasi resmi dari MikroTik.", duration: "4 hari", certificate: "Sertifikat MTCNA", price: 2500000, color: "linear-gradient(135deg,#e10600,#ff6a3d)" },
  { id: "ccna", title: "Cisco CCNA", category: "network", level: "Menengah", description: "Routing, switching, dan fundamental jaringan enterprise berbasis Cisco.", duration: "5 hari", certificate: "Persiapan CCNA", price: 4000000, color: "linear-gradient(135deg,#1ba0d7,#0b67a3)" },
  { id: "fortigate-nse4", title: "Fortigate NSE 4", category: "security", level: "Menengah", description: "Konfigurasi firewall Fortinet, security policy, dan VPN sampai siap ujian NSE 4.", duration: "4 hari", certificate: "Persiapan NSE 4", price: 4500000, color: "linear-gradient(135deg,#ee3124,#9c1b13)" },
  { id: "vmware-vsphere", title: "VMware vSphere Administration", category: "cloud", level: "Menengah", description: "Administrasi vCenter & ESXi: cluster, High Availability, vMotion, dan storage.", duration: "4 hari", certificate: "vSphere Admin", price: 5000000, color: "linear-gradient(135deg,#607078,#2f3a40)" },
  { id: "ceh", title: "Certified Ethical Hacker", category: "security", level: "Lanjutan", description: "Teknik hacking etis dan defense, persiapan sertifikasi internasional CEH.", duration: "5 hari", certificate: "Persiapan CEH", price: 7000000, color: "linear-gradient(135deg,#10141c,#3b2a6b)" },
  { id: "flutter", title: "Flutter Development", category: "dev", level: "Pemula", description: "Bangun aplikasi mobile Android & iOS dari satu codebase memakai Flutter.", duration: "4 hari", certificate: "Sertifikat IDN", price: 3500000, color: "linear-gradient(135deg,#02569b,#27c4ff)" },
  { id: "aws-saa", title: "AWS Solution Architect", category: "cloud", level: "Menengah", description: "Mendesain arsitektur cloud yang scalable dan aman di Amazon Web Services.", duration: "4 hari", certificate: "Persiapan AWS SAA", price: 6000000, color: "linear-gradient(135deg,#ff9900,#cc6f00)" },
  { id: "devops", title: "DevOps Engineering", category: "cloud", level: "Lanjutan", description: "CI/CD, Docker, Kubernetes, dan automation pipeline untuk deployment modern.", duration: "5 hari", certificate: "Sertifikat IDN", price: 6500000, color: "linear-gradient(135deg,#326ce5,#6b3df5)" },
];
