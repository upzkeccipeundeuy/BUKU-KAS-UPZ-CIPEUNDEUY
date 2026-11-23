# BKU UPZ Cipeundeuy — Professional Edition

Aplikasi Buku Kas Umum UPZ Kecamatan Cipeundeuy berbasis HTML, CSS, dan JavaScript dengan Supabase sebagai backend.

## Pembaruan Professional Edition

- Dashboard statistik tahunan dengan grafik perbandingan pemasukan dan pengeluaran per bulan.
- Ringkasan total pemasukan, pengeluaran, dan saldo bersih berdasarkan tahun yang dipilih.
- Pencarian transaksi admin berdasarkan nomor kwitansi, nama, tanggal, kriteria, dan uraian.
- Filter transaksi berdasarkan kategori.
- Penyempurnaan kop laporan cetak/PDF dengan alamat, nomor telepon (jika diisi pada profil), email, logo, dan tanda tangan pengurus.
- Penyempurnaan tampilan profil lembaga dan informasi pengurus.
- Navigasi responsif, khususnya pada perangkat ponsel.
- Perbaikan struktur dokumen HTML dan metadata halaman.

## Upload ke GitHub

1. Unduh dan ekstrak ZIP.
2. Unggah seluruh isi folder ini ke root repositori GitHub (pastikan `index.html` langsung berada di root).
3. Buka **Settings → Pages**.
4. Pilih **Deploy from a branch**, branch `main`, folder `/(root)`, lalu simpan.
5. Tunggu deployment selesai dan buka alamat GitHub Pages.

Aplikasi tidak memerlukan proses build atau instalasi dependency. Untuk pengujian lokal, jalankan menggunakan server HTTP statis.

## Supabase dan keamanan

Konfigurasi Supabase yang sudah ada pada `app.js` dipertahankan agar aplikasi tetap mengarah ke proyek sebelumnya. Jika menggunakan proyek Supabase berbeda, sesuaikan URL, publishable/anon key, dan UUID admin.

- Jangan pernah memasukkan `service_role` key atau secret server ke frontend/GitHub.
- Pastikan Row Level Security (RLS) aktif.
- Kebijakan akses publik sebaiknya hanya mengizinkan ringkasan yang memang aman dipublikasikan.
- Uji login admin, akses publik, tambah/edit/hapus transaksi, profil, kwitansi, dan laporan setelah deployment.

## Struktur berkas

- `index.html` — kerangka halaman.
- `style.css` — desain, responsivitas, grafik, dan tampilan cetak.
- `app.js` — dashboard, statistik, navigasi, transaksi, dan koneksi Supabase.
- `profile.js` — profil lembaga dan susunan pengurus.
- `receipt.js` — pembuatan kwitansi PDF.
- `report.js` — filter dan penyusunan laporan untuk cetak/simpan PDF.
- `CATATAN-REDESAIN-UI.md` — ringkasan perubahan dan saran pengembangan.

## Catatan kompatibilitas

Perubahan ini tidak mengubah struktur tabel database, autentikasi, maupun endpoint Supabase. Skrip SQL setup tidak terdapat di arsip sumber yang diterima, sehingga tidak dibuat atau dimasukkan ke paket ini. Jika proyek Supabase Anda telah berjalan dengan skema lama, gunakan skema tersebut seperti sebelumnya.
