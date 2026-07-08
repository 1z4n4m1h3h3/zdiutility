const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
    db.run("CREATE TABLE test (id TEXT, archived INTEGER DEFAULT 0)");
    
    // Insert a NUMBER
    db.run("INSERT INTO test (id) VALUES (?)", [12345]);
    
    // Update with a STRING
    db.run("UPDATE test SET archived = 1 WHERE id IN (?)", ['12345'], function(err) {
        if (err) console.error(err);
        console.log("Changes with string:", this.changes);
    });

    db.all("SELECT * FROM test", (err, rows) => console.log(rows));
});
