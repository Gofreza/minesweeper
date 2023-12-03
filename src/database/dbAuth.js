// **************
// *** SQLite ***
// **************

/**
 * Checks if a user with the specified username exists in the 'admin' table.
 * @param db - The database object.
 * @param username - The username to check for existence.
 * @returns {Promise<unknown>} A promise that resolves when the user is successfully deleted.
 */
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

// *******************
// *** PostgresSQL ***
// *******************

/**
 * Checks if a user with the specified username exists in the 'admin' table.
 * @param {Object} pgClient - The database object.
 * @param {string} username - The username to check for existence.
 * @returns {Promise<unknown>} A promise that resolves when the user is successfully deleted.
 */
async function getHashPG(pgClient, username) {
    try {
        const query = {
            name: 'fetch-hash',
            text: `SELECT password FROM admin WHERE username = $1`,
            values: [username]
        };
        const res = await pgClient.query(query)
        if (res.rows.length === 0) {
            // No password found, resolve with a default value or handle the case
            return null; // You can replace null with any default value
        } else {
            return res.rows[0].password;
        }
    } catch (error) {
        console.error("Error getHashPG:", error.message);
    }
}

/**
 * Checks if a user with the specified username and password exists in the 'admin' table.
 * @param {Object} pgClient - The database object.
 * @param {string} username - The username to check for existence.
 * @param {string} password - The password to check for existence.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the specified user exists
 *                            in the 'admin' table. The promise is rejected if there is an error during the database query,
 *                            and the error is logged to the console.
 */
async function isAdminPG(pgClient, username, password) {
    try {
        const query = {
            name: 'fetch-admin-identifiers',
            text: `SELECT * FROM admin WHERE username = $1 AND password = $2`,
            values: [username, password]
        };
        const res = await pgClient.query(query)
        return res.rows.length > 0
    } catch (error) {
        console.error("Error isAdminPG:", error.message);
    }
}

module.exports = {
    // SQLite
    isAdmin, getHash,
    // PostgresSQL
    isAdminPG, getHashPG,
}