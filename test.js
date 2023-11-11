const setupDatabase = require("./database/dbSetup");
const userFunctions = require('./database/dbUsers');

async function init() {
    try {
        const db = await setupDatabase();
        console.log("Database created socket.js");

        const results = await userFunctions.getResultsFromRoomName(db, "test");
        console.log("results:", results);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

init();
