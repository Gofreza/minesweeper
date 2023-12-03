const express = require('express');
const router = express.Router();

const Logger = require('../logger/logger');
const logger = new Logger();

const {setupDatabase, getDatabase, getClient} = require('../database/dbSetup');
const authFunctions = require('../database/dbAuth');
const roomFunctions = require('../database/dbRoomData');
const {verifyTokenAdmin, isAdminFunction} = require("../miscFunction");
const {verify} = require("jsonwebtoken");
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
            verify(token, process.env.SECRET_KEY_ADMIN, (err, decoded) => {
                if (err) {
                    // Token verification failed
                    //console.error('Token verification failed:', err);
                } else {
                    // Token decoded successfully
                    req.session.username = decoded.username;
                    //console.log('Username from token:', username);
                }
            });
            verify(token, process.env.SECRET_KEY, (err, decoded) => {
                if (err) {
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

module.exports = router;