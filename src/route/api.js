const express = require('express');
const {getClient} = require("../database/dbSetup");
const {isConnectedPG} = require("../database/dbAuth");
const {updateStats, getStats, updateWinningStats} = require("../database/dbStats");
const {verifyToken, calculatePoints, calculateLosePoints} = require("../miscFunction");
const {updatePosition, getPositionsOfPlayers, insertLeaderboardScore} = require("../database/dbLeaderboard");
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
        const isRanked = body.isRanked;
        let playerPoint = 0;
        //console.log("Stats api/winningStats:", stats);

        if (numberOfResults > 1) {
            if (isRanked) {
                const sortedResults = body.sortedResults;
                //console.log("Sorted Results:", sortedResults);
                // Get the player's position
                let playerList = [];
                for (const result of sortedResults) {
                    playerList.push(result.accountusername);
                }

                const totalPlayersPosition = await getPositionsOfPlayers(getClient(), playerList);
                //console.log("Total Players Position:", totalPlayersPosition);

                for (const result of sortedResults) {
                    const index = sortedResults.indexOf(result);
                    if (result.accountusername === req.session.accountUsername) {
                        const playerIndex = totalPlayersPosition.findIndex(player => player.username === req.session.accountUsername);
                        const playerPosition = totalPlayersPosition[playerIndex].position;

                        // Player is in the top half of the game, win points
                        if (index < numberOfResults/2) {
                            const points = calculatePoints(playerPosition, totalPlayersPosition);
                            playerPoint = points;
                            //console.log("Player:", result.accountusername, "is in the top half of the game, win points:", points);
                            await insertLeaderboardScore(getClient(), result.accountusername, points);
                        }
                        // Player is in the bottom half of the game, lose points
                        else {
                            const points = calculateLosePoints(playerPosition, totalPlayersPosition);
                            playerPoint = -points;
                            //console.log("Player:", result.accountusername, "is in the bottom half of the game, lose points:", points);
                            await insertLeaderboardScore(getClient(), result.accountusername, -points);
                        }
                        //console.log("Ranked Result player:", result.accountusername, ": ", result, "Index:", index);
                        sortedResults.splice(index, 1);

                    }
                }
                await updatePosition(getClient());
            }

            if (winner === req.session.username) {
                await updateWinningStats(getClient(), req.session.accountUsername, {numGamesWon: 1, numGamesLost: 0, gameMode: 'multi'});
            } else {
                await updateWinningStats(getClient(), req.session.accountUsername, {numGamesWon: 0, numGamesLost: 1, gameMode: 'multi'});
            }
            for (const playerStats of stats) {
                if (req.session.accountUsername === playerStats.username) {
                    //console.log("PlayerStats of ", playerStats.username, " : ",playerStats.stats)
                    await updateStats(getClient(), playerStats.username, playerStats.stats);
                    stats.splice(stats.indexOf(playerStats), 1);
                }
            }
            stats.length = 0;

            if (isRanked) {
                res.status(200).send({success: "success", playerPoints: playerPoint});
            } else {
                res.status(200).send({success: "success"});
            }
        } else {
            for (const playerStats of stats) {
                if (winner === req.session.username && playerStats.numBombsExploded === 0) {
                    await updateWinningStats(getClient(), req.session.accountUsername, {numGamesWon: 1, numGamesLost: 0, gameMode: 'solo'});
                } else {
                    await updateWinningStats(getClient(), req.session.accountUsername, {numGamesWon: 0, numGamesLost: 1, gameMode: 'solo'});
                }
                playerStats.stats.gameMode = 'solo';
                await updateStats(getClient(), playerStats.username, playerStats.stats);
            }
            stats.length = 0;
            res.status(200).send({error: "Stats goes for solo mode"});
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