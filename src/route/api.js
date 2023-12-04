const express = require('express');
const {getClient} = require("../database/dbSetup");
const {isConnectedPG} = require("../database/dbAuth");
const {updateStats, getStats, updateWinningStats} = require("../database/dbStats");
const {verifyToken} = require("../miscFunction");
const router = express.Router();

router.post('/api/deconnect', (req, res) => {
    const roomName = req.body.roomName;
    const username = req.body.username;
    console.log("Deconnection request from", username, "in room", roomName);
    res.json({success: true});
})

router.post('/api/stats', verifyToken, async (req, res) => {
    try {
        const body = req.body;
        const token = req.cookies.token;
        const isConnected = await isConnectedPG(getClient(), token);
        const username = req.session.accountUsername;
        if (isConnected) {
            //console.log("Stats:", body);
            await updateStats(getClient(), username, body);
        }
        res.status(200).send({success: "success"});
    } catch (e) {
        console.log("Error:", e);
        res.status(500).send({error: "Internal server error"});
    }
})

router.post('/api/winningStats', verifyToken, async (req, res) => {
    try {
        const token = req.cookies.token;
        const isConnected = await isConnectedPG(getClient(), token);
        if (!isConnected) {
            res.status(401).send({error: "Not connected"});
            return;
        }
        const body = req.body;
        //console.log("Winning Stats:", body);
        const winner = body.winner;

        if (winner === req.session.username) {
            await updateWinningStats(getClient(), req.session.accountUsername, {numGamesWon: 1, numGamesLost: 0});
        } else {
            await updateWinningStats(getClient(), req.session.accountUsername, {numGamesWon: 0, numGamesLost: 1});
        }

        res.status(200).send({success: "success"});
    } catch (e) {
        console.log("Error:", e);
        res.status(500).send({error: "Internal server error"});
    }
})

router.get('/api/stats', verifyToken, async (req, res) => {
    res.status(200).send(await getStats(getClient(), req.session.accountUsername));
})

module.exports = router;