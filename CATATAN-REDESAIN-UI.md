# Paket Redesign UI — BKU UPZ Cipeundeuy

Paket ini berisi penyegaran tampilan antarmuka untuk aplikasi BKU UPZ Cipeundeuy.

## Isi perubahan
- Identitas visual hijau premium dengan aksen emas.
- Sidebar desktop lebih rapi dan tetap terlihat saat halaman digulir.
- Navigasi HP lebih nyaman digeser dan tetap berada di bagian atas.
- Dashboard, kartu ringkasan, panel, tabel, formulir, dan dialog diberi konsistensi visual.
- Perbaikan responsif untuk layar kecil, termasuk kartu ringkasan dua kolom.
- Fokus keyboard lebih terlihat dan dukungan preferensi reduced motion.
- Metadata judul, deskripsi, dan warna tema browser diperbarui.

## Cara memasang
1. Unduh dan ekstrak ZIP.
2. Cadangkan folder aplikasi lama terlebih dahulu.
3. Ganti file `style.css` dan `index.html` di repositori/hosting dengan versi dari paket ini.
4. Jangan mengganti `app.js`, `profile.js`, `receipt.js`, `report.js`, atau konfigurasi Supabase.
5. Commit/push perubahan, lalu muat ulang aplikasi. Jika tampilan lama masih muncul, lakukan hard refresh atau bersihkan cache browser.

## Catatan penting
- Perubahan ini hanya pada lapisan UI/presentasi.
- Tidak mengubah tabel, data transaksi, autentikasi, kebijakan akses, atau konfigurasi Supabase.
- Fitur yang sudah ada tetap mengikuti kode aplikasi saat ini.
