const fs = require('fs');
const path = require('path');
const appJsPath = path.join(__dirname, 'js', 'app.js');

let js = fs.readFileSync(appJsPath, 'utf8');

const jsReplacements = [
    [/actionBadge\s*=\s*'➕ Tambah Item'/g, "actionBadge = '➕ Nambah Barang'"],
    [/actionBadge\s*=\s*'📊 Edit Stok'/g, "actionBadge = '📊 Ngubah Stok'"],
    [/actionBadge\s*=\s*'🗑️ Hapus Item'/g, "actionBadge = '🗑️ Buang Barang'"],
    [/actionBadge\s*=\s*'🔑 Login System'/g, "actionBadge = '🔑 Masuk Sistem'"],
    [/actionBadge\s*=\s*'🚪 Logout System'/g, "actionBadge = '🚪 Cabut dari Sistem'"],
    [/actionBadge\s*=\s*'🧹 Hapus Log'/g, "actionBadge = '🧹 Bersihin Jejak'"],
];

jsReplacements.forEach(([pattern, replacement]) => {
    js = js.replace(pattern, replacement);
});

fs.writeFileSync(appJsPath, js);
console.log('Fixed app.js badges.');
