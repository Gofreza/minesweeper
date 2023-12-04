const {getClient} = require("./dbSetup");

/**
 * Inserts or updates a score into the leaderboard table.
 * @param pgClient - The database client
 * @param accountUsername - The username of the account
 * @param score - The score to insert or update
 * @returns {Promise<void>} - A promise that resolves when the score has been inserted or updated
 */
async function insertLeaderboardScore(pgClient, accountUsername, score) {
    try {
        let query = {
            name: 'check-leaderboard-score-exists',
            text: `
            SELECT * FROM leaderboard
            WHERE username = $1;
            `,
            values: [accountUsername]
        };
        const res = await pgClient.query(query);
        if (res.rows.length > 0) {
            query = {
                name: 'update-leaderboard-score',
                text: `
                UPDATE leaderboard
                SET score = GREATEST(score + $1, 0)
                WHERE username = $2;
                `,
                values: [score, accountUsername]
            };
            await pgClient.query(query);
            console.log("Updated leaderboard score")
        } else {
            query = {
                name: 'insert-leaderboard-score',
                text: `
                    INSERT INTO leaderboard (username, score, position) VALUES ($1, $2, $3);
                `,
                values: [accountUsername, score, 0]
            };
            await pgClient.query(query);
            console.log("Inserted leaderboard score")
        }
    } catch (error) {
        console.error('Error occurred while inserting leaderboard score:', error);
    }
}

/**
 * Gets the top scores from the leaderboard table.
 * @param pgClient - The database client
 * @returns {Promise<*>} - A promise that resolves with the top scores
 */
async function getTopScores(pgClient) {
    try {
        const query = {
            name: 'get-top-scores',
            text: `
                SELECT * FROM leaderboard
                ORDER BY score DESC
                LIMIT 10;
            `
        };

        const res = await pgClient.query(query);
        return res.rows;
    } catch (error) {
        console.error('Error occurred while getting top scores:', error);
    }
}

/**
 * Updates the position of the player in the leaderboard table.
 * @param pgClient - The database client
 * @returns {Promise<void>} - A promise that resolves when the position has been updated
 */
async function updatePosition(pgClient) {
    try {
        let query =
        {
            name: 'get-all-scores',
            text: `
                SELECT username, score, RANK() OVER (ORDER BY score DESC) AS position
                FROM leaderboard;
            `
        };
        const res = await pgClient.query(query);
        for (const row of res.rows) {
            query = {
                name: 'update-position',
                text: `
                    UPDATE leaderboard
                    SET position = $1
                    WHERE username = $2;
                `,
                values: [row.position, row.username]
            };
            await pgClient.query(query);
        }

    } catch (error) {
        console.error('Error occurred while updating position:', error);
    }
}

/**
 * Gets the position of the player in the leaderboard table.
 * @param pgClient - The database client
 * @param allPlayers - The username of the account
 * @returns {Promise<*>} - A promise that resolves with the position of the player
 */
async function getPositionsOfPlayers(pgClient, allPlayers) {
    try {
        const query = {
            name: 'get-positions',
            text: `
                SELECT username, COALESCE(position, 0) AS position
                FROM leaderboard
                WHERE username = ANY($1);
            `,
            values: [allPlayers]
        };

        const res = await pgClient.query(query);

        // Create a map to store positions, initializing all positions to 0
        const positionsMap = new Map(allPlayers.map(player => [player, 0]));

        // Update positions based on the query results
        res.rows.forEach(row => {
            positionsMap.set(row.username, row.position);
        });

        // Convert the map to an array of objects
        return Array.from(positionsMap, ([username, position]) => ({username, position}));
    } catch (error) {
        console.error('Error occurred while getting positions:', error);
        throw error;
    }
}

module.exports = {
    insertLeaderboardScore, getTopScores, updatePosition, getPositionsOfPlayers,
}