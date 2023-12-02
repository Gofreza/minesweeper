async function getHash(db, username) {
    const sql = `SELECT password FROM admin WHERE username = ?`;

    return new Promise((resolve, reject) => {
        db.get(sql, [username], (err, row) => {
            if (err) {
                console.error("Error getHash:", err.message);
                reject(err);
            } else {
                // Check if row is undefined
                if (row === undefined) {
                    // No password found, resolve with a default value or handle the case
                    resolve(null); // You can replace null with any default value
                } else {
                    resolve(row.password);
                }
            }
        });
    });
}


/**
 * Checks if a user with the specified username and password exists in the 'admin' table.
 * @param {Object} db - The database object.
 * @param {string} username - The username to check for existence.
 * @param {string} password - The password to check for existence.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the specified user exists
 *                             in the 'admin' table. The promise is rejected if there is an error during the database query,
 *                             and the error is logged to the console.
 */
async function isAdmin(db, username, password) {
    // SQL query to select a row from the 'admin' table for the specified username and password
    const sql = `SELECT * FROM admin WHERE username = ? AND password = ?`;

    // Return a Promise for asynchronous handling
    return new Promise((resolve, reject) => {
        // Execute the SQL query using the 'db.get' method
        db.get(sql, [username, password], (err, row) => {
            // If there's an error, reject the promise with the error message
            if (err) {
                console.error("Error isAdmin:", err.message);
                reject(err);
            } else {
                // Resolve the promise with a boolean indicating whether the specified user exists
                resolve(row !== undefined);
            }
        });
    });
}

module.exports = {
    isAdmin, getHash,
}