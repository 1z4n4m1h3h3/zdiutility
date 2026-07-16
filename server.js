require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'zdi-stock-utility-super-secret-key';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run('PRAGMA journal_mode = WAL;');
        initDB();
    }
});

function initDB() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT,
            password TEXT,
            pin TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY,
            name TEXT,
            category TEXT,
            qty INTEGER,
            condition TEXT DEFAULT 'Normal',
            ip TEXT,
            department TEXT,
            vendor TEXT
        )`);

        // Migration to add new columns if they don't exist (ignores error if already exists)
        db.run(`ALTER TABLE inventory ADD COLUMN ip TEXT`, () => { });
        db.run(`ALTER TABLE inventory ADD COLUMN department TEXT`, () => { });
        db.run(`ALTER TABLE inventory ADD COLUMN vendor TEXT`, () => { });

        db.run(`CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            itemId TEXT,
            itemName TEXT,
            location TEXT,
            estCost INTEGER,
            completionDate TEXT,
            createdAt INTEGER
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS activity_log (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            date TEXT,
            time TEXT,
            action TEXT,
            itemName TEXT,
            details TEXT,
            user TEXT,
            createdAt INTEGER
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        db.run(`ALTER TABLE inventory ADD COLUMN condition TEXT DEFAULT 'Normal'`, (err) => {
            // Ignore error if column already exists
        });

        db.run(`ALTER TABLE activity_log ADD COLUMN archived INTEGER DEFAULT 0`, (err) => {
            // Ignore error if column already exists
        });

        db.run(`CREATE TABLE IF NOT EXISTS auth_codes (
            id TEXT PRIMARY KEY,
            code TEXT,
            createdAt INTEGER,
            date TEXT,
            time TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS borrowings (
            id TEXT PRIMARY KEY,
            itemId TEXT,
            itemName TEXT,
            borrower TEXT,
            dateBorrowed TEXT,
            createdAt INTEGER
        )`);

        // Migration for advanced features
        db.run(`ALTER TABLE borrowings ADD COLUMN dateReturn TEXT`, () => {});
        db.run(`ALTER TABLE borrowings ADD COLUMN reminderSent INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE borrowings ADD COLUMN attachment TEXT`, () => {});
        db.run(`ALTER TABLE borrowings ADD COLUMN location TEXT`, () => {});
        
        db.run(`ALTER TABLE services ADD COLUMN sendDate TEXT`, () => {});
        db.run(`ALTER TABLE services ADD COLUMN reminderSent INTEGER DEFAULT 0`, () => {});
        db.run(`ALTER TABLE services ADD COLUMN attachment TEXT`, () => {});
        db.run(`ALTER TABLE services ADD COLUMN status TEXT DEFAULT 'in_progress'`, () => {});

        db.run(`CREATE TABLE IF NOT EXISTS vendors (
            id TEXT PRIMARY KEY,
            name TEXT,
            contact TEXT,
            address TEXT,
            createdAt INTEGER
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS locations (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            createdAt INTEGER
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS printer_logs (
            id TEXT PRIMARY KEY,
            printerId TEXT,
            printerName TEXT,
            damageDate TEXT,
            description TEXT,
            reportedBy TEXT,
            status TEXT,
            createdAt INTEGER
        )`);

        // Migrate unique vendors from inventory
        db.all("SELECT DISTINCT vendor FROM inventory WHERE vendor IS NOT NULL AND vendor != ''", [], (err, rows) => {
            if (rows) {
                rows.forEach(row => {
                    db.get("SELECT id FROM vendors WHERE name = ?", [row.vendor], (err, vRow) => {
                        if (!vRow) {
                            db.run("INSERT INTO vendors (id, name, createdAt) VALUES (?, ?, ?)", [Date.now().toString() + Math.random().toString(36).substring(2, 5), row.vendor, Date.now()]);
                        }
                    });
                });
            }
        });

        // Migrate unique locations from inventory (department)
        db.all("SELECT DISTINCT department FROM inventory WHERE department IS NOT NULL AND department != ''", [], (err, rows) => {
            if (rows) {
                rows.forEach(row => {
                    db.get("SELECT id FROM locations WHERE name = ?", [row.department], (err, lRow) => {
                        if (!lRow) {
                            db.run("INSERT INTO locations (id, name, createdAt) VALUES (?, ?, ?)", [Date.now().toString() + Math.random().toString(36).substring(2, 5), row.department, Date.now()]);
                        }
                    });
                });
            }
        });

        // Migrate data from db.json if database is empty
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (row && row.count === 0 && fs.existsSync('./db.json')) {
                console.log('Migrating data from db.json...');
                const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

                if (data.users) {
                    const stmt = db.prepare('INSERT INTO users (id, username, password, pin) VALUES (?, ?, ?, ?)');
                    data.users.forEach(u => stmt.run(u.id || Date.now().toString() + Math.random().toString(36).substr(2, 5), u.username, u.password, u.pin));
                    stmt.finalize();
                }

                if (data.inventory) {
                    const stmt = db.prepare('INSERT INTO inventory (id, name, category, qty, condition) VALUES (?, ?, ?, ?, ?)');
                    data.inventory.forEach(i => stmt.run(i.id || Date.now().toString() + Math.random().toString(36).substr(2, 5), i.name, i.category, i.qty, i.condition || 'Normal'));
                    stmt.finalize();
                }

                if (data.activity_log) {
                    const stmt = db.prepare('INSERT INTO activity_log (id, timestamp, date, time, action, itemName, details, user, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                    data.activity_log.forEach(a => stmt.run(a.id?.toString() || Date.now().toString() + Math.random().toString(36).substr(2, 5), a.timestamp, a.date, a.time, a.action, a.itemName, a.details, a.user, a.createdAt));
                    stmt.finalize();
                }

                if (data.auth_codes) {
                    const stmt = db.prepare('INSERT INTO auth_codes (id, code, createdAt, date, time) VALUES (?, ?, ?, ?, ?)');
                    data.auth_codes.forEach(c => stmt.run(c.id || Date.now().toString() + Math.random().toString(36).substr(2, 5), c.code, c.createdAt, c.date, c.time));
                    stmt.finalize();
                }

                // borrowings
                if (data.borrowings && Array.isArray(data.borrowings)) {
                    const stmt = db.prepare('INSERT OR REPLACE INTO borrowings (id, itemId, itemName, borrower, dateBorrowed, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
                    data.borrowings.forEach(b => stmt.run(b.id, b.itemId, b.itemName, b.borrower, b.dateBorrowed, b.createdAt));
                    stmt.finalize();
                }

                console.log('Migration completed.');
            }
        });
        
        // Security Migration: Hash plain text passwords
        db.all('SELECT id, password FROM users', [], (err, rows) => {
            if (!err && rows) {
                rows.forEach(row => {
                    if (row.password && !row.password.startsWith('$2a$') && !row.password.startsWith('$2b$')) {
                        const hashed = bcrypt.hashSync(row.password, 10);
                        db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, row.id]);
                    }
                });
            }
        });

        // FORCE RESET PASSWORDS ON STARTUP (to fix VPS login issues)
        const hashedAdmin = bcrypt.hashSync('Aezakmi!.1', 10);
        const hashedUsers = bcrypt.hashSync('12345678', 10);
        
        // Ensure admin exists
        db.get('SELECT id FROM users WHERE username = ? COLLATE NOCASE', ['admin'], (err, row) => {
            if (!row) {
                db.run('INSERT INTO users (id, username, password, pin) VALUES (?, ?, ?, ?)', [Date.now().toString() + Math.random().toString(36).substr(2, 5), 'admin', hashedAdmin, '123456']);
            } else {
                db.run('UPDATE users SET password = ? WHERE username = ? COLLATE NOCASE', [hashedAdmin, 'admin']);
            }
        });
        
        db.run('UPDATE users SET password = ? WHERE username != ? COLLATE NOCASE', [hashedUsers, 'admin']);
        console.log("Passwords have been reset automatically for all users. Admin password is now Aezakmi!.1");
    });
}

