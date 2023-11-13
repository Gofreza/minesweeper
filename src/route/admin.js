const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const {verifyTokenAdmin, getConnectedUsers} = require("../miscFunction");

router.get('/adminDashboard', verifyTokenAdmin, (req, res) => {
    res.render('../view/page/adminDashboard.pug', {
        title: 'Admin Dashboard',
        showMenuBar: true,
    });
});

router.get('/api/getAllUsers', verifyTokenAdmin, async (req, res) => {
    const users = await getConnectedUsers()
    res.json(users);

});

module.exports = router;