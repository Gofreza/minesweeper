const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const {setupDatabase, getDatabase, getClient} = require('../database/dbSetup');
const authFunctions = require('../database/dbAuth');
const {isAdminFunction, isNotConnected, verifyToken} = require("../miscFunction");
let db;
getDatabase().then((database) => {
    db = database;
    console.log("Database link auth.js");
})
router.get('/login',isNotConnected, async (req, res) => {
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token);
    const isAdmin = await isAdminFunction(req);
    res.render('../view/page/login.pug', {
        title: 'Login',
        showMenuBar: true,
        loggedIn: isConnected,
        admin: isAdmin,
    });
})

router.get('/register', isNotConnected, async (req, res) => {
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token);
    const isAdmin = await isAdminFunction(req);
    res.render('../view/page/register.pug', {
        title: 'Register',
        showMenuBar: true,
        loggedIn: isConnected,
        admin: isAdmin,
    });
})

router.post('/login', isNotConnected, async (req, res) => {
    let {username, password} = req.body;

    if (username.length > 20)
        username = username.substring(0, 20);

    try {
        const pgClient = getClient()
        const hashedPassword = await authFunctions.getHashUserPG(pgClient, username);

        if (hashedPassword) {
            bcrypt.compare(password, hashedPassword, async (bcryptError, bcryptResult) => {
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
                if (await checkAdmin(pgClient, username, hashedPassword, res)) {
                    const token = jwt.sign({username: username}, process.env.SECRET_KEY_ADMIN, {expiresIn: '1h'});
                    res.cookie('token', token, {httpOnly: true});

                    // Add a connection to the database
                    await authFunctions.addConnectionPG(pgClient, token, username);

                    // Add username to the session
                    req.session.username = username;

                    return res.redirect('/adminDashboard');
                } else {
                    const token = jwt.sign({username: username}, process.env.SECRET_KEY, {expiresIn: '1h'});
                    res.cookie('token', token, {httpOnly: true});

                    // Add a connection to the database
                    await authFunctions.addConnectionPG(pgClient, token, username);

                    // Add username to the session
                    req.session.username = username;

                    return res.redirect('/')
                }
            });
        } else {
            // No password found
            // Redirect back to the previous page or handle as needed
            return res.redirect('/');
        }

        async function checkAdmin(pgClient, username, hashedPassword) {
            try {
                return await authFunctions.isAdminPG(pgClient, username, hashedPassword);
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

router.post('/register', isNotConnected, async (req, res) => {
    const {username, password, password2} = req.body;

    // Check if the passwords match
    if (password !== password2) {
        return res.redirect('/register');
    }

    // Check if the username already exists
    try {
        const pgClient = getClient()
        const usernameExists = await authFunctions.usernameExistsPG(pgClient, username);
        if (usernameExists) {
            return res.redirect('/register');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into users table
        await authFunctions.insertUserPG(pgClient, username, hashedPassword);

        // Redirect to login page
        return res.redirect('/login');

    } catch (usernameError) {
        console.error('Error occurred while checking if username exists:', usernameError);
        return res.status(500).send('Internal Server Error');
    }
})

router.post('/logout', verifyToken, (req, res) => {
    req.session.destroy(async err => {
        if (err) {
            console.error('Error destroying session:', err);
            // Handle the error appropriately
            res.status(500).send('Internal Server Error');
        } else {
            const token = req.cookies.token;
            await authFunctions.deleteConnectionPG(getClient(), token);
            // Clear the 'token' cookie from the user's browser
            res.clearCookie('token');

            // Redirect the user to the home page
            res.redirect('/');
        }
    });
});

module.exports = router;