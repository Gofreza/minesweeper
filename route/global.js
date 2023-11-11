const express = require('express');
const router = express.Router();

const setupDatabase = require('../database/dbSetup');
const roomFunctions = require('../database/dbRoom');
let db;
setupDatabase()
    .then((database) => {
        db = database;
        console.log("Database created global.js");
    });

// A mettre dans une base de données
// Pour une partie on stocke ses infos
let numRows = 0;
let numCols = 0;

router.get('/', (req, res) => {
    const sessionId = req.sessionID;
    //console.log('Express Session ID:', sessionId);
    //Put the sessionId inside a cookie
    res.cookie('sessionId', sessionId);
    res.render("../view/page/home.pug", {
        title:"Home",
        boardLength: 5,
        boardWidth: 5,
        showMenuBar: true,
    })
})

router.get('/test', (req, res) => {
    res.render('../view/page/test.pug', {
        title: "MineSweeper",
        showMenuBar: true,
    });
})

router.post('/createGrid', (req, res) => {
    const {rows, cols} = req.body;
    numRows = rows;
    numCols = cols;
    res.redirect('/test');
})

router.get('/getVersusGridInfo', async (req, res) => {
    const { roomName } = req.query;
    console.log("getVersusGridInfo roomName:", roomName);
    const values = await roomFunctions.getRoomData(db, roomName);
    console.log("Values getVersusGridInfo:", values);
    res.json({rows: values.rows, cols: values.cols });
});


router.get('/getGridInfo', (req, res) => {
    res.send({rows: numRows, cols:numCols});
})

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