/**
 * Retrieves the number of rows and columns for a specific room from the 'roomData' table.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room to retrieve data for.
 * @returns {Promise<Object>} A promise that resolves with an object representing the number of rows and columns
 *                            for the specified room from the 'roomData' table. The promise is rejected if there is an error
 *                            during the database query, and the error is logged to the console.
 */
async function getRoomData(db, roomName) {
    // SQL query to select the number of rows and columns from the 'roomData' table for the specified room
    const sql = `SELECT numRows, numCols FROM roomData WHERE roomName = ?`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.get' method
        db.get(sql, [roomName], (err, result) => {
            // If there's an error, reject the promise with the error message
            if (err) {
                console.error("Error getRoomData:", err.message);
                reject(err);
            } else {
                // Resolve the promise with an object representing the number of rows and columns for the specified room
                resolve(result);
            }
        });
    });
}


/**
 * Checks if a room with the specified name exists in the 'roomData' table.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room to check for existence.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the specified room exists
 *                             in the 'roomData' table. The promise is rejected if there is an error during the database query,
 *                             and the error is logged to the console.
 */
async function checkIfRoomExists(db, roomName) {
    // SQL query to select a row from the 'roomData' table for the specified room
    const sql = `SELECT * FROM roomData WHERE roomName = ?`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.get' method
        db.get(sql, [roomName], (err, row) => {
            // If there's an error, reject the promise with the error message
            if (err) {
                console.error("Error checkIfRoomExists:", err.message);
                reject(err);
            } else {
                // Resolve the promise with a boolean indicating whether the specified room exists
                resolve(row !== undefined);
            }
        });
    });
}

/**
 * Inserts room data into the 'roomData' table.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room to insert.
 * @param {number} rows - The number of rows for the room.
 * @param {number} cols - The number of columns for the room.
 * @returns {Promise<void>} A promise that resolves when the room data is successfully inserted into the 'roomData' table.
 *                          The promise is rejected if there is an error during the database query, and the error is logged to the console.
 */
async function setRoomData(db, roomName, rows, cols) {
    // SQL query to insert room data into the 'roomData' table
    const sql = `INSERT INTO roomData (roomName, numRows, numCols) VALUES (?, ?, ?)`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.run' method
        db.run(sql, [roomName, rows, cols], (err) => {
            // If there's an error, reject the promise with the error message
            if (err) {
                console.error("Error setRoomData:", err.message);
                reject(err);
            } else {
                // Resolve the promise when the room data is successfully inserted
                resolve();
            }
        });
    });
}


/**
 * Deletes room data from the 'roomData' table based on the room name.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room to delete.
 * @returns {Promise<number>} A promise that resolves with the number of rows deleted when the room data is successfully deleted from the 'roomData' table.
 *                            The promise is rejected if there is an error during the database query, and the error is logged to the console.
 */
async function deleteRoomData(db, roomName) {
    // SQL query to delete room data from the 'roomData' table based on the room name
    const sql = `DELETE FROM roomData WHERE roomName = ?`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.run' method
        db.run(sql, [roomName], function (err) {
            // If there's an error, reject the promise with the error message
            if (err) {
                console.error("Error deleteRoomData:", err.message);
                reject(err);
            } else {
                // Resolve the promise with the number of rows deleted
                resolve(this.changes);
            }
        });
    });
}

/**
 * Deletes all room data from the 'roomData' table.
 * @param {Object} db - The database object.
 * @returns {Promise<unknown>} A promise that resolves with the number of rows deleted when the room data is successfully deleted from the 'roomData' table.
 */
async function deleteAllRoomData(db) {
    // SQL query to delete room data from the 'roomData' table based on the room name
    const sql = `DELETE FROM roomData`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.run' method
        db.run(sql, [], function (err) {
            // If there's an error, reject the promise with the error message
            if (err) {
                console.error("Error deleteAllRoomData:", err.message);
                reject(err);
            } else {
                // Resolve the promise with the number of rows deleted
                resolve(this.changes);
            }
        });
    });
}

module.exports = {
    getRoomData, deleteRoomData, setRoomData, checkIfRoomExists, deleteAllRoomData,
}