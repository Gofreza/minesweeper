const { hashSync } = require("bcrypt");

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

module.exports = fillDatabase;
