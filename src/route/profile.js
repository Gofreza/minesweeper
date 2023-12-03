const express = require('express');
const {verifyToken} = require("../miscFunction");
const {getClient} = require("../database/dbSetup");
const bcrypt = require("bcrypt");
const {changePasswordPG, getHashUserPG, deleteUserPG, deleteConnectionPG} = require("../database/dbAuth");
const router = express.Router();

router.post('/changePassword', verifyToken, async (req, res) => {
    const {currentPassword, newPassword, confirmPassword} = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        // Missing fields
        req.flash('error', 'Missing fields')
        return res.status(400).redirect('/profile');
    }

    const oldPassword = await getHashUserPG(getClient(), req.session.accountUsername);

    if (!oldPassword) {
        // User does not exist
        req.flash('error', 'User does not exist')
        return res.status(400).redirect('/profile');
    }

    if (!bcrypt.compareSync(currentPassword, oldPassword)) {
        // Incorrect password
        req.flash('error', 'Incorrect password')
        return res.status(400).redirect('/profile');
    }

    if (newPassword !== confirmPassword) {
        // Passwords do not match
        req.flash('error', 'Passwords do not match')
        return res.status(400).redirect('/profile');
    }

    const pgClient = getClient();
    const username = req.session.accountUsername;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await changePasswordPG(pgClient, username, hashedPassword);

    // Password changed successfully`
    req.flash('success', 'Password changed successfully')
    return res.status(200).redirect('/profile');
})

router.post('/deleteAccount', verifyToken, async (req, res) => {
    await deleteUserPG(getClient(), req.session.accountUsername);
    await deleteConnectionPG(getClient(), req.cookies.token);
    res.clearCookie('token');
    req.session.username = null;
    req.session.accountUsername = null;
    req.flash('success', 'Account deleted successfully')
    res.redirect('/');
})

module.exports = router;