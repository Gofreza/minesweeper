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

const stats = []

router.post('/api/stats', verifyToken, async (req, res) => {
    try {
        const body = req.body;
        const accountUsername = req.session.accountUsername;

        //console.log("Stats api/stats:", body);
        //await updateStats(getClient(), accountUsername, body);
        stats.push({username: accountUsername, stats: body});

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
        //console.log("Winning Stats:", body, "Username:", req.session.username);
        const winner = body.winner;
        const numberOfResults = body.numberOfResults;
        //console.log("Stats api/winningStats:", stats);

        if (numberOfResults > 1) {
            if (winner === req.session.username) {
                await updateWinningStats(getClient(), req.session.accountUsername, {numGamesWon: 1, numGamesLost: 0});
            } else {
                await updateWinningStats(getClient(), req.session.accountUsername, {numGamesWon: 0, numGamesLost: 1});
            }
            for (const playerStats of stats) {
                console.log(playerStats.stats)
                await updateStats(getClient(), playerStats.username, playerStats.stats);
            }
            stats.length = 0;

            res.status(200).send({success: "success"});
        } else {
            stats.length = 0;
            res.status(200).send({error: "Not enough players to update stats"});
        }


    } catch (e) {
        console.log("Error:", e);
        res.status(500).send({error: "Internal server error"});
    }
})

router.get('/api/stats', verifyToken, async (req, res) => {
    res.status(200).send(await getStats(getClient(), req.session.accountUsername));
})

module.exports = router;