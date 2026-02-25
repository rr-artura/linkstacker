# 🔗 Link Stacker

**Link Stacker** adalah aplikasi *link-in-bio* self-hosted — alternatif open-source dari layanan seperti [s.id](https://s.id), [Linktree](https://linktr.ee), dan [Bento](https://bento.me) — yang berjalan sepenuhnya di server sendiri.

![Preview](https://placehold.co/800x400/1e293b/94a3b8?text=Link+Stacker+Preview)

---

## ✨ Fitur Utama

- 🎨 **Admin Panel** berbasis web untuk mengelola semua konten
- 🔗 **Link, Folder, Text Block, Divider** — komponen yang bisa disusun bebas
- 🖼️ **Profile Banner** — warna, opasitas, gambar, dan mode fit (fill/contain/tile)
- 💬 **Text Shadow** — kontrol warna, opasitas, dan arah bayangan untuk semua teks
- 📁 **Folder terproteksi** — enkripsi AES-256 per item atau per folder
- 🧩 **Duplicate item** — salin ke halaman utama atau ke folder mana saja
- 📤 **Upload gambar** langsung dari admin panel
- 🌈 **Tema background** — preset animasi blob, solid color, gradient, atau gambar
- 🔒 **Password protection** — konten dienkripsi AES-256, aman di server
- 🐳 **Docker-ready** — deploy dalam hitungan menit

---

## 📊 Perbandingan dengan s.id

| Fitur | Link Stacker | s.id (Free) | s.id (Pro) |
|---|:---:|:---:|:---:|
| Self-hosted / data milik sendiri | ✅ | ❌ | ❌ |
| Biaya bulanan | Gratis | Gratis* | ~Rp 50rb/bln |
| Tampilan kustom penuh | ✅ | Terbatas | Sebagian |
| Proteksi konten (password) | ✅ AES-256 | ❌ | ✅ |
| Upload gambar sendiri | ✅ | ❌ | ✅ |
| Folder dengan sub-link | ✅ | ❌ | ❌ |
| Text block kustom | ✅ | ❌ | Terbatas |
| Profile banner kustom | ✅ | Terbatas | Terbatas |
| Tanpa iklan / watermark | ✅ | ❌ | ✅ |
| Analitik built-in | ❌ | ✅ | ✅ |
| Custom domain | ✅ (sendiri) | ✅ (s.id/user) | ✅ |
| Open Source | ✅ | ❌ | ❌ |

> *s.id gratis memiliki batasan fitur dan menampilkan branding s.id.

**Kapan pakai Link Stacker?**
- Anda ingin **data sepenuhnya milik sendiri**.
- Butuh **konten terproteksi** dengan enkripsi sungguhan.
- Ingin tampilan yang **100% bebas dikustomisasi**.
- Tidak mau bergantung pada layanan pihak ketiga.

---

## 🏗️ Arsitektur

```
link-stacker/
├── admin/              # Admin panel (Express.js)
│   ├── server.js       # API server (port 8080)
│   └── public/         # UI admin panel
├── public/             # Halaman publik (static, served via Nginx)
│   ├── index.html
│   ├── style.css
│   └── script.js
├── data/               # Data persisten (volume Docker)
│   ├── config.json         # Config publik (terenkripsi)
│   ├── config.private.json # Config admin (JANGAN di-commit!)
│   └── uploads/            # Gambar yang diupload
├── Dockerfile.admin
├── Dockerfile.nginx
└── docker-compose.yml
```

---

## 🚀 Instalasi

### Opsi A — Docker (Direkomendasikan)

**Prasyarat:** Docker & Docker Compose terinstall di server.

```bash
# 1. Clone repo
git clone https://github.com/rr-artura/linkstacker.git
cd linkstacker

# 2. (Opsional) Edit port di docker-compose.yml untuk test lokal
#    Lihat komentar di dalam file untuk petunjuknya

# 3. Build & jalankan
docker compose up --build -d

# 4. Cek status
docker compose ps
```

Setelah berjalan:
| Layanan | URL Default |
|---|---|
| Admin Panel | `http://localhost:8080` |
| Halaman Publik | `http://localhost:3000` *(jika port dibuka)* |

**Update setelah ada perubahan kode:**
```bash
git pull
docker compose up --build -d
```

---

### Opsi B — Lokal tanpa Docker (Development)

**Prasyarat:** Node.js 18+

```bash
# 1. Clone repo
git clone https://github.com/rr-artura/linkstacker.git
cd linkstacker

# 2. Install dependensi admin
cd admin && npm install && cd ..

# 3. Jalankan admin server
node admin/server.js
# → Admin panel: http://localhost:8080

# 4. Di terminal lain — jalankan halaman publik
npx serve public -p 3000
# → Halaman publik: http://localhost:3000
```

---

## 🌐 Deploy ke Produksi

### Struktur yang Direkomendasikan

```
Internet
   │
   ├── Cloudflare Tunnel ──→ link-stacker-web (Nginx, port 80)
   │                         Halaman publik
   │
   └── VPN / NPM ──────────→ link-stacker-admin (Node.js, port 8080)
                              Admin panel (akses terbatas)
```

### Setup Cloudflare Tunnel (Halaman Publik)

```bash
# Install cloudflared di server
curl -L -o cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Login & buat tunnel
cloudflared tunnel login
cloudflared tunnel create link-stacker
```

Di dashboard Cloudflare Zero Trust → Tunnels:
- **Service:** `http://localhost:3000` (atau nama container)
- **Domain:** domain Anda (misal: `links.sekolah.sch.id`)

### Akses Admin via SSH Tunnel

Cara paling aman akses admin tanpa ekspos ke internet:

```bash
# Dari laptop Anda
ssh -L 8080:localhost:8080 user@SERVER_IP
# Buka http://localhost:8080 di browser
```

---

## 🔐 Keamanan

- **Jangan commit `data/config.private.json`** — file ini berisi data sensitif
- **Batasi akses admin** — jangan ekspos port 8080 ke internet publik
- **Gunakan HTTPS** — selalu via Cloudflare Tunnel atau reverse proxy dengan SSL
- Password konten dienkripsi **AES-256** di sisi server sebelum disimpan

---

## 📝 Lisensi

MIT — bebas digunakan, dimodifikasi, dan didistribusikan.
