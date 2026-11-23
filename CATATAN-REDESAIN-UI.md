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
