const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
db.serialize(() => {
    db.run("ALTER TABLE borrowings ADD COLUMN dateReturn TEXT", (e) => { if(e) console.error('Error borrowings dateReturn:', e.message) });
    db.run("ALTER TABLE services ADD COLUMN status TEXT DEFAULT 'in_progress'", (e) => { if(e) console.error('Error services status:', e.message) });
    db.run("SELECT 1", () => console.log('Checked!'));
});