const tables = ['users', 'inventory', 'activity_log', 'auth_codes', 'services', 'borrowings', 'vendors', 'locations', 'printer_logs'];

// Middleware untuk proteksi JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token.' });
        req.user = user;
        next();
    });
}


// Backup endpoint
app.get('/api/backup', authenticateToken, (req, res) => {
    const file = __dirname + '/database.sqlite';
    res.download(file, `ZDI_Stock_Backup_${Date.now()}.sqlite`, (err) => {
        if (err) {
            console.error('Error downloading backup:', err);
            // Ignore headers sent error
        }
    });
});

// SETTINGS Endpoints
app.get('/api/settings', authenticateToken, (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    });
});

app.post('/api/settings', authenticateToken, (req, res) => {
    const keys = Object.keys(req.body);
    if (keys.length === 0) return res.json({ success: true });

    let completed = 0;
    let hasError = false;

    keys.forEach(key => {
        const val = req.body[key];
        db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, val], (err) => {
            if (err) hasError = true;
            completed++;
            if (completed === keys.length) {
                if (hasError) res.status(500).json({ error: 'Some settings failed to save' });
                else res.json({ success: true });
            }
        });
    });
});

// NOTIFY Endpoint (Telegram)
app.post('/api/notify', authenticateToken, (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    db.all("SELECT * FROM settings WHERE key IN ('telegramBotToken', 'telegramChatId')", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let token = '';
        let chatId = '';
        rows.forEach(r => {
            if (r.key === 'telegramBotToken') token = r.value;
            if (r.key === 'telegramChatId') chatId = r.value;
        });

        if (!token || !chatId) {
            return res.status(400).json({ error: 'Telegram Token or Chat ID not configured.' });
        }

        const data = JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const telegramReq = https.request(options, (telegramRes) => {
            let body = '';
            telegramRes.on('data', d => body += d);
            telegramRes.on('end', () => {
                if (telegramRes.statusCode >= 200 && telegramRes.statusCode < 300) {
                    res.json({ success: true, response: JSON.parse(body) });
                } else {
                    res.status(telegramRes.statusCode).json({ error: 'Telegram API Error', details: body });
                }
            });
        });

        telegramReq.on('error', (e) => {
            res.status(500).json({ error: 'Request to Telegram failed', details: e.message });
        });

        telegramReq.write(data);
        telegramReq.end();
    });
});

