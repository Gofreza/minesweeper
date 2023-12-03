const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const pg = require("pg");

let dbInstance = null;
let pgClient = null;

// *******************
// *** PostgresSQL ***
// *******************

const connectDatabase = async () => {
    try {
        // Initialize the database configuration
        pgClient = new pg.Client(process.env.POSTGRESQL_ADDON_URI);

        // Connect to the database
        await pgClient.connect();

        // Create the tables if they don't exist
        createAllTables();

        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database: ', error);
    }
};

function disconnectDatabase(){
    pgClient.end();
}

function getClient(){
    return pgClient;
}

function createConnectionTable(){
    const query = {
        name: "create-connection-table",
        text:`
        CREATE TABLE IF NOT EXISTS connection (
            id SERIAL PRIMARY KEY,
            token VARCHAR(255) NOT NULL,
            username VARCHAR(50) NOT NULL
    );`};

    pgClient.query(query)
        .then(() => console.log("Created connection table successfully"))
        .catch(error => console.error("Error creating connection table:", error));
}

function createUsersTable(){
    const query = {
        name: "create-users-table",
        text:`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL
    );`};

    pgClient.query(query)
        .then(() => console.log("Created users table successfully"))
        .catch(error => console.error("Error creating users table:", error));
}

function createRoomDataTable(){
    const query = {
        name: "create-roomData-table",
        text:`
        CREATE TABLE IF NOT EXISTS roomData (
            roomName VARCHAR(50) PRIMARY KEY,
            numRows INTEGER NOT NULL,
            numCols INTEGER NOT NULL
    );`};

    pgClient.query(query)
        .then(() => console.log("Created roomData table successfully"))
        .catch(error => console.error("Error creating roomData table:", error));
}

function createRoomsTable(){
    const query = {
        name: "create-rooms-table",
        text:`
        CREATE TABLE IF NOT EXISTS rooms (
            roomName VARCHAR(50) NOT NULL,
            username VARCHAR(50) NOT NULL,
            score INTEGER NOT NULL,
            PRIMARY KEY (roomName, username)
    );`};

    pgClient.query(query)
        .then(() => console.log("Created rooms table successfully"))
        .catch(error => console.error("Error creating rooms table:", error));
}

function createStatsTable(){
    const query = {
        name: "create-stats-table",
        text:`
        CREATE TABLE IF NOT EXISTS stats (
            username VARCHAR(50) NOT NULL,
            gameMode VARCHAR(50) NOT NULL,
            numGamesPlayed INTEGER NOT NULL,
            numGamesWon INTEGER NOT NULL,
            numGamesLost INTEGER NOT NULL,
            numBombsDefused INTEGER NOT NULL,
            numBombsExploded INTEGER NOT NULL,
            numFlagsPlaced INTEGER NOT NULL,
            numCellsRevealed INTEGER NOT NULL,
            averageTime INTEGER NOT NULL, 
            fastestTime INTEGER NOT NULL,
            longestTime INTEGER NOT NULL,
            FOREIGN KEY (username) REFERENCES users(username),
            PRIMARY KEY (username, gameMode)
    );`};

    pgClient.query(query)
        .then(() => console.log("Created stats table successfully"))
        .catch(error => console.error("Error creating stats table:", error));
}

function createAllTables(){
    createConnectionTable();
    createUsersTable();
    createRoomDataTable();
    createRoomsTable();
    createStatsTable();
}

// **************
// *** SQLite ***
// **************

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
        const db = new sqlite3.Database('./src/database/database.db', (err) => {
            if (err) {
                console.error("Error opening the database:", err.message);
                reject(err);
            } else {
                // Create the user table if it doesn't exist
                db.run(`CREATE TABLE IF NOT EXISTS roomData (
                    roomName TEXT NOT NULL PRIMARY KEY,
                    numRows INTEGER NOT NULL,
                    numCols INTEGER NOT NULL
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS rooms (
                    roomName TEXT NOT NULL,
                    username TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    PRIMARY KEY (roomName, username)
                )`);

                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    password TEXT NOT NULL
                )`);

                // Create the admin table
                db.run(`CREATE TABLE IF NOT EXISTS admin (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    password TEXT NOT NULL
                )`, (createErr) => {
                    if (createErr) {
                        console.error("Error creating tables:", createErr.message);
                        db.close();
                        reject(createErr);
                    } else {
                        dbInstance = db;
                        resolve(db);
                    }
                });
            }
        });
    });
}

/**
 * Get the database instance
 * @returns {Promise<Database|null>} A promise that resolves with the database instance or null if not set up yet
 */
function getDatabase() {
    return Promise.resolve(dbInstance);
}

module.exports = {
    // SQLite
    setupDatabase,
    getDatabase,
    // PostgreSQL
    connectDatabase,
    disconnectDatabase,
    getClient,
};
