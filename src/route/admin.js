const express = require('express');
const router = express.Router();
const {verifyTokenAdmin, getConnectedUsers, isAdminFunction} = require("../miscFunction");
const authFunctions = require("../database/dbAuth");
const {getClient} = require("../database/dbSetup");

router.get('/adminDashboard', verifyTokenAdmin, async (req, res) => {
    const token = req.cookies.token;
    const isConnected = await authFunctions.isConnectedPG(getClient(), token);
    const isAdmin = await isAdminFunction(req);
    res.render('../view/page/adminDashboard.pug', {
        title: 'Admin Dashboard',
        showMenuBar: true,
        loggedIn: isConnected,
        admin: isAdmin,
    });
});

router.get('/api/getAllUsers', verifyTokenAdmin, async (req, res) => {
    const users = await getConnectedUsers()
    res.json(users);

});

module.exports = router;