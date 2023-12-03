const express = require('express');
const router = express.Router();

const Logger = require('../logger/logger');
const logger = new Logger();

const {setupDatabase, getDatabase, getClient} = require('../database/dbSetup');
const authFunctions = require('../database/dbAuth');
const roomFunctions = require('../database/dbRoomData');
const {verifyTokenAdmin, isAdminFunction, verifyToken, isConnected} = require("../miscFunction");
const {verify, TokenExpiredError} = require("jsonwebtoken");
let db;
getDatabase().then((database) => {
    db = database;
    console.log("Database link global.js");
})

router.get('*', (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        if (req.session.username) {
            next();
        } else {
            verify(token, process.env.SECRET_KEY_ADMIN, async (err, decoded) => {
                //console.log("decoded admin:", decoded);
                if (err instanceof TokenExpiredError) {
                    console.log("Token admin expired");
                    // Token has expired
                    //console.error('Token has expired:', err.expiredAt);
                    await authFunctions.deleteConnectionPG(getClient(), token);
                    res.clearCookie('token');
                    res.redirect('/logout');
                } else if (err) {
                    // Token verification failed
                    //console.error('Token verification failed:', err);
                } else {
                    // Token decoded successfully
                    req.session.username = decoded.username;
                    //console.log('Username from token:', username);
                }
            });
            verify(token, process.env.SECRET_KEY, async (err, decoded) => {
                //console.log("decoded user:", decoded);
                if (err instanceof TokenExpiredError) {
                    // Token has expired
                    //console.error('Token has expired:', err.expiredAt);
                    await authFunctions.deleteConnectionPG(getClient(), token);
                    res.clearCookie('token');
                    res.redirect('/logout');
                } else if (err) {
                    // Token verification failed
                    //console.error('Token verification failed:', err);
                } else {
                    // Token decoded successfully
                    req.session.username = decoded.username;
                    //console.log('Username from token:', username);
                }
            });
            next();
        }
    } else {
        next();
    }
})

router.get('/', async (req, res) => {
    const sessionId = req.sessionID;
    //console.log('Express Session ID:', sessionId);
    //Put the sessionId inside a cookie
    res.cookie('sessionId', sessionId, {httpOnly: true});
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token);
    const isAdmin = await isAdminFunction(req);
    const username = req.session.username

    res.render("../view/page/home.pug", {
        title: "Home",
        flash: req.flash(),
        boardLength: 5,
        boardWidth: 5,
        showMenuBar: true,
        loggedIn: isConnected,
        admin: isAdmin,
        username: username,
    })
})

router.get('/test', async (req, res) => {
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token);
    const isAdmin = await isAdminFunction(req);
    logger.log("Solo game room launched");
    res.render('../view/page/test.pug', {
        title: "MineSweeper",
        showMenuBar: true,
        loggedIn: isConnected,
        admin: isAdmin,
    });
})

router.post('/createGrid', (req, res) => {
    let {rows, cols} = req.body;
    if (rows < 5) {
        rows = 5;
    } else if (rows > 100) {
        rows = 100;
    }
    if (cols < 5) {
        cols = 5;
    } else if (cols > 100) {
        cols = 100;
    }
    res.cookie('rows', rows);
    res.cookie('cols', cols);
    res.redirect('/test');
})

router.get('/getVersusGridInfo', async (req, res) => {
    const { roomName } = req.query;
    //console.log("getVersusGridInfo roomName:", roomName);
    //const values = await roomFunctions.getRoomData(db, roomName);
    const values = await roomFunctions.getRoomDataPG(db, roomName);
    //console.log("Values getVersusGridInfo:", values);
    res.json({rows: values.rows, cols: values.cols });
});

router.post('/room', (req, res) => {
    const { roomName, users, username } = req.body;
    //console.log("SessionPOST : body:", req.body);
    // Store the data in the session
    req.session.roomData = { roomName, users, username };

    // Redirect to the GET route
    res.redirect('/room');
});

router.get('/room', (req, res) => {
    // Retrieve the data from the session
    const { roomName, users, username } = req.session.roomData || {};
    //console.log("SessionGET roomName:", roomName, "users:", users, "username:", username);
    // Render the page
    res.render('../view/page/room.pug', {
        title: roomName,
        roomName:roomName,
        users:users,
        username:username,
    });
});

router.get('/profile', verifyToken, async (req, res) => {
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token);
    const isAdmin = await isAdminFunction(req);
    const username = req.session.username;
    res.render('../view/page/profile.pug', {
        title: "Profile",
        flash: req.flash(),
        showMenuBar: true,
        loggedIn: isConnected,
        admin: isAdmin,
        username: username,
    });
})

module.exports = router;