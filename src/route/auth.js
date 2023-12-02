const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const setupDatabase = require('../database/dbSetup');
const authFunctions = require('../database/dbAuth');
let db;
setupDatabase()
    .then((database) => {
        db = database;
        console.log("Database created auth.js");
    });

router.get('/login', (req, res) => {
    res.render('../view/page/login.pug', {
        title: 'Login',
    });
})

router.post('/login', async (req, res) => {
    const {username, password} = req.body;

    try {
        const hashedPassword = await authFunctions.getHash(db, username);
        if (hashedPassword) {
            bcrypt.compare(password, hashedPassword, (bcryptError, bcryptResult) => {
                if (bcryptError) {
                    console.error('Error occurred while comparing passwords:', bcryptError);
                    return res.status(500).send('Internal Server Error');
                }

                if (!bcryptResult) {
                    // Incorrect password
                    // Redirect back to the previous page
                    return res.redirect('/');
                }

                // Password is correct, proceed with admin check
                checkAdmin();
            });
        } else {
            // No password found
            // Redirect back to the previous page or handle as needed
            return res.redirect('/');
        }

        async function checkAdmin() {
            try {
                if (await authFunctions.isAdmin(db, username, hashedPassword)) {
                    const token = jwt.sign({ username: username }, process.env.SECRET_KEY_ADMIN, { expiresIn: '1h' });
                    res.cookie('token', token, { httpOnly: true });
                    return res.redirect('/adminDashboard');
                } else {
                    // Not an admin
                    // Redirect back to the previous page or handle as needed
                    return res.redirect('/');
                }
            } catch (adminError) {
                console.error('Error occurred while checking admin status:', adminError);
                return res.status(500).send('Internal Server Error');
            }
        }
    } catch (hashError) {
        console.error('Error occurred while getting hashed password:', hashError);
        res.status(500).send('Internal Server Error');
    }

});

module.exports = router;