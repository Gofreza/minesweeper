/**
 * Adds a user score entry to the 'users' table in the database.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room to associate the user with.
 * @param {string} username - The username of the user.
 * @param {number} score - The score to be added for the user.
 * @returns {Promise<void>} A promise that resolves when the user score is successfully added.
 *                          The promise is rejected if there is an error during the insertion process.
 */
async function addUserScore(db, roomName, username, score) {
    console.log("addUserScore: " + roomName + " " + username + " " + score);

    // SQL query to insert or replace user score in the 'users' table
    const sql = `
        INSERT OR REPLACE INTO rooms (roomName, username, score) 
        VALUES (?, ?, COALESCE((SELECT score FROM rooms WHERE roomName = ? AND username = ?), 0) + ?)
    `;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.run' method
        db.run(sql, [roomName, username, roomName, username, score], (err) => {
            // If there's an error, log it to the console and reject the promise
            if (err) {
                console.error("Error addUserScore:", err.message);
                reject(err);
            } else {
                // If successful, resolve the promise
                resolve();
            }
        });
    });
}


/**
 * Deletes a user score entry from the 'users' table in the database.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room associated with the user score.
 * @param {string} username - The username of the user whose score needs to be deleted.
 * @returns {Promise<void>} A promise that resolves when the user score is successfully deleted.
 *                          The promise is not rejected even if there is an error during the deletion process.
 *                          Errors are logged to the console.
 */
async function deleteUserScore(db, roomName, username) {
    // SQL query to delete user score from the 'users' table
    const sql = `DELETE FROM rooms WHERE roomName = ? AND username = ?`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve) => {
        // Execute the SQL query using the 'db.run' method
        db.run(sql, [roomName, username], (err) => {
            // If there's an error, log it to the console (but don't reject the promise)
            if (err) {
                console.error("Error deleteUserScore:", err.message);
            }
            // Resolve the promise regardless of success or failure
            resolve();
        });
    });
}

/**
 * Deletes all user score entries from the 'users' table in the database for a given room.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room associated with the user scores.
 * @returns {Promise<unknown>} A promise that resolves when the user scores are successfully deleted.
 */
async function deleteAllUserScores(db, roomName) {
    // SQL query to delete user score from the 'users' table
    const sql = `DELETE FROM rooms WHERE roomName = ?`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve) => {
        // Execute the SQL query using the 'db.run' method
        db.run(sql, [roomName], (err) => {
            // If there's an error, log it to the console (but don't reject the promise)
            if (err) {
                console.error("Error deleteUserScore:", err.message);
            }
            // Resolve the promise regardless of success or failure
            resolve();
        });
    });
}

/**
 * Retrieves the results from the 'users' table for a specific room.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room to retrieve results for.
 * @returns {Promise<Object>} A promise that resolves with an object representing the results from the 'users' table
 *                            for the specified room. The promise is rejected if there is an error during the database
 *                            query, and the error is logged to the console.
 */
async function getResultsFromRoomName(db, roomName) {
    // SQL query to select all columns from the 'users' table for the specified room
    const sql = `SELECT * FROM rooms WHERE roomName = ?`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.get' method
        db.all(sql, [roomName], (err, results) => {
            // If there's an error, reject the promise with the error message
            if (err) {
                console.error("Error getResultsFromRoomName:", err.message);
                reject(err);
            } else {
                // Resolve the promise with the results from the 'users' table for the specified room
                resolve(results);
            }
        });
    });
}


/**
 * Checks if the number of user entries in the 'users' table for a given room matches the specified player number.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room to check for results.
 * @param {number} playerNumber - The expected number of players in the room.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the number of user entries
 *                            matches the specified player number. The promise is rejected if there is an error
 *                            during the database query, and the error is logged to the console.
 */
async function checkResults(db, roomName, playerNumber) {
    // SQL query to count the number of user entries in the 'users' table for the specified room
    const sql = `SELECT COUNT(*) FROM rooms WHERE roomName = ?`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.get' method
        db.get(sql, [roomName], (err, row) => {
            // If there's an error, reject the promise with the error message
            if (err) {
                console.error("Error checkResults:", err.message);
                reject(err);
            } else {
                // Resolve the promise with a boolean indicating whether the number of user entries matches the player number
                resolve(row['COUNT(*)'] === playerNumber);
            }
        });
    });
}


/**
 * Retrieves the user with the highest score from the 'users' table for a specific room.
 * @param {Object} db - The database object.
 * @param {string} roomName - The name of the room to retrieve the highest score for.
 * @returns {Promise<Object>} A promise that resolves with an object representing the user with the highest score
 *                            from the 'users' table for the specified room. The promise is rejected if there is an error
 *                            during the database query, and the error is logged to the console.
 */
async function getHighestScoreFromRoomName(db, roomName) {
    // SQL query to select the username and score from the 'users' table for the specified room, ordered by score in ascending order, and limiting to 1 result
    const sql = `SELECT username, score FROM rooms WHERE roomName = ? ORDER BY score ASC LIMIT 1`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.get' method
        db.get(sql, [roomName], (err, result) => {
            // If there's an error, reject the promise with the error message
            if (err) {
                console.error("Error getHighestScoreFromRoomName:", err.message);
                reject(err);
            } else {
                // Resolve the promise with the user having the highest score from the 'users' table for the specified room
                resolve(result);
            }
        });
    });
}


module.exports = {
    addUserScore, deleteUserScore, deleteAllUserScores, getResultsFromRoomName, checkResults, getHighestScoreFromRoomName,
}