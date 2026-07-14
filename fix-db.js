const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
db.serialize(() => {
    db.run("ALTER TABLE borrowings ADD COLUMN dateReturn TEXT", (e) => {});
    db.run("ALTER TABLE borrowings ADD COLUMN reminderSent INTEGER DEFAULT 0", (e) => {});
    db.run("ALTER TABLE borrowings ADD COLUMN attachment TEXT", (e) => {});
    db.run("ALTER TABLE services ADD COLUMN sendDate TEXT", (e) => {});
    db.run("ALTER TABLE services ADD COLUMN reminderSent INTEGER DEFAULT 0", (e) => {});
    db.run("ALTER TABLE services ADD COLUMN attachment TEXT", (e) => {});
    db.run("ALTER TABLE services ADD COLUMN status TEXT DEFAULT 'in_progress'", (e) => {});
    db.run("SELECT 1", () => console.log('Migrations executed!'));
});
