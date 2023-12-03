const { hashSync } = require("bcrypt");
const {getClient} = require("./dbSetup");

async function fillDatabase(db) {
    console.log(db)
    return new Promise((resolve, reject) => {
        // Check if the admin already exists
        db.get(`SELECT * FROM admin WHERE username = ?`, ['admin'], (selectErr, row) => {
            if (selectErr) {
                console.error("Error checking if admin exists:", selectErr.message);
                reject(selectErr);
            } else {
                // If the admin does not exist, insert it
                if (!row) {
                    const password = hashSync('admin', 10);
                    db.run(`INSERT INTO admin (username, password)
                  VALUES (?, ?)`, ['admin', password], (insertErr) => {
                        if (insertErr) {
                            console.error("Error inserting default admin:", insertErr.message);
                            reject(insertErr);
                        } else {
                            console.log("Default admin inserted");
                            resolve();
                        }
                    });
                } else {
                    // Admin already exists, no need to insert
                    console.log("Default admin already exists");
                    resolve();
                }
            }
        });
    });
}

async function fillDb() {
    const pgClient = getClient()
    try {
        const query = {
            name: 'fetch-admin',
            text: `SELECT * FROM admin WHERE username = $1`,
            values: ['admin']
        };
        const res = await pgClient.query(query)
        if (res.rows.length === 0) {
            const password = hashSync('admin', 10);
            const query = {
                name: 'insert-admin',
                text: `INSERT INTO admin (username, password) VALUES ($1, $2)`,
                values: ['admin', password]
            };
            await pgClient.query(query)
            console.log("Default admin inserted");
        } else {
            console.log("Default admin already exists");
        }

    } catch (error) {
        console.error("Error fillDb:", error.message);
    }
}

module.exports = {fillDatabase, fillDb};
