# Catatan Pengembangan — Professional Edition

## Yang ditambahkan
1. Statistik tahunan berdasarkan ringkasan transaksi Supabase yang tersedia.
2. Grafik batang pemasukan dan pengeluaran per bulan.
3. Ringkasan total pemasukan, pengeluaran, dan saldo bersih per tahun.
4. Pencarian transaksi admin berdasarkan nomor kwitansi, penerima/sumber dana, tanggal, kriteria, dan uraian.
5. Filter kategori transaksi.
6. Nomor telepon lembaga ditampilkan di kop laporan jika tersedia di profil.
7. Metadata dan struktur HTML utama dirapikan.

## Yang dipertahankan
- Konfigurasi koneksi Supabase yang sudah ada.
- Login dan pembatasan admin.
- Alur tambah, edit, dan hapus transaksi.
- Halaman profil dan susunan pengurus.
- Kwitansi PDF dan laporan cetak/simpan PDF.

## Pengujian yang dilakukan
- Pemeriksaan sintaks JavaScript dengan `node --check` untuk `app.js`, `profile.js`, `receipt.js`, dan `report.js`.
- Pemeriksaan struktur file paket dan HTML.

## Hal yang perlu diuji setelah upload
- Dashboard publik dan admin dengan data Supabase asli.
- Pergantian tahun pada statistik.
- Pencarian dan filter kategori pada halaman transaksi.
- Simpan transaksi dan penghapusan.
- Cetak laporan PDF, termasuk logo dan nomor telepon jika diisi.
- Hak akses publik/admin melalui kebijakan RLS Supabase.

Catatan: data transaksi tidak dimigrasikan atau diubah. Grafik memakai ringkasan transaksi yang disediakan backend. Paket sumber tidak menyertakan skrip SQL, sehingga skema Supabase tidak diubah.

## Pembaruan tampilan (November 2026)
- Font Inter dimuat dari Google Fonts; token desain (warna, radius, bayangan, ukuran huruf) ada di bagian "TAHAP 2" paling bawah `style.css`.
- Dashboard: kartu ringkasan dengan tren bulanan, grafik pemasukan/pengeluaran per bulan, daftar desa diurutkan (3 teratas + "Lihat semua").
- Tabel transaksi (admin): lencana kategori, nominal berwarna, header tetap, tampilan kartu di HP.
- Komponen baru: toast, dialog konfirmasi hapus, skeleton pemuatan, keadaan kosong, halaman login dua kolom.
- Perbaikan bug: kutipan di hero tidak lagi terkena gaya sidebar.
- `style (1).css` dihapus (tidak dipakai).

## Menu UPZ DESA (baru)
- Menu **UPZ DESA** (tampil untuk publik; pengelolaan hanya admin) dengan sub menu **Data UPZ Desa** (identitas: desa/kelurahan, kecamatan, kabupaten, ketua UPZ, no. Hp, kepala desa/lurah) dan **Perhimpunan** (data per UPZ DKM/RT/RW + pratinjau dan cetak **Form A1 Desa dan Kelurahan**).
- Berkas baru: `upzdesa.js`, `setup-upz-desa-supabase.sql` (jalankan sekali di Supabase SQL Editor). Perubahan kecil di `index.html`, `app.js`, `style.css`.
