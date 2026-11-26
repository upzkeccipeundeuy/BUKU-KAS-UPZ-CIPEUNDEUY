# Paket: submenu mode HP menjadi halaman daftar

## Cara pasang
Timpa 4 file di folder proyek dengan file di folder `BUKU-KAS-UPZ-CIPEUNDEUY/`:
`app.js`, `surat.js`, `upzdesa.js`, `style.css`. Tidak ada file baru, tidak ada perubahan database.

## Perilaku (layar 900px ke bawah)
- Ketuk menu induk (Surat, BKU, UPZ DESA, UPZ KEC) di bar bawah: terbuka halaman daftar submenu.
- Ketuk satu baris: masuk ke halamannya. Tombol "< Surat" (atau BKU / UPZ DESA / UPZ KEC) di atas halaman kembali ke daftar.
- Tab submenu lama (BKU, UPZ KEC, UPZ DESA, Surat) disembunyikan di HP. Tab Form C2A/C2B di Rekap Laporan tetap ada.
- Desktop tidak berubah. Jika layar diperlebar saat daftar terbuka, aplikasi pindah ke submenu pertama.

## Perubahan per file
- app.js: data daftar menu (`menuLists`), halaman daftar (`menuListPage`), tombol kembali (`menuBack`), halaman semu `Menu:<kunci>`, klik menu induk di HP, penanda kelas `menu-tabs`, ikon surat.
- upzdesa.js: tab UPZ DESA diberi kelas `menu-tabs`.
- surat.js: tab dan kartu surat memakai `data-goto` (perbaikan klik sebelumnya).
- style.css: blok baru di akhir file.

## Mengubah isi daftar
Edit fungsi `menuLists()` di app.js. Tiap baris: [halaman, label, keterangan, kunci ikon].
