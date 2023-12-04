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
};