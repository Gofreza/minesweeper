const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const app = express();
let port = process.env.PORT || 8080;

const http = require('http');
const server = http.createServer(app); // Use http.createServer to create a server

// *************************
// *** Middleware config ***
// *************************

app.set('view engine', 'pug');
// Set views folder
app.set('views', __dirname + '/views');
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// **********************
// *** Session config ***
// **********************

const sessionMiddleware = session({
    secret: '%Mb~nGw+Ql2W6KJS)zr=x@{fl4V3h?YuhGUJX4XJ9{"vnZn&+km^9]z3+}\'UQtV',
    resave: true,
    saveUninitialized: true
});
app.use(sessionMiddleware);
app.use(cookieParser());

// ***********************
// *** Database Set Up ***
// ***********************

const {setupDatabase, connectDatabase, disconnectDatabase, getClient} = require("./database/dbSetup");
const roomFunctions = require("./database/dbRoomData");
const {fillDatabase} = require("./database/dbFill");
const {fillDb} = require("./database/dbFill");
let pgClient = null;
/*let db;
setupDatabase()
    .then((database) => {
        db = database;
        console.log("Database created App.js");
        //return roomFunctions.deleteAllRoomData(db);
        return roomFunctions.deleteAllRoomDataPG(pgClient);
    })
    .then(() => {
        console.log("All room data deleted");
        console.log(db);
        return fillDatabase(db);
    })
    .then(() => {
        console.log("Database filled");

        // ********************
        // *** Route config ***
        // ********************

        //const authRoutes = require('./route/auth');
        const adminRoutes = require('./route/admin');
        const testRoutes = require('./route/global');
        const authRoutes = require('./route/auth');
        app.use(testRoutes, adminRoutes, authRoutes);

        // *********************
        // *** Socket config ***
        // *********************

        const configureSocket = require('./socket/socket');
        configureSocket(server, sessionMiddleware, app);
    })
    .catch(error => {
        console.error("Error setup db:", error.message);
    });

 */

connectDatabase()
    .then(() => {
        console.log("Connected to postgres database");
        return fillDb();
    })
    .then(() => {
        console.log("Database filled");
        pgClient = getClient();
        return roomFunctions.deleteAllRoomDataPG(pgClient);
    })
    .then(() => {

        // ********************
        // *** Route config ***
        // ********************

        //const authRoutes = require('./route/auth');
        const adminRoutes = require('./route/admin');
        const testRoutes = require('./route/global');
        const authRoutes = require('./route/auth');
        app.use(testRoutes, adminRoutes, authRoutes);

        // *********************
        // *** Socket config ***
        // *********************

        const configureSocket = require('./socket/socket');
        configureSocket(server, sessionMiddleware, app);

        // ********************
        // *** Start server ***
        // ********************

        server.listen(port, () => {
            console.log(`Server running at http://127.0.0.1:${port}/`);
        });
    })
    .catch(error => {
        console.error("Error connectdb:", error.message);
    });

process.on("exit", function () {
    disconnectDatabase()
})