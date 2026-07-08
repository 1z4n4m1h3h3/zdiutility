const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT * FROM activity_log", (err, rows) => {
    if (err) console.error(err);
    console.log("Total logs:", rows ? rows.length : 0);
    if (rows && rows.length > 0) {
        console.log("First log:", rows[0]);
        console.log("Archived count:", rows.filter(r => r.archived === 1).length);
        console.log("Non-archived count:", rows.filter(r => r.archived !== 1).length);
    }
});
