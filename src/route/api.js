const express = require('express');
const {getClient} = require("../database/dbSetup");
const {isConnectedPG} = require("../database/dbAuth");
const {updateStats} = require("../database/dbStats");
const router = express.Router();

router.post('/api/deconnect', (req, res) => {
    const roomName = req.body.roomName;
    const username = req.body.username;
    console.log("Deconnection request from", username, "in room", roomName);
    res.json({success: true});
})

router.post('/api/stats', async (req, res) => {
    const body = req.body;
    const token = req.cookies.token;
    const isConnected = await isConnectedPG(getClient(), token);
    const username = req.session.accountUsername;
    if (isConnected) {
        await updateStats(getClient(), username, body);
    }
})

module.exports = router;