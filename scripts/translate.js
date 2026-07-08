const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
const appJsPath = path.join(__dirname, 'js', 'app.js');

let html = fs.readFileSync(indexHtmlPath, 'utf8');
let js = fs.readFileSync(appJsPath, 'utf8');

// index.html replacements
const htmlReplacements = [
    [/Kelola stok dengan mudah dan aman/g, "Atur stok barang lu jadi gampang & aman cuy"],
    [/>\s*MASUK\s*</g, "> GAS MASUK <"],
    [/>\s*DAFTAR\s*</g, "> BIKIN AKUN <"],
    [/>Username</g, ">Nama / ID Lu<"],
    [/>Password</g, ">Password Lu<"],
    [/>Lupa Password\?</g, ">Lupa Password Bang?<"],
    [/>Token Pendaftaran</g, ">Kode Rahasia (Token)<"],
    [/>Belum punya akun\?</g, ">Belum punya lapak?<"],
    [/Silakan hubungi administrator untuk mendapatkan token pendaftaran\./g, "Kalo belum punya token, minta ke admin dulu ya bro."],
    [/>\s*Daftar Sekarang\s*</g, "> Buat Akun Dulu <"],
    [/>\s*Dashboard\s*</g, "> Basecamp <"],
    [/>\s*Data Inventory\s*</g, "> Gudang Barang <"],
    [/>\s*Activity Log\s*</g, "> Rekam Jejak <"],
    [/>\s*Pengaturan\s*</g, "> Settingan <"],
    [/>\s*Keluar\s*</g, "> Cabut (Logout) <"],
    [/Hak Akses: /g, "Pangkat: "],
    [/>Total Item</g, ">Total Barang<"],
    [/>Stok Masuk</g, ">Barang Masuk<"],
    [/>Stok Keluar</g, ">Barang Keluar<"],
    [/placeholder="Cari item\.\.\."/g, 'placeholder="Nyari apa lu bro..."'],
    [/>\s*Tambah Item\s*</g, "> Nambah Barang <"],
    [/>\s*Export PDF\s*</g, "> Cetak PDF <"],
    [/>\s*Nama Item\s*</g, "> Nama Barang <"],
    [/>\s*Nama Barang\s*<\/th>/g, "> Nama Barang </th>"], // Wait, let's keep exact matches
    [/>Kategori</g, ">Jenis<"],
    [/>Stok</g, ">Sisa Stok<"],
    [/>Kondisi</g, ">Kondisi<"],
    [/>Aksi</g, ">Tindakan<"],
    [/>Operator</g, ">Siapa Nih<"],
    [/>Waktu</g, ">Jam<"],
    [/>Tanggal</g, ">Tanggal<"],
    [/>Detail</g, ">Infonya<"],
    [/>Objek \/ Target</g, ">Objek / Target<"],
    [/Hapus Log/g, "Bersihin Jejak"],
    [/Tambah Data Item/g, "Nambah Barang Baru"],
    [/Edit Data Item/g, "Ngubah Barang"],
    [/Pilih rentang waktu/g, "Pilih waktu"],
    [/Hari Ini/g, "Hari Ini Aja"],
    [/7 Hari Terakhir/g, "Seminggu Terakhir"],
    [/30 Hari Terakhir/g, "Sebulan Terakhir"],
    [/Semua Waktu/g, "Semuanya Dah"],
    [/Semua Aksi/g, "Semua Tindakan"],
    [/Batal/g, "Gak Jadi"],
    [/Simpan/g, "Simpen"],
    [/Batal/g, "Gak Jadi"],
    [/Konfirmasi/g, "Gaskeun"],
    [/Pilih Kolom yang akan di-export/g, "Pilih Kolom Buat Dicetak"],
    [/Unduh PDF/g, "Download PDF"],
    [/Konfirmasi Keluar/g, "Yakin Mau Cabut?"],
    [/Apakah Anda yakin ingin keluar dari sistem\?/g, "Beneran mau cabut nih bro?"],
    [/Tetap di Sini/g, "Kagak Jadi"],
    [/Ya, Keluar/g, "Yoi, Cabut!"]
];

