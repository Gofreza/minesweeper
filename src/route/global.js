const express = require('express');
const router = express.Router();

const Logger = require('../logger/logger');
const logger = new Logger();

const {setupDatabase, getDatabase, getClient} = require('../database/dbSetup');
const authFunctions = require('../database/dbAuth');
const roomFunctions = require('../database/dbRoomData');
const {verifyTokenAdmin, isAdminFunction, verifyToken, isConnected, checkConnection} = require("../miscFunction");
const {verify, TokenExpiredError, decode} = require("jsonwebtoken");
const {getStats} = require("../database/dbStats");
let db;
getDatabase().then((database) => {
    db = database;
    console.log("Database link global.js");
})

router.get('/clear', verifyToken, (req, res) => {
    res.clearCookie('token');
    res.clearCookie('sessionId');
    res.clearCookie('rows');
    res.clearCookie('cols');
    res.redirect('/');
})

router.get('*', async (req, res, next) => {
    const token = req.cookies.token;
    //console.log("Username:", req.session.username, "AccountUsername:", req.session.accountUsername)
    if (token) {
        const decoded = decode(token);
        const expired = new Date(decoded.exp * 1000);
        //console.log("Expired in:", expired, "Date:", new Date());
        if (expired < new Date()) {
            console.log("Token expired");
            res.clearCookie('token');
            req.session.username = null;
            req.session.accountUsername = null;
            await authFunctions.deleteConnectionPG(getClient(), token);
            next();
        } else {
            req.session.username = decoded.username;
            req.session.accountUsername = decoded.username;
            next();
        }
    } else {
        next();
    }
});

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
    const username = req.session.accountUsername;
    console.log("Profile username:", username)
    const stats = await getStats(getClient(), username);
    res.render('../view/page/profile.pug', {
        title: "Profile",
        flash: req.flash(),
        showMenuBar: true,
        loggedIn: isConnected,
        admin: isAdmin,
        username: username,
        stats: stats,
    });
})

module.exports = router;