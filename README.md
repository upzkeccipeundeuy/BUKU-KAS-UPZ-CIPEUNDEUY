# BKU UPZ Cipeundeuy

Aplikasi Buku Kas Umum untuk UPZ Kecamatan Cipeundeuy. Paket ini memuat dashboard umum dan admin, profil lembaga, transaksi pemasukan dan pengeluaran, kwitansi PDF, dan laporan A4 potret dengan periode bulanan atau tahunan.

## Unggah ke GitHub

1. Ekstrak ZIP.
2. Unggah isi hasil ekstraksi ke root repositori GitHub sehingga `index.html` berada langsung di root.
3. Jika ingin menayangkan aplikasi melalui GitHub Pages, buka **Settings → Pages**. Pilih **Deploy from a branch**, lalu pilih **main** dan **/(root)**.

Aplikasi memakai HTML, CSS, dan JavaScript biasa. Tidak ada pemasangan paket atau proses build. Untuk pengujian lokal, layani isi folder melalui server HTTP statis. Penayangan di GitHub Pages memberi pengunjung akses ke dashboard umum. Login Supabase tetap mengontrol akses admin dan rincian transaksi.

## Supabase

Paket ini sudah memakai URL proyek, publishable key, dan ID admin yang digunakan aplikasi. Jika memakai proyek Supabase yang sama dan seluruh fitur sudah berjalan, lewati pemasangan SQL. Data transaksi dan profil tetap dibaca dari Supabase.

Untuk proyek Supabase baru:

1. Buat akun admin di **Authentication → Users**. Isi URL proyek, publishable key, dan ID akun tersebut pada konstanta `PROJECT`, `KEY`, dan `ADMIN` di `app.js`.
2. Ganti UUID admin pada `setup-akses-supabase.sql` dan `setup-profil-supabase.sql` dengan ID yang sama.
3. Jalankan file berikut di **SQL Editor** sesuai urutan.
   - `setup-skema-supabase.sql` membuat tabel transaksi dan view BKU.
   - `setup-akses-supabase.sql` mengatur akses admin dan ringkasan umum.
   - `setup-profil-supabase.sql` membuat penyimpanan profil dan susunan pengurus.
   - `setup-kwitansi-supabase.sql` mengaktifkan nomor kwitansi otomatis.
4. Masuk memakai akun admin. Untuk mencoba dengan data contoh, pilih **Login → Coba Admin Demo**.

Gunakan hanya publishable key di kode frontend. Simpan service role key dan kata sandi di luar repositori.


## Penyegaran tampilan UI

Paket ini menyertakan penyegaran tampilan tanpa mengubah struktur database atau alur transaksi:
- Sidebar hijau profesional untuk layar desktop.
- Navigasi drawer dengan tombol menu pada ponsel, termasuk tombol tutup, backdrop, dan tombol Escape.
- Kartu ringkasan, panel, tombol, tabel, dan formulir dengan jarak serta kontras yang lebih konsisten.
- Tata letak responsif untuk ponsel kecil, tablet, dan desktop.
- Fokus keyboard dan preferensi reduced-motion tetap diperhatikan.

Untuk memperbarui GitHub, unggah seluruh isi folder `BUKU-KAS-UPZ-CIPEUNDEUY-main` ke repositori (timpa file lama). Jangan menghapus atau mengganti konfigurasi Supabase yang sudah digunakan.


## Navigasi menu bawah untuk HP

Pada layar berukuran tablet/ponsel (lebar sampai 900px), navigasi berubah menjadi bottom navigation tetap di bagian bawah layar. Setiap menu menampilkan ikon dan label, menu aktif diberi penanda hijau, dan area konten diberi ruang bawah agar tidak tertutup navigasi. Pada desktop, sidebar kiri tetap digunakan. Navigasi mengikuti safe-area perangkat dan tetap memakai menu serta alur halaman aplikasi yang sudah ada.
