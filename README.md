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

## Menu Perhimpunan

Halaman rekap pengumpulan zakat per UPZ desa/kelurahan, dengan filter tahun, baris jumlah otomatis, dan cetak (A4 landscape).

- Publik dapat melihat tabel. Hanya admin yang dapat menambah, mengubah, dan menghapus data.
- Jalankan `setup-perhimpunan-supabase.sql` sekali di Supabase SQL Editor untuk membuat tabel `perhimpunan` beserta kebijakan RLS-nya.
- Beras (kg) dihitung terpisah dan tidak masuk Jumlah Rp.
- Mode Admin Demo menyimpan data hanya selama halaman terbuka.

## Menu Pendistribusian

Sama seperti Perhimpunan (rekap per UPZ desa/kelurahan, filter tahun, baris jumlah otomatis, admin saja yang dapat mengubah), tetapi mencatat dana yang **didistribusikan** dan dicetak dengan **form B2 Kecamatan**.

- Jalankan `setup-pendistribusian-supabase.sql` sekali di Supabase SQL Editor untuk membuat tabel `pendistribusian` beserta kebijakan RLS-nya.
- Form cetak A2 (Perhimpunan) dan B2 (Pendistribusian) memakai kop logo BAZNAS (`logo-baznas.png`), nama Ketua UPZ dari menu Profil, dan nama Camat yang diisi manual sebelum cetak.

## Menu Rekap Laporan

Tabel rekap pengumpulan dan pendistribusian per jenis dana (Zakat Fitrah, BIS Ramadhan, Zakat Mal Ramadhan, Infak Umum, Fidyah) dan per tingkat (DKM/RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten). Berkas: `rekap.js`.

- **Total Pengumpulan** dijumlahkan otomatis dari menu Perhimpunan pada tahun yang dipilih.
- **Jumlah Rp.** = Total Pengumpulan × persentase, dibulatkan ke rupiah. Kolom putih dapat diubah (tersimpan di peramban), kolom abu-abu tidak berlaku.
- Persentase bawaan mengikuti format; kolom Kecamatan dan Kabupaten BIS Ramadhan dikosongkan agar diisi manual. Peringatan muncul jika total persentase satu jenis dana belum 100%.
- Cetak A4 landscape mengikuti form C2A Kecamatan: kop BAZNAS, Jumlah Muzaki (jiwa Perhimpunan) dan Jumlah Mustahik (jiwa Pendistribusian) otomatis, Ketua UPZ dari Profil, Camat diisi manual.

- **Persentase dikelola admin.** Jalankan `setup-rekap-persen-supabase.sql` sekali di Supabase SQL Editor. Persentase Form C2A dan C2B tersimpan di tabel `rekap_persen`; publik hanya melihat, hanya admin yang dapat mengubah.

## Menu Profil (pembaruan)

- Tambahan identitas: wilayah kerja, jam layanan, nomor WhatsApp (tombol "Hubungi via WhatsApp"), tautan peta (otomatis dari alamat bila kosong), visi dan misi, nomor SK, periode kepengurusan, dan rekening penyaluran zakat dengan tombol Salin. Data ini tersimpan di kolom `identitas` yang sudah ada, tanpa mengubah tabel.
- Susunan pengurus: jumlah baris bebas, dapat diurutkan (↑ ↓), dan dapat diisi jabatan **Camat**. Nama Camat otomatis terisi pada formulir cetak A2, B2, C2A, dan C2B (masih bisa diganti manual).
- **Nomor HP pengurus bersifat privat**: disimpan di tabel `profil_pengurus_privat` yang hanya dapat dibaca admin. Jalankan `setup-profil-lanjutan-supabase.sql` sekali di Supabase SQL Editor. Form C2A dan C2B memakai HP Ketua saat admin yang mencetak; untuk publik dipakai nomor telepon lembaga.
- Keterangan "Terakhir diperbarui" otomatis diisi setiap profil disimpan.

## Susunan Pengurus (struktur baru)
- Susunan pengurus kini dibagi menjadi **Penasehat** (Camat, Kepala KUA, Ketua MUI), **Pelaksana** (Ketua, Sekretaris, Bendahara UPZ), dan tiga **Bidang** (Pengumpulan; Pendistribusian dan Pendayagunaan; Administrasi dan Umum).
- Tiap entri menyimpan kolom tambahan `bagian` di dalam JSON `pengurus` yang sudah ada — tidak perlu mengubah tabel Supabase. Data lama tanpa `bagian` ditempatkan otomatis (Camat/KUA/MUI → Penasehat, selainnya → Pelaksana).
- Nama boleh dikosongkan; pencarian Ketua/Bendahara/Camat untuk formulir cetak tetap berjalan (Ketua MUI tidak akan tertukar dengan Ketua UPZ).

## Menu Surat

Menu **Surat** untuk mengetik dan mengelola surat resmi UPZ. Admin dapat menambah, mengubah, dan menghapus; publik hanya melihat dan mencetak. Berkas: `surat.js`.

- Jalankan `setup-surat-supabase.sql` sekali di Supabase SQL Editor untuk membuat tabel `surat` beserta kebijakan RLS-nya. Di dalam berkas tersedia pilihan kebijakan jika surat hanya boleh dibaca admin.
- **Nomor surat otomatis**: `no urut/UPZ.CPD/bulan/tahun`, contoh `003/UPZ.CPD/11/2026`. Nomor urut dihitung per bulan mengikuti tanggal surat, dan tidak dapat diketik manual.
- Jenis surat: Undangan, Permohonan, Pemberitahuan, Keterangan, Tugas, dan **Berita Acara** (format khusus: tanggal terbilang, Pihak Pertama/Kedua, saksi).
- Tanda tangan: dua penandatangan (surat biasa) dan **Mengetahui** opsional (Camat, Kepala KUA, atau Ketua MUI). Nama diambil dari Profil › Susunan Pengurus dan disimpan saat surat disimpan, sehingga surat lama tidak berubah bila pengurus berganti.
- Kop mengikuti Profil lembaga (logo, alamat, telepon, email). Cetak/PDF memakai kertas A4 potret.
