require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
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

        // Migrate data from db.json if database is empty
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (row && row.count === 0 && fs.existsSync('./db.json')) {
                console.log('Migrating data from db.json...');
                const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));

                if (data.users) {
                    const stmt = db.prepare('INSERT INTO users (id, username, password, pin) VALUES (?, ?, ?, ?)');
                    data.users.forEach(u => stmt.run(u.id || crypto.randomUUID(), u.username, u.password, u.pin));
                    stmt.finalize();
                }

                if (data.inventory) {
                    const stmt = db.prepare('INSERT INTO inventory (id, name, category, qty, condition) VALUES (?, ?, ?, ?, ?)');
                    data.inventory.forEach(i => stmt.run(i.id || crypto.randomUUID(), i.name, i.category, i.qty, i.condition || 'Normal'));
                    stmt.finalize();
                }

                if (data.activity_log) {
                    const stmt = db.prepare('INSERT INTO activity_log (id, timestamp, date, time, action, itemName, details, user, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                    data.activity_log.forEach(a => stmt.run(a.id?.toString() || crypto.randomUUID(), a.timestamp, a.date, a.time, a.action, a.itemName, a.details, a.user, a.createdAt));
                    stmt.finalize();
                }

                if (data.auth_codes) {
                    const stmt = db.prepare('INSERT INTO auth_codes (id, code, createdAt, date, time) VALUES (?, ?, ?, ?, ?)');
                    data.auth_codes.forEach(c => stmt.run(c.id || crypto.randomUUID(), c.code, c.createdAt, c.date, c.time));
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
    });
}

const tables = ['users', 'inventory', 'activity_log', 'auth_codes', 'services', 'borrowings'];

// Backup endpoint
app.get('/api/backup', (req, res) => {
    const file = __dirname + '/database.sqlite';
    res.download(file, `ZDI_Stock_Backup_${Date.now()}.sqlite`, (err) => {
        if (err) {
            console.error('Error downloading backup:', err);
            // Ignore headers sent error
        }
    });
});

// SETTINGS Endpoints
app.get('/api/settings', (req, res) => {
    db.all('SELECT * FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    });
});

app.post('/api/settings', (req, res) => {
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
app.post('/api/notify', (req, res) => {
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
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });
        
        // Phase 1: Check password
        if (password) {
            if (row.password === password) {
                // If it's admin, they might not need pin in the original logic, but let's return success for phase 1
                return res.json({ success: true, requirePin: row.username.toLowerCase() !== 'admin', user: row });
            } else {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }
        
        // Phase 2: Check pin
        if (pin) {
            if (row.pin === pin) {
                return res.json({ success: true, user: row });
            } else {
                return res.status(401).json({ error: 'Invalid PIN' });
            }
        }
        
        res.status(400).json({ error: 'Password or PIN required' });
    });
});

app.post('/api/change-password', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row || row.password !== oldPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        db.run('UPDATE users SET password = ? WHERE id = ?', [newPassword, row.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// GET endpoints
app.get('/:storeName', (req, res) => {
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
app.post('/:storeName', (req, res) => {
    const { storeName } = req.params;
    if (!tables.includes(storeName)) return res.status(404).json({ error: 'Not found' });

    if (!req.body.id) {
        req.body.id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    } else {
        req.body.id = req.body.id.toString(); // Ensure ID is a string for the TEXT column
    }

    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    const placeholders = keys.map(() => '?').join(', ');

    const query = `INSERT INTO ${storeName} (${keys.join(', ')}) VALUES (${placeholders})`;

    db.run(query, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(req.body);
    });
});

// PUT endpoint
app.put('/:storeName/:id', (req, res) => {
    const { storeName, id } = req.params;
    if (!tables.includes(storeName)) return res.status(404).json({ error: 'Not found' });

    const keys = Object.keys(req.body).filter(k => k !== 'id');
    const values = keys.map(k => req.body[k]);
    const setClause = keys.map(k => `${k} = ?`).join(', ');

    values.push(id.toString());

    if (keys.length === 0) {
        return res.json(req.body);
    }

    const query = `UPDATE ${storeName} SET ${setClause} WHERE id = ?`;

    db.run(query, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json(req.body);
    });
});

// BULK DELETE endpoint
app.post('/api/bulk_delete/:storeName', (req, res) => {
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
app.delete('/:storeName/:id', (req, res) => {
    const { storeName, id } = req.params;
    if (!tables.includes(storeName)) return res.status(404).json({ error: 'Not found' });

    db.run(`DELETE FROM ${storeName} WHERE id = ?`, [id.toString()], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({});
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express SQLite server running on http://0.0.0.0:${PORT}`);
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
