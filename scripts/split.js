const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../js/app.js');
const outDir = path.join(__dirname, '../js/modules');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const content = fs.readFileSync(inputFile, 'utf-8');

// Regex to find section headers
const regex = /\/\/ ={10,}\r?\n\/\/ (.*?)\r?\n\/\/ ={10,}/g;

let match;
let sections = [];
while ((match = regex.exec(content)) !== null) {
    sections.push({
        name: match[1].trim(),
        index: match.index,
        headerText: match[0]
    });
}

const getFileName = (idx, name) => {
    let base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    // Provide some manual overrides for cleaner names based on the plan
    if (base.includes('database')) base = 'api';
    if (base.includes('activity')) base = 'activity-log';
    if (base.includes('toast')) base = 'toast';
    if (base.includes('modal') || base.includes('confirm')) base = 'modal';
    if (base.includes('authentication')) base = 'auth';
    if (base.includes('admin') || base.includes('pin')) base = 'user-management';
    if (base.includes('dashboard')) base = 'dashboard';
    if (base.includes('chart')) base = 'charts';
    if (base.includes('maintenance') || base.includes('services')) base = 'maintenance';
    if (base.includes('excel')) base = 'excel';
    if (base.includes('viewer') || base.includes('scanner')) base = 'barcode';
    if (base.includes('settings') || base.includes('telegram')) base = 'settings';
    if (base.includes('navigation') || base.includes('tab')) base = 'navigation';
    if (base.includes('sync')) base = 'sync';
    if (base.includes('pwa')) base = 'pwa';
    if (base.includes('device') || base.includes('location')) base = 'tracking';
    if (base.includes('export') || base.includes('backup')) base = 'backup';
    if (base.includes('peminjaman')) base = 'borrowing';
    if (base.includes('riwayat')) base = 'item-history';
    if (base.includes('mass')) base = 'barcode-printing';
    
    return `${String(idx).padStart(2, '0')}-${base}.js`;
};

let htmlTags = '';

for (let i = 0; i < sections.length; i++) {
    const start = sections[i].index;
    const end = i < sections.length - 1 ? sections[i+1].index : content.length;
    
    const chunk = content.substring(start, end).trim();
    const fileName = getFileName(i + 1, sections[i].name);
    
    fs.writeFileSync(path.join(outDir, fileName), chunk + '\n\n', 'utf-8');
    
    htmlTags += `    <script src="js/modules/${fileName}"></script>\n`;
    console.log(`Created ${fileName}`);
}

console.log('\nHTML TAGS TO INJECT:');
console.log(htmlTags);
