const jwt = require("jsonwebtoken");
const authFunctions = require('./database/dbAuth');
const {getClient} = require("./database/dbSetup");

async function checkConnection(req, res, next) {
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token)
    if (token && isConnected) {
        next();
    } else {
        res.clearCookie('token');
    }
}

async function verifyToken(req, res, next) {
    const token = req.cookies.token;

    // Check if the token exists and isConnected
    if (!token) {
        return res.redirect('/');
    }

    try {
        const isConnected = await authFunctions.isConnectedPG(getClient(), token);

        if (!isConnected) {
            return res.redirect('/');
        }

        // Verify the token
        jwt.verify(token, process.env.SECRET_KEY_ADMIN, (err, decoded) => {
            if (err) {
                jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
                    if (err) {
                        // Token is invalid, redirect to '/'
                        return res.redirect('/');
                    }
                    // Token is valid, continue to the next middleware
                    //console.log('Decoded token data:', decoded);
                    next();
                });
            } else {
                // Token is valid, continue to the next middleware
                //console.log('Decoded token data:', decoded);
                next();
            }
        });
    } catch (error) {
        console.error('Error checking connection:', error);
        return res.redirect('/');
    }
}

function verifyTokenAdmin(req, res, next) {
    const token = req.cookies.token; // Extracting the token from the header
    //console.log('server token:', token, typeof token);

    if (!token) return res.sendStatus(403); // Forbidden

    jwt.verify(token, process.env.SECRET_KEY_ADMIN, (err, decoded) => {
        if (err) {
            console.error('Error verifying admin token:', err);
            return res.sendStatus(403); // Forbidden
        }
        //console.log('Decoded token data:', decoded);
        next();
    });
}

function isAdminFunction(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies.token; // Extracting the token from the header
        //console.log('server token:', token, typeof token);

        if (!token) return resolve(false);

        jwt.verify(token, process.env.SECRET_KEY_ADMIN, (err, decoded) => {
            if (err) {
                //console.error('Error verifying token:', err);
                resolve(false); // Forbidden
            } else {
                //console.log('Decoded token data:', decoded);
                resolve(true);
            }
        });
    });
}

async function isConnected(req, res, next) {
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token)
    if (token && isConnected) {
        next();
    } else {
        res.redirect('/');
    }
}

async function isNotConnected(req, res, next) {
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token)
    if (!isConnected) {
        next();
    } else {
        res.redirect('/');
    }
}

const basePoints = 30;

function calculatePoints(playerPosition, totalPlayersPosition) {

    // Calculate game level
    let totalPositions = 0;
    let totalPlayers = 0;
    for (const player of totalPlayersPosition) {
        totalPositions += player.position;
        totalPlayers++;
    }

    if (totalPositions === 0) {
        return basePoints;
    }

    const gameLevel = totalPositions / totalPlayersPosition.length;

    // Calculate percentiles
    const percentiles = {
        veryHigh: 0.1,
        high: 0.2,
        average: 0.5,
        low: 0.8
        // Add more percentiles as needed
    };

    // Calculate mean positions
    const playerMean = gameLevel / totalPlayersPosition.length;

    // Calculate percentiles
    const veryHighMean = gameLevel * percentiles.veryHigh;
    const highMean = gameLevel * percentiles.high;
    const lowerMean = gameLevel * percentiles.low;

    /*console.log("Total players:", totalPlayers);
    console.log("Player mean:", playerMean);
    console.log("Game level:", gameLevel);
    console.log("Very high mean:", veryHighMean);
    console.log("High mean:", highMean);
    console.log("Lower mean:", lowerMean);
     */

    // Calculate position percentage
    let positionPercentage;

    if (playerPosition < veryHighMean) {
        console.log("Player is way above average");
        positionPercentage = -5; // Adjust as needed for negative level bonus
    } else if (playerPosition < highMean) {
        console.log("Player is above average");
        positionPercentage = -1.5; // Adjust as needed for negative level bonus
    } else if (playerPosition > lowerMean) {
        console.log("Player is below average");
        positionPercentage = 0.5; // Adjust as needed for positive level bonus
    } else {
        console.log("Player is average");
        positionPercentage = 0.1; // No adjustment for average
    }

    // Calculate level bonus
    //console.log("Level bonus:", basePoints * positionPercentage * (0.1 * playerPosition));
    const levelBonus = basePoints * positionPercentage * (0.1 * playerPosition);

    // Calculate total points
    const totalPoints = basePoints + levelBonus ;

    return Math.round(totalPoints); // Round to the nearest whole number
}

function calculateLosePoints(playerPosition, totalPlayersPosition) {
    // Calculate game level
    let totalPositions = 0;
    let totalPlayers = 0;
    for (const player of totalPlayersPosition) {
        totalPositions += player.position;
        totalPlayers++;
    }

    if (totalPositions === 0) {
        return basePoints; // Base points for winning
    }

    const gameLevel = totalPositions / totalPlayersPosition.length;

    // Calculate percentiles
    const percentiles = {
        veryHigh: 0.1,
        high: 0.2,
        average: 0.5,
        low: 0.8
        // Add more percentiles as needed
    };

    // Calculate mean positions
    const playerMean = gameLevel / totalPlayersPosition.length;

    // Calculate percentiles
    const veryHighMean = gameLevel * percentiles.veryHigh;
    const highMean = gameLevel * percentiles.high;
    const lowerMean = gameLevel * percentiles.low;

    // Calculate position percentage
    let positionPercentage;

    if (playerPosition < veryHighMean) {
        console.log("Player is way above average");
        positionPercentage = 5; // Adjust as needed for positive level penalty
    } else if (playerPosition < highMean) {
        console.log("Player is above average");
        positionPercentage = 1.5; // Adjust as needed for positive level penalty
    } else if (playerPosition > lowerMean) {
        console.log("Player is below average");
        positionPercentage = -0.5; // Adjust as needed for negative level penalty
    } else {
        console.log("Player is average");
        positionPercentage = -0.1; // No adjustment for average
    }

    // Calculate level penalty (inverse of level bonus)
    const levelPenalty = basePoints * positionPercentage * (0.1 * playerPosition);

    // Calculate total points (penalty for losing)
    let totalPoints = basePoints + levelPenalty;

    // Ensure that points do not go negative
    const minPoints = 5; // Set your minimum value here
    totalPoints = Math.max(totalPoints, minPoints);

    return Math.round(totalPoints); // Round to the nearest whole number
}

const fs = require('fs');
const readline = require('readline');
const {join} = require("path");
const {verify} = require("jsonwebtoken");

async function getConnectedUsers() {
    const logFilePath = join(__dirname, '/logger/app.log');
    const connectedUsers = new Map();

    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const connectedMatch = line.match(/\[.*\] A User connected: (.+?)(?: \((\w+)\))?$/);
        const disconnectedMatch = line.match(/\[.*\] User disconnected: (.+)/);

        if (connectedMatch) {
            const userId = connectedMatch[1];
            let username;
            if (!connectedMatch[2]){
                username = "Anonymous";
            } else {
                username = connectedMatch[2];
            }
            connectedUsers.set(userId, { userId, username });
        } else if (disconnectedMatch) {
            connectedUsers.delete(disconnectedMatch[1]);
        }
    }

    return Array.from(connectedUsers.values());
}


module.exports = {
    verifyToken, verifyTokenAdmin, isAdminFunction, getConnectedUsers, isConnected, isNotConnected,
    checkConnection,
    calculatePoints, calculateLosePoints,
};