# 🔗 Link Stacker

**Link Stacker** Self-hosted *link-in-bio* app — alternatif open-source dari layanan seperti [s.id](https://s.id) atau [Linktree](https://linktr.ee) yang dibangun menggunakan AI

![Preview](https://placehold.co/800x400/1e293b/94a3b8?text=Link+Stacker+Preview)

---

## ✨ Fitur Utama

- 🎨 **Isolated Admin Panel**
- 🔗 **Link, Folder, Text Block, Divider**
- 🖼️ **Profile Banner**
- 📁 **Link terproteksi**
- 🧩 **Duplicate item**
- 🌈 **Tema background**
- 🐳 **Docker-ready**

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

## 📝 Lisensi

MIT — bebas digunakan, dimodifikasi, dan didistribusikan.
