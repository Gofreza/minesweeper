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
router.get('/login', isNotConnected, async (req, res) => {
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token);
    const isAdmin = await isAdminFunction(req);
    res.render('../view/page/login.pug', {
        title: 'Login',
        flash: req.flash(),
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
        flash: req.flash(),
        showMenuBar: true,
        loggedIn: isConnected,
        admin: isAdmin,
    });
})

router.post('/login', isNotConnected, async (req, res) => {
    const {username, password} = req.body;

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
                    req.flash('error', 'Incorrect password')
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

                    req.flash('success', 'Admin Logged in successfully')
                    return res.redirect('/adminDashboard');
                } else {
                    const token = jwt.sign({username: username}, process.env.SECRET_KEY, {expiresIn: '1h'});
                    res.cookie('token', token, {httpOnly: true});

                    // Add a connection to the database
                    await authFunctions.addConnectionPG(pgClient, token, username);

                    // Add username to the session
                    req.session.username = username;

                    req.flash('success', 'Logged in successfully')
                    return res.redirect('/')
                }
            });
        } else {
            // No password found
            // Redirect back to the previous page or handle as needed
            req.flash('error', 'User does not exist')
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
    let {username, password, password2} = req.body;

    if (username.length > 20)
        username = username.substring(0, 20);

    // Check if the passwords match
    if (password !== password2) {
        req.flash('error', 'Passwords do not match')
        return res.redirect('/register');
    }

    // Check if the username already exists
    try {
        const pgClient = getClient()
        const usernameExists = await authFunctions.usernameExistsPG(pgClient, username);
        if (usernameExists) {
            req.flash('error', 'Username already exists')
            return res.redirect('/register');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into users table
        await authFunctions.insertUserPG(pgClient, username, hashedPassword);

        // Redirect to login page
        req.flash('success', 'Registered successfully')
        return res.redirect('/login');

    } catch (usernameError) {
        console.error('Error occurred while checking if username exists:', usernameError);
        return res.status(500).send('Internal Server Error');
    }
})

router.post('/logout', verifyToken, async (req, res) => {
    try {
        const token = req.cookies.token;

        // Assuming that deleteConnectionPG returns a Promise, use try/catch
        try {
            await authFunctions.deleteConnectionPG(getClient(), token);
        } catch (deleteConnectionError) {
            console.error('Error deleting connection:', deleteConnectionError);
            // Handle the error, perhaps by sending an error response or redirecting to an error page
            req.flash('error', 'An error occurred during logout');
            return res.redirect('/');
        }

        // Clear the 'token' cookie from the user's browser
        res.clearCookie('token');

        // Redirect the user to the home page
        req.flash('success', 'Logged out successfully');
        res.redirect('/');
    } catch (logoutError) {
        console.error('Error during logout:', logoutError);
        // Handle the error, perhaps by sending an error response or redirecting to an error page
        req.flash('error', 'An unexpected error occurred during logout');
        res.redirect('/');
    }
});


module.exports = router;