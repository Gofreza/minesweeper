const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const port = 8000;

const http = require('http');
const server = http.createServer(app); // Use http.createServer to create a server

// *************************
// *** Middleware config ***
// *************************

app.set('view engine', 'pug');
// Set views folder
app.set('views', __dirname + '/views');
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
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

// *********************
// *** Socket config ***
// *********************

const configureSocket = require('./socket/socket');
configureSocket(server, sessionMiddleware);

// ********************
// *** Route config ***
// ********************

const testRoutes = require('./route/global');
app.use(testRoutes);

// ********************
// *** Start server ***
// ********************

server.listen(port, () => {
    console.log(`Server running at http://:${port}/`);
});