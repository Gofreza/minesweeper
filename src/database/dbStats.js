
async function updateStats(pgClient, username, gameMode, stats) {
    try {
        const query = {
            name: "update-stats",
            text: `UPDATE stats SET numGamesPlayed = $3, numGamesWon = $4, numGamesLost = $5, numBombsDefused = $6, numBombsExploded = $7, numFlagsPlaced = $8, numCellsRevealed = $9, averageTime = $10, fastestTime = $11, longestTime = $12 WHERE username = $1 AND gameMode = $2`,
            values: [username, gameMode, stats.numGamesPlayed, stats.numGamesWon, stats.numGamesLost, stats.numBombsDefused, stats.numBombsExploded, stats.numFlagsPlaced, stats.numCellsRevealed, stats.averageTime, stats.fastestTime, stats.longestTime]
        };
        await pgClient.query(query);
    } catch (error) {
        console.error('Error occurred while updating stats:', error);
    }
}

module.exports = {
    updateStats,
}