// Auth endpoints
app.post('/api/login', (req, res) => {
    const { username, password, pin } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    
    db.get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });
        
        // Phase 1: Check password
        if (password) {
            const match = await bcrypt.compare(password, row.password);
            if (match) {
                // Admin bypasses pin, normal user needs pin
                const requirePin = row.username.toLowerCase() !== 'admin';
                if (!requirePin) {
                    const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, { expiresIn: '24h' });
                    // Remove password and pin before sending user object
                    const { password: _p, pin: _pin, ...safeUser } = row;
                    return res.json({ success: true, requirePin: false, user: safeUser, token });
                } else {
                    const { password: _p, pin: _pin, ...safeUser } = row;
                    return res.json({ success: true, requirePin: true, user: safeUser });
                }
            } else {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }
        
        // Phase 2: Check pin
        if (pin) {
            if (row.pin === pin) {
                const token = jwt.sign({ id: row.id, username: row.username }, JWT_SECRET, { expiresIn: '24h' });
                const { password: _p, pin: _pin, ...safeUser } = row;
                return res.json({ success: true, user: safeUser, token });
            } else {
                return res.status(401).json({ error: 'Invalid PIN' });
            }
        }
        
        res.status(400).json({ error: 'Password or PIN required' });
    });
});

app.post('/api/register', async (req, res) => {
    const { username, password, pin } = req.body;
    if (!username || !password || !pin) return res.status(400).json({ error: 'All fields required' });
    
    db.get('SELECT id FROM users WHERE username = ? COLLATE NOCASE', [username], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'Username already exists' });
        
        const hashedPass = await bcrypt.hash(password, 10);
        const id = Date.now().toString();
        
        db.run('INSERT INTO users (id, username, password, pin) VALUES (?, ?, ?, ?)', [id, username, hashedPass, pin], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ success: true, id, username });
        });
    });
});


