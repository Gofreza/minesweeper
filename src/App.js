const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const port = 8080;

const http = require('http');
const server = http.createServer(app); // Use http.createServer to create a server

require('dotenv').config();

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

// *********************
// *** Socket config ***
// *********************

const configureSocket = require('./socket/socket');
configureSocket(server, sessionMiddleware, app);

// ********************
// *** Route config ***
// ********************

const authRoutes = require('./route/auth');
const adminRoutes = require('./route/admin');
const testRoutes = require('./route/global');
app.use(authRoutes, testRoutes, adminRoutes);

// ********************
// *** Start server ***
// ********************

server.listen(port, () => {
    console.log(`Server running at http://0.0.0.0:${port}/`);
});