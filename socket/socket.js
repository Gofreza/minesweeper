// Server side socket session configuration
const { Server } = require("socket.io");
const sharedSession = require('express-socket.io-session');
// Database
const setupDatabase = require('../database/dbSetup');
const roomFunctions = require('../database/dbRoom');
const userFunctions = require('../database/dbUsers');
let db;
setupDatabase()
    .then((database) => {
        db = database;
        console.log("Database created socket.js");
    });

// Logger
const Logger = require('../logger/logger');
const logger = new Logger();
logger.resetLogFile();

// Export a function that takes the server instance and session middleware
module.exports = function configureSocket(server, sessionMiddleware) {
    const io = new Server(server, { connectionStateRecovery: {} });
    io.use(sharedSession(sessionMiddleware, {
        autoSave: true
    }));

    //Socket
    let rooms = {};

    io.on('connection', (socket) => {
        //console.log('a user connected:', socket.id);
        //console.log("Socket Session:",socket.handshake.session);
        //console.log("Socket Session ID:",socket.handshake.session.id);
        logger.log('A User connected: ' + socket.handshake.session.id);

        socket.on('createRoom', (data) => {
            const roomName = data.inputValue;
            const username = data.inputName;
            socket.join(roomName);
            socket.handshake.session.room = roomName;
            socket.handshake.session.username = username;

            rooms[roomName] = { users: [username], slot: 1};
            io.to(roomName).emit('roomData', {
                roomName: roomName,
                users: rooms[roomName].users,
                username: username,
            });
            //console.log(`${username} created room ${roomName} and join !`);
            logger.log(`${socket.handshake.session.id} : ${username} created room ${roomName} and join !`);
        });

        socket.on('joinRoom', (data) => {
            const roomName = data.inputValue;
            const username = data.inputName;
            if (rooms[roomName] && rooms[roomName].slot < 2) {
                socket.join(roomName);
                socket.handshake.session.room = roomName;
                socket.handshake.session.username = username;
                rooms[roomName].users.push(username);
                rooms[roomName].slot+=1;
                io.to(roomName).emit('roomData', {
                    roomName: roomName,
                    users: rooms[roomName].users,
                    username: username,
                });
            }

            //console.log(`${username} joined room ${roomName}`);
            logger.log(`${socket.handshake.session.id} : ${username} joined room ${roomName}`)
        });

        socket.on('quitRoom', async (data) => {
            const roomName = data.roomName;
            const username = data.username;
            if (rooms[roomName]) {
                socket.leave(roomName);
                socket.handshake.session.room = undefined;
                socket.handshake.session.username = undefined;
                rooms[roomName].users = rooms[roomName].users.filter((user) => {
                    return user !== username;
                });
                rooms[roomName].slot -= 1;
                if (rooms[roomName].slot === 0) {
                    delete rooms[roomName];
                    await roomFunctions.deleteRoomData(db, roomName);
                } else {
                    io.to(roomName).emit('roomData', {
                        roomName: roomName,
                        users: rooms[roomName].users,
                    });
                }
            }
            //console.log(`${username} quit room ${roomName}`);
            logger.log(`${socket.handshake.session.id} : ${username} quit room ${roomName}`)
        } );

        // Auto reconnect
        if (socket.handshake.session.room) {
            const roomName = socket.handshake.session.room;
            //const username = socket.handshake.session.username;
            socket.join(roomName);

            io.to(roomName).emit('roomData', {
                roomName: roomName,
                users: rooms[roomName].users,
                username: socket.handshake.session.username,
            });
        }

        socket.on('getRooms', () => {
            const roomData = Object.keys(rooms).map((roomName) => {
                return { roomName: roomName, users: rooms[roomName].users, slot: rooms[roomName].slot };
            });
            socket.emit('roomList', roomData);
        });

        socket.on('disconnect', () => {
            //console.log(`User disconnected: ${socket.id}`);
            logger.log(`User disconnected: ${socket.handshake.session.id}`);
        });

        // Versus

        socket.on('startVersusGame', async (data) => {
            const roomName = data.roomName;
            const rows = 10;
            const cols = 10;
            console.log("Exist ?:",!await roomFunctions.checkIfRoomExists(db, roomName));
            if (!await roomFunctions.checkIfRoomExists(db, roomName)) {
                await roomFunctions.setRoomData(db, roomName, rows, cols);
            }

            io.to(roomName).emit('receiveVersusGame', {
                rows: rows,
                cols: cols,
            });
            logger.log(`${socket.handshake.session.id} : ${socket.handshake.session.username} started a versus game in room ${roomName}`)
        });

        socket.on('gameFinished', async (data) => {
            const result = data.result;
            const roomName = data.roomName;
            const username = data.username;
            const playerNumber = rooms[roomName].slot
            console.log("Game finished server side in room " + roomName + " with result " + username + " : " + result + " !");
            logger.log(`${socket.handshake.session.id} : ${socket.handshake.session.username} finished his game in room ${roomName} with result ${result}`)
            // Put result in the db
            await userFunctions.addUserScore(db, roomName, username, result);
            // Check if there are the two results
            // If there are send the result to the two players io.emit[roomName].emit('versusGameResult', result)
            if (await userFunctions.checkResults(db, roomName, playerNumber)) {
                //console.log("Game as ended everywhere !");
                logger.log(`${roomName} : Game as ended everywhere !`);
                const results = await userFunctions.getHighestScoreFromRoomName(db, roomName);
                console.log(results);
                const allResults = await userFunctions.getResultsFromRoomName(db, roomName);
                console.log("Allresults:",allResults);
                io.to(roomName).emit('versusGameResult', {result:results.score, winner:results.username, results:allResults});
            }
        })
    });
};
