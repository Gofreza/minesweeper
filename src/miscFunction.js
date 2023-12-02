const jwt = require("jsonwebtoken");
function verifyTokenAdmin(req, res, next) {
    const token = req.cookies.token; // Extracting the token from the header
    //console.log('server token:', token, typeof token);

    jwt.verify(token, process.env.SECRET_KEY_ADMIN, (err, decoded) => {
        if (err) {
            console.error('Error verifying token:', err);
            return res.sendStatus(403); // Forbidden
        }
        //console.log('Decoded token data:', decoded);
        next();
    });
}

const fs = require('fs');
const readline = require('readline');
const {join} = require("path");

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
    verifyTokenAdmin, getConnectedUsers,
};