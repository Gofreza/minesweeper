const express = require('express');
const router = express.Router();

const Logger = require('../logger/logger');
const logger = new Logger();

const {setupDatabase, getDatabase} = require('../database/dbSetup');
const roomFunctions = require('../database/dbRoom');
const {verifyTokenAdmin} = require("../miscFunction");
let db;
getDatabase().then((database) => {
    db = database;
    console.log("Database link global.js");
})
router.get('/', (req, res) => {
    const sessionId = req.sessionID;
    //console.log('Express Session ID:', sessionId);
    //Put the sessionId inside a cookie
    res.cookie('sessionId', sessionId, {httpOnly: true});
    res.render("../view/page/home.pug", {
        title:"Home",
        boardLength: 5,
        boardWidth: 5,
        showMenuBar: true,
    })
})

router.get('/test', (req, res) => {
    logger.log("Solo game room launched");
    res.render('../view/page/test.pug', {
        title: "MineSweeper",
        showMenuBar: true,
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
    const values = await roomFunctions.getRoomData(db, roomName);
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