const Usage = require('../models/usage');
const User = require('../models/users');
const Log = require('../models/logs');  // Adjust the path as necessary
const AUTH_SERVICE_URL = "http://localhost:5000/api/users";

// Create a new log entry
const createLog = async (logMessage) => {
    console.log(`Create log opened`);
    const logEntry = new Log({
        log: logMessage,
    });
    try {
        await logEntry.save();
        console.log(`Log saved: ${logMessage}`);
    } catch (err) {
        console.error('Error saving log:', err);
    }
};


// New endpoint to create a log directly
const logRequest = async (req, res) => {
    const { logMessage } = req.body;
    if (!logMessage) {
        return res.status(400).json({ message: 'Log message is required.' });
    }
    try {
        await createLog(logMessage);
        res.status(200).json({ message: 'Log saved successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to save log.', error: err.message });
    }
};

module.exports = { logRequest};
