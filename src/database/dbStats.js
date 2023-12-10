/**
 * Updates the stats for a user in the database.
 * @param pgClient - The database client
 * @param username - The username of the user
 * @param stats - The stats to update in json format
 * @returns {Promise<void>} - A promise that resolves when the stats have been updated
 */
async function updateStats(pgClient, username, stats) {
    try {
        // Retrieve the existing stats from the database
        const existingStatsQuery = {
            name: "get-existing-stats",
            text: `
            SELECT stats.column1, stats.column2, ..., users.columnA, users.columnB, ...
            FROM stats
            INNER JOIN users ON stats.user = users.id
            WHERE users.username = $1 AND stats.gameMode = $2`,
            values: [username, stats.gameMode]
        };


        const existingStatsResult = await pgClient.query(existingStatsQuery);
        const existingStats = existingStatsResult.rows[0];

        // If there are existing stats, add the new values to them
        if (existingStats) {
            stats.numGamesPlayed += existingStats.numgamesplayed || 0;
            stats.numGamesWon += existingStats.numgameswon || 0;
            stats.numGamesLost += existingStats.numgameslost || 0;
            stats.numBombsDefused += existingStats.numbombsdefused || 0;
            stats.numBombsExploded += existingStats.numbombsexploded || 0;
            stats.numFlagsPlaced += existingStats.numflagsplaced || 0;
            stats.numCellsRevealed += existingStats.numcellsrevealed || 0;

            // Handle time-related statistics
            // TODO: Handle average time properly
            // Doesn't need to pass three time, only one is enough
            // Just need to do the math after
            if (existingStats.averageTime) {
                stats.averageTime = (stats.averageTime * stats.numGamesPlayed + existingStats.averageTime * existingStats.numGamesPlayed) / (stats.numGamesPlayed + existingStats.numGamesPlayed);
            }

            stats.fastestTime = Math.min(stats.fastestTime, existingStats.fastestTime || Infinity);
            stats.longestTime = Math.max(stats.longestTime, existingStats.longestTime || 0);
        }

        // Update the stats in the database
        const updateQuery = {
            name: "update-stats",
            text: `UPDATE stats SET numGamesPlayed = $3, numGamesWon = $4, numGamesLost = $5, numBombsDefused = $6, numBombsExploded = $7, numFlagsPlaced = $8, numCellsRevealed = $9, averageTime = $10, fastestTime = $11, longestTime = $12 
             WHERE "user" = (SELECT id FROM users WHERE username = $1) 
               AND gameMode = $2`,
            values: [
                username, stats.gameMode,
                stats.numGamesPlayed, stats.numGamesWon, stats.numGamesLost,
                stats.numBombsDefused, stats.numBombsExploded, stats.numFlagsPlaced,
                stats.numCellsRevealed, stats.averageTime, stats.fastestTime, stats.longestTime
            ]
        };

        await pgClient.query(updateQuery);
    } catch (error) {
        console.error('Error occurred while updating stats:', error);
    }
}

/**
 * Gets the stats for a user from the database.
 * @param pgClient - The database client
 * @param username - The username of the user
 * @returns {Promise<*>} - A promise that resolves with the stats
 */
async function getStats(pgClient, username) {
    try {
        const query = {
            name: "get-stats",
            text: `
            SELECT stats.*
            FROM stats
            INNER JOIN users ON stats.user = users.id
            WHERE users.username = $1`,
            values: [username]
        };

        const result = await pgClient.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error occurred while getting stats:', error);
    }
}

/**
 * Updates the winning stats for a user in the database.
 * @param pgClient - The database client
 * @param username - The username of the user
 * @param stats - The stats to update in json format
 *                numGamesWon and numGamesLost are the only stats that are updated
 * @returns {Promise<void>} - A promise that resolves when the stats have been updated
 */
async function updateWinningStats(pgClient, username, stats) {
    try {
        const query = {
            name: "update-winning-stats",
            text: `UPDATE stats SET numgameswon = numgameswon + $1, numgameslost = numgameslost + $2 
                WHERE "user" = (SELECT id FROM users WHERE username = $3) 
                AND gamemode = $4`,
            values: [stats.numGamesWon, stats.numGamesLost, username, stats.gameMode]
        }
        await pgClient.query(query);
    } catch (error) {
        console.error('Error occurred while updating winning stats:', error);
    }
}

module.exports = {
    updateStats, getStats, updateWinningStats,
}