app.post('/api/change-password', authenticateToken, (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    db.get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });
        
        const match = await bcrypt.compare(oldPassword, row.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });
        
        const hashedPass = await bcrypt.hash(newPassword, 10);
        
        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPass, row.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// GET endpoints
app.get('/:storeName', authenticateToken, (req, res) => {
    const { storeName } = req.params;
    if (!tables.includes(storeName)) return res.status(404).json({ error: 'Not found' });

    let query = `SELECT * FROM ${storeName}`;
    const params = [];
    const filters = Object.keys(req.query).filter(k => k !== '_t');

    let conditions = [];
    if (storeName === 'activity_log') {
        conditions.push(`(archived IS NULL OR archived = 0)`);
    }

    if (filters.length > 0) {
        filters.forEach(k => {
            // Prevent SQL Injection: only allow alphanumeric and underscore column names
            if (/^[a-zA-Z0-9_]+$/.test(k)) {
                conditions.push(`${k} = ?`);
                params.push(req.query[k]);
            }
        });
    }

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        if (storeName === 'users' && rows) {
            rows = rows.map(r => {
                const { password, pin, ...rest } = r;
                return rest;
            });
        }
        res.json(rows || []);
    });
});

// POST endpoint
app.post('/:storeName', authenticateToken, async (req, res) => {
    const { storeName } = req.params;
    if (!tables.includes(storeName)) return res.status(404).json({ error: 'Not found' });

    let body = { ...req.body };

    if (!body.id) {
        body.id = crypto.randomUUID ? Date.now().toString() + Math.random().toString(36).substr(2, 5) : Date.now().toString();
    } else {
        body.id = body.id.toString(); // Ensure ID is a string for the TEXT column
    }

    if (storeName === 'users' && body.password) {
        // Hanya hash jika belum berbentuk hash bcrypt
        if (!body.password.startsWith('$2') || body.password.length !== 60) {
            body.password = await bcrypt.hash(body.password, 10);
        }
    }

    const keys = Object.keys(body);
    const values = Object.values(body);
    const placeholders = keys.map(() => '?').join(', ');

    const query = `INSERT INTO ${storeName} (${keys.join(', ')}) VALUES (${placeholders})`;

    db.run(query, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(body);
    });
});

// PUT endpoint
app.put('/:storeName/:id', authenticateToken, async (req, res) => {
    const { storeName, id } = req.params;
    if (!tables.includes(storeName)) return res.status(404).json({ error: 'Not found' });

    let body = { ...req.body };

    if (storeName === 'users' && body.password) {
        // Hanya hash jika belum berbentuk hash bcrypt
        if (!body.password.startsWith('$2') || body.password.length !== 60) {
            body.password = await bcrypt.hash(body.password, 10);
        }
    }

    const keys = Object.keys(body).filter(k => k !== 'id');
    const values = keys.map(k => body[k]);
    const setClause = keys.map(k => `${k} = ?`).join(', ');

    values.push(id.toString());

    if (keys.length === 0) {
        return res.json(body);
    }

    const query = `UPDATE ${storeName} SET ${setClause} WHERE id = ?`;

    db.run(query, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json(body);
    });
});

