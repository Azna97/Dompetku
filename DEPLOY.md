# Deploy DompetKu ke Vercel + Supabase

Aplikasi ini sudah disiapkan untuk memakai PostgreSQL/Supabase lewat `DATABASE_URL`. Untuk deploy Vercel, jangan memakai SQLite lokal.

## 1. Siapkan Supabase

1. Buat project di Supabase.
2. Buka `SQL Editor`.
3. Copy isi `supabase_schema.sql`.
4. Paste ke SQL Editor, lalu klik `Run`.
5. Pastikan tabel seperti `users`, `wallets`, `transactions`, `assets`, dan `debts` muncul di `Table Editor`.

## 2. Ambil DATABASE_URL

1. Di Supabase, buka `Connect` atau `Project Settings > Database`.
2. Copy connection string PostgreSQL. Untuk Vercel/serverless, gunakan pooler jika tersedia.
3. Jika password punya karakter spesial, gunakan connection string yang sudah di-encode. Contoh `#` harus menjadi `%23`.

Contoh:

```env
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-xxx.pooler.supabase.com:6543/postgres
NODE_ENV=production
```

## 3. Test lokal dengan Supabase

Di PowerShell:

```powershell
cd D:\myapps\Dompetku
$env:DATABASE_URL='ISI_DATABASE_URL_SUPABASE_KAMU'
npm start
```

Buka:

```text
http://localhost:3000
```

Cek fitur ini sebelum deploy:

1. Register akun baru.
2. Login.
3. Tambah wallet.
4. Tambah pemasukan/pengeluaran.
5. Tambah transfer.
6. Cek nominal input otomatis memakai titik ribuan, misalnya `1.000.000`.
7. Refresh browser dan login ulang, pastikan data tetap ada.
8. Cek Supabase Table Editor, pastikan data masuk.

## 4. Deploy ke Vercel

1. Push project ke GitHub.
2. Buka Vercel.
3. Klik `Add New Project`.
4. Import repository DompetKu.
5. Gunakan setting:
   - Framework Preset: `Other`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: kosongkan/default
6. Tambahkan Environment Variables:

```env
DATABASE_URL=ISI_DATABASE_URL_SUPABASE_KAMU
NODE_ENV=production
```

7. Klik `Deploy`.

## 5. Test setelah deploy

Di URL Vercel:

1. Register akun baru.
2. Login.
3. Tambah wallet dan transaksi.
4. Refresh halaman.
5. Logout lalu login lagi.
6. Cek Supabase Table Editor.

Kalau semua berhasil, deploy sudah siap dipakai.

## Catatan penting

- Jangan commit file `.env`.
- Jangan membagikan `DATABASE_URL` ke publik.
- Jika connection string pernah bocor, reset password database Supabase.
- Backup data online dilakukan dari Supabase, bukan menu backup SQLite lokal.
