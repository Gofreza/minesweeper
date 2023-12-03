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
    const sql = `SELECT password FROM users WHERE username = ? AND role = 'user'`;

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
 * Checks if a user with the specified username and password exists in the 'users' table.
 * @param {Object} db - The database object.
 * @param {string} username - The username to check for existence.
 * @param {string} password - The password to check for existence.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the specified user exists
 *                             in the 'users' table. The promise is rejected if there is an error during the database query,
 *                             and the error is logged to the console.
 */
async function isAdmin(db, username, password) {
    // SQL query to select a row from the 'admin' table for the specified username and password
    const sql = `SELECT * FROM users WHERE username = ? AND password = ? AND role = 'admin'`;

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
 * Checks if a user with the specified username exists in the 'users' table.
 * @param pgClient - The database object.
 * @param username - The username to check for existence.
 * @returns {Promise<*|null>} A promise that resolves when the user exists
 */
async function getHashUserPG(pgClient, username) {
    try {
        const query = {
            name: 'fetch-user-hash',
            text: `SELECT password FROM users WHERE username = $1`,
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
        console.error("Error getHashUserPG:", error.message);
    }
}

/**
 * Checks if a user with the specified username and password exists in the 'users' table.
 * @param {Object} pgClient - The database object.
 * @param {string} username - The username to check for existence.
 * @param {string} password - The password to check for existence.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the specified user exists
 *                            in the 'users' table. The promise is rejected if there is an error during the database query,
 *                            and the error is logged to the console.
 */
async function isAdminPG(pgClient, username, password) {
    try {
        const query = {
            name: 'fetch-admin-identifiers',
            text: `SELECT * FROM users WHERE username = $1 AND password = $2 AND role = 'admin'`,
            values: [username, password]
        };
        const res = await pgClient.query(query)
        return res.rows.length > 0
    } catch (error) {
        console.error("Error isAdminPG:", error.message);
    }
}

/**
 * Checks if a user with the specified username exists in the 'users' table.
 * @param {Object} pgClient - The database object.
 * @param {string} username - The username to check for existence.
 * @returns {Promise<unknown>} A promise that resolves when the user already exists.
 */
async function usernameExistsPG(pgClient, username) {
    try {
        const query = {
            name: 'username-exists',
            text: `SELECT * FROM users WHERE username = $1`,
            values: [username]
        };
        const res = await pgClient.query(query)
        return res.rows.length > 0
    } catch (error) {
        console.error("Error usernameExistsPG:", error.message);
    }
}

/**
 * Inserts a user with the specified username and password into the 'users' table.
 * @param {Object} pgClient - The database object.
 * @param {string} username - The username to insert.
 * @param {string} password - The password to insert.
 * @returns {Promise<unknown>} A promise that resolves when the user is successfully inserted.
 */
async function insertUserPG(pgClient, username, password) {
    try {
        const query = {
            name: 'insert-user-pg',
            text: `INSERT INTO users (username, password, role) VALUES ($1, $2, 'user')`,
            values: [username, password]
        };
        await pgClient.query(query)
    } catch (error) {
        console.error("Error insertUserPG:", error.message);
    }
}

/**
 * Inserts a connection with the specified token and username into the 'connection' table.
 * @param {Object} pgClient - The database object.
 * @param {string} token - The token to insert.
 * @param {string} username - The username to insert.
 * @returns {Promise<unknown>} A promise that resolves when the connection is successfully inserted.
 */
async function addConnectionPG(pgClient, token, username) {
    try {
        const query = {
            name: 'add-connection',
            text: `INSERT INTO connection (token, username) VALUES ($1, $2)`,
            values: [token, username]
        };
        await pgClient.query(query)
    } catch (error) {
        console.error("Error addConnectionPG:", error.message);
    }
}

/**
 * Deletes a connection with the specified token from the 'connection' table.
 * @param {Object} pgClient - The database object.
 * @param {string} token - The token to delete.
 * @returns {Promise<unknown>} A promise that resolves when the connection is successfully deleted.
 */
async function deleteConnectionPG(pgClient, token) {
    try {
        const query = {
            name: 'delete-connection',
            text: `DELETE FROM connection WHERE token = $1`,
            values: [token]
        };
        await pgClient.query(query)
    } catch (error) {
        console.error("Error deleteConnectionPG:", error.message);
    }

}

/**
 * Check if a connection with the specified token exists in the 'connection' table.
 * @param {Object} pgClient - The database object.
 * @param {string} token - The token to check.
 * @returns {Promise<unknown>} A promise that resolves if the connection exists.
 */
async function isConnectedPG(pgClient, token) {
    try {
        const query = {
            name: 'check-isConnectedPG',
            text: `SELECT * FROM connection WHERE token = $1`,
            values: [token]
        };
        const res = await pgClient.query(query)
        return res.rows.length === 1;
    } catch (error) {
        console.error("Error isConnectedPG:", error.message);
    }
}

module.exports = {
    // SQLite
    isAdmin, getHash,
    // PostgresSQL
    isAdminPG, getHashUserPG, usernameExistsPG, insertUserPG,
    addConnectionPG, deleteConnectionPG, isConnectedPG,
}