// BULK DELETE endpoint
app.post('/api/bulk_delete/:storeName', authenticateToken, (req, res) => {
    const { storeName } = req.params;
    if (!tables.includes(storeName)) return res.status(404).json({ error: 'Not found' });

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Valid ids array required' });
    }

    const stringIds = ids.map(String);
    console.log(`Received bulk_delete for ${storeName} with ${stringIds.length} ids. First id: ${stringIds[0]}`);
    const placeholders = stringIds.map(() => '?').join(',');

    const query = storeName === 'activity_log'
        ? `UPDATE ${storeName} SET archived = 1 WHERE id IN (${placeholders})`
        : `DELETE FROM ${storeName} WHERE id IN (${placeholders})`;

    db.run(query, stringIds, function (err) {
        if (err) {
            console.error('Bulk delete error:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`Successfully archived/deleted ${this.changes} logs`);
        res.json({ deletedCount: this.changes });
    });
});

// DELETE endpoint
app.delete('/:storeName/:id', authenticateToken, (req, res) => {
    const { storeName, id } = req.params;
    if (!tables.includes(storeName)) return res.status(404).json({ error: 'Not found' });

    db.run(`DELETE FROM ${storeName} WHERE id = ?`, [id.toString()], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({});
    });
});

// File upload endpoint
app.post('/api/upload', authenticateToken, upload.single('attachment'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the URL for the uploaded file
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

// Auto-Reminder Cron Job (Runs every 1 hour)
setInterval(() => {
    db.get("SELECT value FROM settings WHERE key = 'telegramBotToken'", [], (err, tokenRow) => {
        if (!tokenRow) return;
        db.get("SELECT value FROM settings WHERE key = 'telegramChatId'", [], (err, chatRow) => {
            if (!chatRow) return;
            const token = tokenRow.value;
            const chatId = chatRow.value;

            // Check overdue borrowings
            const today = new Date().toISOString().split('T')[0];
            db.all("SELECT * FROM borrowings WHERE dateReturn < ? AND reminderSent = 0", [today], (err, rows) => {
                if (rows && rows.length > 0) {
                    rows.forEach(b => {
                        const msg = `⚠️ *PENGINGAT PEMINJAMAN*\n\nBarang: *${b.itemName}*\nPeminjam: *${b.borrower}*\nBatas Kembali: *${b.dateReturn}*\n\nStatus: *OVERDUE / TELAT*`;
                        sendTelegramDirect(token, chatId, msg);
                        db.run("UPDATE borrowings SET reminderSent = 1 WHERE id = ?", [b.id]);
                    });
                }
            });

            // Check nearing completion services (due today or overdue)
            db.all("SELECT * FROM services WHERE completionDate <= ? AND status = 'in_progress' AND reminderSent = 0", [today], (err, rows) => {
                if (rows && rows.length > 0) {
                    rows.forEach(s => {
                        const msg = `🔧 *PENGINGAT SERVIS*\n\nBarang: *${s.itemName}*\nLokasi: *${s.location}*\nEstimasi Selesai: *${s.completionDate}*\n\nStatus: *CEK SEKARANG*`;
                        sendTelegramDirect(token, chatId, msg);
                        db.run("UPDATE services SET reminderSent = 1 WHERE id = ?", [s.id]);
                    });
                }
            });
        });
    });
}, 3600000); // 1 hour

function sendTelegramDirect(token, chatId, message) {
    const data = JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' });
    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = https.request(options, () => {});
    req.on('error', () => {});
    req.write(data);
    req.end();
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// Setup HTTPS for mobile camera access
if (fs.existsSync('./key.pem') && fs.existsSync('./cert.pem')) {
    const httpsOptions = {
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem')
    };
    https.createServer(httpsOptions, app).listen(3443, '0.0.0.0', () => {
        console.log(`HTTPS server running on https://0.0.0.0:3443 (Gunakan ini untuk akses Scanner di HP)`);
    });
}