htmlReplacements.forEach(([pattern, replacement]) => {
    html = html.replace(pattern, replacement);
});

// Fix any duplicated replacement like "> Nama Barang </th>"
// Also >Nama Item< inside labels.
html = html.replace(/>Nama Item</g, '>Nama Barang<');

// app.js replacements
const jsReplacements = [
    [/ActionBadge\s*=\s*'➕ Tambah Item'/g, "actionBadge = '➕ Nambah Barang'"],
    [/actionBadge\s*=\s*'📊 Edit Stok'/g, "actionBadge = '📊 Ngubah Stok'"],
    [/actionBadge\s*=\s*'🗑️ Hapus Item'/g, "actionBadge = '🗑️ Buang Barang'"],
    [/actionBadge\s*=\s*'🔑 Login System'/g, "actionBadge = '🔑 Masuk Sistem'"],
    [/actionBadge\s*=\s*'🚪 Logout System'/g, "actionBadge = '🚪 Cabut dari Sistem'"],
    [/actionBadge\s*=\s*'🧹 Hapus Log'/g, "actionBadge = '🧹 Bersihin Jejak'"],
    
    // sweet alerts
    [/Apakah Anda yakin ingin menghapus/g, "Yakin lu mau ngebuang"],
    [/Data tidak dapat dikembalikan!/g, "Kalo udah kehapus nggak bisa balik lagi lho!"],
    [/Ya, Hapus!/g, "Yoi, Buang Aja!"],
    [/Batal/g, "Gak Jadi Dah"],
    [/Item dihapus dari sistem/g, "Barangnya udah dibuang dari sistem"],
    
    // toasts
    [/Berhasil masuk ke sistem/g, "Mantap, lu berhasil masuk!"],
    [/Gagal masuk, periksa kembali username dan password./g, "Waduh gagal, coba cek lagi ID atau Password lu."],
    [/Token pendaftaran tidak valid/g, "Tokennya salah bro!"],
    [/Username sudah terdaftar/g, "ID lu udah ada yang pake nih."],
    [/Pendaftaran berhasil, silakan masuk/g, "Sip, akun lu udah jadi, langsung login aja."],
    [/Keluar dari sistem/g, "Cabut dari sistem."],
    [/Item baru ditambahkan dengan stok awal/g, "Barang baru udah masuk dengan stok awal"],
    [/berhasil ditambahkan/g, "sukses ditambahin bro"],
    [/berhasil diupdate/g, "sukses diupdate mantap"],
    [/Log aktivitas berhasil dibersihkan/g, "Rekam jejak udah bersih kinclong bro."],
    [/Berhasil menghapus/g, "Sukses ngebuang"],
    [/Stok awal tidak boleh kurang dari 0!/g, "Woy stok awal masa minus!"],
    [/Harap isi kolom ini!/g, "Isi dulu dong kolomnya!"],
    [/Gagal memuat data chart/g, "Duh gagal load chart nih"],
    [/Pilih Jenis Laporan/g, "Pilih Jenis Laporan"],
    [/Anda tidak memiliki izin/g, "Lu gak punya akses bro!"],
    [/Admin menghapus/g, "Admin ngebersihin"],
    [/keluar dari sistem/g, "cabut dari sistem"],
    [/berhasil masuk/g, "berhasil masuk ke markas"]
];

jsReplacements.forEach(([pattern, replacement]) => {
    js = js.replace(pattern, replacement);
});

// additional precise JS replacements for table headers
js = js.replace(/"Tanggal"/g, '"Tanggal"');
js = js.replace(/"Waktu"/g, '"Jam"');
js = js.replace(/"Operator"/g, '"Siapa Nih"');
js = js.replace(/"Aksi"/g, '"Tindakan"');
js = js.replace(/"Detail"/g, '"Infonya"');

fs.writeFileSync(indexHtmlPath, html);
fs.writeFileSync(appJsPath, js);
console.log('Translations applied successfully.');
