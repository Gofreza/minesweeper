// Server side socket session configuration
const { Server } = require("socket.io");
const sharedSession = require('express-socket.io-session');
// Database
const {getDatabase, getClient} = require('../database/dbSetup');
const roomFunctions = require('../database/dbRoomData');
const userFunctions = require('../database/dbRooms');
let pgClient = getClient();
let db;
getDatabase().then((database) => {
    db = database;
    console.log("Database link socket.js");
})

// Logger
const Logger = require('../logger/logger');
const {verifyTokenAdmin} = require("../miscFunction");
const logger = new Logger();
logger.resetLogFile();

function generateBombCoordinates(length, width, numBombs) {
    const bombCoordinates = [];

    while (bombCoordinates.length < numBombs) {
        const newRow = Math.floor(Math.random() * length);
        const newCol = Math.floor(Math.random() * width);

        // Ensure the generated coordinate is unique
        if (!bombCoordinates.some(coord => coord.row === newRow && coord.col === newCol)) {
            bombCoordinates.push({ row: newRow, col: newCol });
        }
    }

    return bombCoordinates;
}

// Export a function that takes the server instance and session middleware
module.exports = function configureSocket(server, sessionMiddleware, app) {
    const io = new Server(server, { connectionStateRecovery: {} });
    io.use(sharedSession(sessionMiddleware, {
        autoSave: true
    }));

    //Socket
    let rooms = {};
    let connectedSockets = [];

    io.on('connection', (socket) => {
        logger.log('A User connected: ' + socket.handshake.session.id + (socket.handshake.session.username ? ' (' + socket.handshake.session.username + ')' : ''));
        connectedSockets.push(socket);

        socket.on('createRoom', (data) => {
            let roomName = data.inputValue;
            let username = data.inputName;

            const maxCharacterLimit = 30;
            if (roomName.length > maxCharacterLimit) {
                roomName = roomName.substring(0, maxCharacterLimit); // Trim the message
            }
            if (username.length > maxCharacterLimit) {
                username = username.substring(0, maxCharacterLimit); // Trim the message
            }

            if (!rooms[roomName]) {
                socket.join(roomName);
                socket.handshake.session.room = roomName;
                socket.handshake.session.username = username;

                rooms[roomName] = {users: [username], slot: 1, started: false, usersReady: 0};
                io.to(roomName).emit('roomData', {
                    roomName: roomName,
                    users: rooms[roomName].users,
                    username: username,
                    usersReady: rooms[roomName].usersReady,
                });

                console.log(rooms)
                logger.log(`${socket.handshake.session.id} : ${username} created room ${roomName} and join !`);
            }
        });

        socket.on('joinRoom', (data) => {
            let roomName = data.inputValue;
            let username = data.inputName;

            const maxCharacterLimit = 30;
            if (roomName.length > maxCharacterLimit) {
                roomName = roomName.substring(0, maxCharacterLimit); // Trim the message
            }
            if (username.length > maxCharacterLimit) {
                username = username.substring(0, maxCharacterLimit); // Trim the message
            }

            let dataReturn;
            if (rooms[roomName] /*&& rooms[roomName].slot < 2*/ && !rooms[roomName].started) {
                socket.join(roomName);
                socket.handshake.session.room = roomName;
                socket.handshake.session.username = username;
                rooms[roomName].users.push(username);
                rooms[roomName].slot += 1;
                console.log("Join:", rooms[roomName].usersReady)
                dataReturn = {
                    roomName: roomName,
                    users: rooms[roomName].users,
                    username: username,
                    usersReady: rooms[roomName].usersReady,
                }
                console.log("Server data:", dataReturn)
                io.to(roomName).emit('roomData', dataReturn);
                logger.log(`${socket.handshake.session.id} : ${username} joined room ${roomName}`)
            }
        });

        socket.on('quitRoom', async (data) => {
            const roomName = data.roomName;
            const username = data.username;
            let usersReady = 0;

            console.log("Quit:", rooms[roomName].usersReady)

            if (rooms[roomName]) {
                socket.leave(roomName);
                socket.handshake.session.room = undefined;

                usersReady = rooms[roomName].usersReady;

                rooms[roomName].usersReady !== 0 ? rooms[roomName].usersReady -= 1 : rooms[roomName].usersReady = 0;

                rooms[roomName].users = rooms[roomName].users.filter((user) => {
                    return user !== username;
                });

                rooms[roomName].slot -= 1;

                if (rooms[roomName].slot === 0) {
                    logger.log(`Room deleted : ${roomName}`);
                    delete rooms[roomName];
                    //await roomFunctions.deleteRoomData(db, roomName);
                    await roomFunctions.deleteRoomDataPG(pgClient, roomName);
                } else {
                    io.to(roomName).emit('roomData', {
                        roomName: roomName,
                        users: rooms[roomName].users
                    });
                    // Send 'notReadyReceive' event after updating usersReady
                    if (usersReady > 0) {
                        io.to(roomName).emit('notReadyReceive');
                    }
                }
            }

            //console.log(rooms)
            logger.log(`${socket.handshake.session.id} : ${username} quit room ${roomName}`);
        });


        // Auto reconnect
        if (socket.handshake.session.room) {
            const roomName = socket.handshake.session.room;

            socket.join(roomName);

            if (rooms[roomName]) {
                io.to(roomName).emit('roomData', {
                    roomName: roomName,
                    users: rooms[roomName].users,
                    username: socket.handshake.session.username,
                    usersReady: rooms[roomName].usersReady,
                });
            }

        }

        socket.on('getRooms', () => {
            const roomData = Object.keys(rooms).map((roomName) => {
                return { roomName: roomName, users: rooms[roomName].users, slot: rooms[roomName].slot };
            });
            socket.emit('roomList', roomData);
        });

        socket.on('disconnect', async (data) => {
            //console.log(`User disconnected: ${socket.id} reason: ${data}`);
            logger.log('User disconnected: ' + socket.handshake.session.id + (socket.handshake.session.username ? ' (' + socket.handshake.session.username + ')' : ''));
            connectedSockets = connectedSockets.filter(s => s !== socket);
        });

        // Versus

        socket.on('startVersusGame', async (data) => {
            const roomName = data.roomName;
            const rows = data.rows ? data.rows : 10;
            const cols = data.cols ? data.cols : 10;
            /*if (!await roomFunctions.checkIfRoomExists(db, roomName)) {
                await roomFunctions.setRoomData(db, roomName, rows, cols);
            }*/
            if (!await roomFunctions.checkIfRoomExistsPG(pgClient, roomName)) {
                await roomFunctions.setRoomDataPG(pgClient, roomName, rows, cols);
            }
            const numBombs = Math.floor(rows * cols * parseFloat(process.env.BOMB_DENSITY_NORMAL));
            const bombCoordinates = generateBombCoordinates(rows, cols, numBombs);

            rooms[roomName].started = true;

            io.to(roomName).emit('receiveVersusGame', {
                numBombs: numBombs,
                bombCoordinates: bombCoordinates,
                rows: rows,
                cols: cols,
            });
            logger.log(`${socket.handshake.session.id} : ${socket.handshake.session.username} started a versus game in room ${roomName}`)
        });

        socket.on('gameFinished', async (data) => {
            const result = data.result;
            const roomName = data.roomName;
            const username = data.username;
            const playerNumber = rooms[roomName].users.length;
            //console.log("Game finished server side in room " + roomName + " with result " + username + " : " + result + " !");
            logger.log(`${socket.handshake.session.id} : ${socket.handshake.session.username} finished his game in room ${roomName} with result ${result}`)
            // Put result in the db
            //await userFunctions.addUserScore(db, roomName, username, result);
            await userFunctions.addUserScorePG(pgClient, roomName, username, result);
            // Check if there are the two results
            // If there are send the result to the two players io.emit[roomName].emit('versusGameResult', result)
            const isGameFinished = await userFunctions.checkResultsPG(pgClient, roomName, playerNumber);
            console.log("Game as ended everywhere !", isGameFinished);
            if (isGameFinished) {
            //if (await userFunctions.checkResults(db, roomName, playerNumber)) {
                //console.log("Game as ended everywhere !");
                logger.log(`${roomName} : Game as ended everywhere !`);
                //const results = await userFunctions.getHighestScoreFromRoomName(db, roomName);
                //const allResults = await userFunctions.getResultsFromRoomName(db, roomName);
                const results = await userFunctions.getHighestScoreFromRoomNamePG(pgClient, roomName);
                const allResults = await userFunctions.getResultsFromRoomNamePG(pgClient, roomName);
                io.to(roomName).emit('versusGameResult', {result:results.score, winner:results.username, results:allResults});
                //await userFunctions.deleteAllUserScores(db, roomName);
                await userFunctions.deleteAllUserScoresPG(pgClient, roomName);
                rooms[roomName].started = false;
            }
        })

        socket.on('ready' , (data) => {
            //console.log('ready', data.username)
            rooms[data.roomName].usersReady += 1
            console.log("Ready:",rooms[data.roomName].usersReady)
            io.to(data.roomName).emit('readyReceive' , data);
        })

        socket.on('notReady' , (data) => {
            //console.log('notReady', data.username)
            rooms[data.roomName].usersReady -= 1;
            console.log("Not ready:",rooms[data.roomName].usersReady)
            io.to(data.roomName).emit('notReadyReceive' , data);
        })

        // Chat

        socket.on('sendMessage', (data) => {
            const roomName = data.roomName;
            const username = data.username;
            const message = data.message;
            io.to(roomName).emit('receiveMessage', {
                username: username,
                message: message,
            });
        });

        // Other

        app.post('/api/disconnect', async (req, res) => {
            const roomName = req.body.roomName;
            const username = req.body.username;
            if (rooms[roomName]) {
                socket.leave(roomName);
                socket.handshake.session.room = undefined;
                rooms[roomName].users = rooms[roomName].users.filter((user) => {
                    return user !== username;
                });
                rooms[roomName].slot -= 1;
                if (rooms[roomName].slot === 0) {
                    delete rooms[roomName];
                    //await roomFunctions.deleteRoomData(db, roomName);
                    await roomFunctions.deleteRoomDataPG(pgClient, roomName);
                } else {
                    io.to(roomName).emit('roomData', {
                        roomName: roomName,
                        users: rooms[roomName].users
                    });
                    console.log("User disconnected from room", roomName, "userReady:", rooms[roomName].usersReady ? rooms[roomName].usersReady : 0);
                    if (rooms[roomName].usersReady > 0) {
                        io.to(roomName).emit('notReadyReceive');
                    }
                    if (rooms[roomName]) {
                        rooms[roomName].usersReady ? rooms[roomName].usersReady -= 1 : rooms[roomName].usersReady = 0;
                    }
                    socket.handshake.session.room = undefined;
                }
            }
            res.redirect('/');
        })

        app.post('/emit-test-event/:roomName', (req, res) => {
            const { roomName } = req.params;

            io.to(roomName).emit(roomName, 'message from server');

            res.status(200).json({ success: true });
        });

        app.post('/forceDisconnect', verifyTokenAdmin, (req, res) => {
            console.log('forceDisconnect');

            // Disconnect all connected sockets
            connectedSockets.forEach(socket => socket.disconnect());


            res.status(200).json({ success: true });
        });
    });
};
