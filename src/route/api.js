const express = require('express');
const {getClient} = require("../database/dbSetup");
const {isConnectedPG} = require("../database/dbAuth");
const {updateStats, getStats} = require("../database/dbStats");
const {verifyToken} = require("../miscFunction");
const router = express.Router();

router.post('/api/deconnect', (req, res) => {
    const roomName = req.body.roomName;
    const username = req.body.username;
    console.log("Deconnection request from", username, "in room", roomName);
    res.json({success: true});
})

router.post('/api/stats', verifyToken, async (req, res) => {
    const body = req.body;
    const token = req.cookies.token;
    const isConnected = await isConnectedPG(getClient(), token);
    const username = req.session.accountUsername;
    if (isConnected) {
        await updateStats(getClient(), username, body);
    }
})

router.get('/api/stats', verifyToken, async (req, res) => {
    res.status(200).send(await getStats(getClient(), req.session.accountUsername));
})

module.exports = router;