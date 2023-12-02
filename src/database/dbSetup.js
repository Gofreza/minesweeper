// dbSetup.js

const sqlite3 = require('sqlite3').verbose();

let dbInstance = null;

/**
 * Set up the database
 * @returns {Promise<Database>} A promise that resolves with the database instance
 */
function setupDatabase() {
    if (dbInstance) {
        // If the database instance is already set up, return it
        return Promise.resolve(dbInstance);
    }

    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database('./src/database/database.db');
        //console.log("Database created");

        // Create the user table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS roomData (
            roomName TEXT NOT NULL PRIMARY KEY,
            numRows INTEGER NOT NULL,
            numCols INTEGER NOT NULL
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS users (
            roomName TEXT NOT NULL,
            username TEXT NOT NULL,
            score INTEGER NOT NULL,
            PRIMARY KEY (roomName, username)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL
        )`, function (err) {
            if (err) {
                console.error("Error creating tables:", err.message);
                reject(err);
            } else {
                dbInstance = db;
                resolve(db);
            }
        });

        // Check if the admin already exists
        db.get(`SELECT * FROM admin WHERE username = ?`, ['admin'], (selectErr, row) => {
            if (selectErr) {
                console.error("Error checking if admin exists:", selectErr.message);
            } else {
                // If the admin does not exist, insert it
                if (!row) {
                    db.run(`INSERT INTO admin (username, password) VALUES (?, ?)`, ['admin', 'admin'], (insertErr) => {
                        if (insertErr) {
                            console.error("Error inserting default admin:", insertErr.message);
                        } else {
                            console.log("Default admin inserted");
                        }
                    });
                } else {
                    // Admin already exists, no need to insert
                    console.log("Default admin already exists");
                }
            }
        });

    });
}

module.exports = setupDatabase;
