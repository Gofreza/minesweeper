const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logFilePath) {
        this.logFilePath = logFilePath || path.join(__dirname, 'app.log');
    }

    resetLogFile() {
        // Overwrite the log file to reset its content
        fs.writeFileSync(this.logFilePath, '');
        console.log('Log file reset.');
    }

    log(message) {
        const formattedMessage = `[${new Date().toISOString()}] ${message}`;
        console.log(formattedMessage);

        // Write to the log file
        fs.appendFile(this.logFilePath, formattedMessage + '\n', (err) => {
            if (err) {
                console.error('Error writing to log file:', err);
            }
        });
    }
}

module.exports = Logger;

