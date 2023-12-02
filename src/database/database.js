const sqlite3 = require('sqlite3').verbose();

function setupDatabase() {
    const db = new sqlite3.Database('./database.db');

    /*
        CREATE TABLES
     */

    // Create the user table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS roomData (
    roomName TEXT PRIMARY KEY,
    numRows INTEGER NOT NULL,
    numCols INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
    roomName TEXT,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    PRIMARY KEY (roomName, username)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL
    )`);

    /*
        Fill Database with default admin
     */

    db.run(`INSERT INTO admin (username, password) VALUES (?, ?)`, ['admin', 'admin'], (err) => {
        if (err) {
            console.error("Error insert default admin:", err.message);
        }
        console.log("Default admin inserted");
    });

    /*
        roomData FUNCTIONS
     */

    async function getRoomData(roomName) {
        const sql = `SELECT numRows, numCols FROM roomData WHERE roomName = ?`;

        return new Promise((resolve, reject) => {
            db.get(sql, [roomName], (err, price) => {
                if (err) {
                    console.error("Error getRoomData:", err.message);
                    reject(err);
                } else {
                    resolve(price);
                }
            });
        });
    }

    async function getResultsFromRoomName(roomName) {
        const sql = `SELECT * FROM users WHERE roomName = ?`;

        return new Promise((resolve, reject) => {
            db.get(sql, [roomName], (err, price) => {
                if (err) {
                    console.error("Error getResultsFromRoomName:", err.message);
                    reject(err);
                } else {
                    resolve(price);
                }
            });
        });
    }

    async function setRoomData(roomName, rows, cols) {
        const sql = `INSERT INTO roomData (roomName, numRows, numCols) VALUES (?, ?, ?)`;

        db.run(sql, [roomName, rows, cols], (err) => {
            if (err) {
                console.error("Error setRoomData:", err.message);
            }
        });
    }

    async function deleteRoomData(roomName) {
        const sql = `DELETE FROM roomData WHERE roomName = ?`;

        return new Promise((resolve, reject) => {
            db.run(sql, [roomName], function (err) {
                if (err) {
                    console.error("Error deleteRoomData:", err.message);
                    reject(err);
                } else {
                    //console.log(`Row(s) deleted: ${this.changes}`);
                    resolve(this.changes);
                }
            });
        });
    }

    async function addUserScore(roomName, username, score) {
        const sql = `INSERT INTO users (roomName, username, score) VALUES (?, ?, ?)`;

        db.run(sql, [roomName, username, score], (err) => {
            if (err) {
                console.error("Error addUserScore:", err.message);
            }
        });
    }

    async function deleteUserScore(roomName, username) {
        const sql = `DELETE FROM users WHERE roomName = ? AND username = ?`;

        db.run(sql, [roomName, username], function (err) {
            if (err) {
                console.error("Error deleteUserScore:", err.message);
            }
        });
    }

    async function checkIfRoomExists(roomName) {
        const sql = `SELECT * FROM roomData WHERE roomName = ?`;

        return new Promise((resolve, reject) => {
            db.get(sql, [roomName], (err, row) => {
                if (err) {
                    console.error("Error checkIfRoomExists:", err.message);
                    reject(err);
                } else {
                    resolve(row !== undefined);
                }
            });
        });
    }

    async function checkResults(roomName, playerNumber) {
        const sql = `SELECT COUNT(*) FROM users WHERE roomName = ?`;
        return new Promise((resolve, reject) => {
            db.get(sql, [roomName], (err, row) => {
                if (err) {
                    console.error("Error checkResults:", err.message);
                    reject(err);
                } else {
                    //console.log("row", row['COUNT(*)'], "playerNumber", playerNumber)
                    resolve(row['COUNT(*)'] === playerNumber);
                }
            });
        });
    }

    async function getHighestScoreFromRoomName(roomName) {
        const sql = `SELECT username, score FROM users WHERE roomName = ? ORDER BY score ASC LIMIT 1`;

        return new Promise((resolve, reject) => {
            db.get(sql, [roomName], (err, result) => {
                if (err) {
                    console.error("Error getHighestScoreFromRoomName:", err.message);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    // Method to delete inexistent rooms from the database



    return {
        //roomData
        getRoomData, setRoomData, deleteRoomData, checkResults, addUserScore, deleteUserScore, checkIfRoomExists, getHighestScoreFromRoomName, getResultsFromRoomName,
    };
}

module.exports = setupDatabase;
