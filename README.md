# DigiDreams Mini-POS & Order Engine

Mini POS untuk Digidreams Cafe and Space: katalog menu dengan pencarian dan filter, keranjang dengan manipulasi jumlah, promo, checkout transaksional dengan pengurangan stok, serta struk digital yang bisa dicetak ke kertas thermal 58 mm.

## Fitur

- **Katalog menu** — pencarian teks (shortcut `/`), filter kategori, stok dan harga per produk.
- **Tiket pesanan** — tambah/kurangi jumlah, hapus item, lihat subtotal langsung. Panel tiket menjadi sheet di layar kecil.
- **Promo `DIGIZEN10`** — diskon 10% dengan minimum belanja Rp 50.000. Promo otomatis dilepas saat subtotal turun di bawah minimum dan bisa dipakai lagi setelah subtotal cukup.
- **Checkout aman** — transaksi Prisma melakukan validasi stok secara atomik, mengurangi stok, dan menyimpan order beserta itemnya. Kekurangan stok menghasilkan `409`.
- **Perhitungan uang** — seluruh nilai disimpan sebagai integer rupiah. Urutan: `Subtotal → Diskon → PPN 10% dari (Subtotal − Diskon) → Total`, dengan pembulatan `Math.round`.
- **Struk digital** — modal setelah pembayaran, halaman detail `/orders/[invoice]`, tombol cetak, dan `@media print` untuk kertas 58 mm.
- **Aksesibilitas** — fokus dijaga di dalam modal, `Esc` menutup modal, `aria-live` untuk perubahan harga dan pesan promo.

## Stack

| Bagian | Teknologi |
| --- | --- |
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Styling | Tailwind CSS 4 |
| Database | Prisma 6 + SQLite |
| Validasi | Zod |
| Test | Node.js test runner + `tsx` |
| Font | Fraunces, DM Sans, DM Mono (`next/font`) |

Logo dan foto produk diambil dari [digidreams.id/products](https://digidreams.id/products) dan disimpan lokal di `public/assets/digidreams/` agar tidak bergantung pada jaringan saat runtime.

## Menjalankan secara lokal

Butuh Node.js 20.9+ dan npm.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Buka <http://localhost:3000>.

> **Catatan path:** skrip npm di repo ini memanggil biner langsung (`node node_modules/...`) sehingga tetap bekerja jika folder workspace mengandung spasi, `&`, atau huruf kapital. Jika memakai `npm run dev` pada path biasa, shim default juga tidak masalah.

Untuk mengembalikan stok dan data contoh ke kondisi awal:

```bash
npm run db:reset
```

Perintah ini menjalankan migrasi ulang dan seeder (`npm run db:seed` otomatis dipanggil Prisma).

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server Next.js |
| `npm run build` | Build produksi + type check |
| `npm run start` | Jalankan build produksi |
| `npm run lint` | ESLint |
| `npm test` | Unit test perhitungan harga, promo, dan validasi payload |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Migrasi database SQLite |
| `npm run db:push` | Sinkronkan schema tanpa file migrasi |
| `npm run db:seed` | Isi 4 kategori, 8 produk, dan promo `DIGIZEN10` |
| `npm run db:reset` | Reset database + seed ulang |
| `npm run db:studio` | Prisma Studio |

## API

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/api/products` | Daftar produk beserta kategori dan stok |
| `POST` | `/api/promo/validate` | `{ code, subtotal }` → validitas, promo, dan nominal diskon |
| `POST` | `/api/checkout` | `{ items, promoCode, paymentMethod }` → order transaksional |
| `GET` | `/api/orders/[invoice]` | Detail order berdasarkan nomor invoice |

Contoh checkout:

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H 'content-type: application/json' \
  -d '{"items":[{"productId":1,"quantity":2}],"promoCode":"DIGIZEN10","paymentMethod":"QRIS"}'
```

Nomor invoice berformat `INV-YYYY-###` dan halaman struknya tersedia di `/orders/INV-YYYY-###`.

## Struktur singkat

```text
prisma/
  schema.prisma          model Category, Product, Promo, Order, OrderItem
  migrations/            migrasi SQL
  seed.ts                data menu + promo
src/
  app/
    page.tsx             halaman kasir
    orders/[invoice]/    halaman struk digital
    api/                 route handler
  components/pos/        UI kasir, tiket, promo, struk, modal
  lib/                   prisma, pricing, invoice, money, query, API client
  types/pos.ts           DTO bersama
public/assets/digidreams/  logo dan foto produk
```

## Verifikasi

```bash
npm run lint
npm test
npm run build
```

Semua perintah di atas harus lulus sebelum deploy. Data lokal (`.env`, `prisma/*.db`, `node_modules`, `.next`) sengaja tidak dimasukkan ke git; hanya `.env.example` yang ikut di-commit.
