const express = require('express');
const router = express.Router();

router.post('/api/deconnect', (req, res) => {
    const roomName = req.body.roomName;
    const username = req.body.username;
    console.log("Deconnection request from", username, "in room", roomName);
    res.json({success: true});
})

router.post('/api/stats', (req, res) => {
    const body = req.body;
    console.log("Stats:",body);
})

module.exports = router;