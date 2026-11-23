# BKU UPZ Cipeundeuy

Aplikasi Buku Kas Umum UPZ Kecamatan Cipeundeuy berbasis HTML, CSS, dan JavaScript. Paket ini mencakup dashboard publik, autentikasi admin melalui Supabase, profil lembaga, transaksi pemasukan/pengeluaran, kwitansi, dan laporan.

## Pembaruan tampilan

- Identitas visual hijau tua dengan aksen emas dan permukaan terang.
- Sidebar tetap pada desktop; navigasi bawah tetap pada ponsel/tablet.
- Kartu ringkasan lebih mudah dipindai, angka menggunakan tabular numerals.
- Panel, tabel, formulir, dialog, dan tombol memiliki gaya yang konsisten.
- Tata letak responsif untuk ponsel kecil hingga desktop.
- Fokus keyboard terlihat, dukungan `prefers-reduced-motion`, dan safe-area perangkat.
- Area header tetap terlihat saat halaman digulir.

Perubahan tampilan berada di `style.css` dan metadata di `index.html`. Logika transaksi, laporan, kwitansi, profil, serta integrasi Supabase tidak sengaja diubah.

## Upload ke GitHub

1. Ekstrak ZIP ini.
2. Unggah **seluruh isi folder** ke root repositori GitHub, sehingga `index.html` berada langsung di root.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/(root)`, lalu simpan.
6. Tunggu proses deployment selesai dan buka URL GitHub Pages yang diberikan.

Tidak diperlukan proses build atau instalasi dependency. Untuk pengujian lokal, jalankan folder melalui server HTTP statis (bukan membuka `index.html` sebagai `file://`).

## Konfigurasi Supabase

Aplikasi menggunakan konfigurasi proyek Supabase yang sudah ada di `app.js` (`PROJECT`, `KEY`, dan `ADMIN`). Jika repositori ini menggunakan proyek yang sama dan aplikasi sebelumnya telah berjalan, konfigurasi tidak perlu diganti.

Jika menggunakan proyek Supabase baru:
- Buat akun admin di Supabase Authentication.
- Sesuaikan URL proyek, publishable/anon key, dan UUID admin di `app.js`.
- Siapkan tabel, view/RPC, kebijakan RLS, dan struktur profil/kwitansi sesuai kebutuhan kode aplikasi. Skrip SQL skema **tidak disertakan** dalam ZIP ini; gunakan skrip dari proyek Supabase yang sudah ada atau siapkan skema yang cocok sebelum deployment.

**Keamanan:** hanya gunakan publishable/anon key di frontend. Jangan pernah menaruh `service_role` key, password, atau secret server di GitHub. Pastikan Row Level Security (RLS) aktif dan kebijakan publik hanya membuka ringkasan yang memang aman ditampilkan.

## Struktur berkas

- `index.html` — kerangka halaman.
- `style.css` — seluruh gaya dan responsivitas UI.
- `app.js` — navigasi, dashboard, transaksi, dan koneksi Supabase.
- `profile.js` — profil lembaga dan susunan pengurus.
- `receipt.js` — kwitansi.
- `report.js` — penyusunan dan pencetakan laporan.

## Catatan

Paket ini adalah aplikasi frontend statis. Data transaksi dan autentikasi tetap bergantung pada konfigurasi serta kebijakan Supabase. Uji dashboard publik, login admin, tambah/edit transaksi, profil, cetak kwitansi, dan laporan setelah deployment.
