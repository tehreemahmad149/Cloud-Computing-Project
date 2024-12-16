const Usage = require('../models/usage');
const log = require('../models/logs');
const User = require('../models/users');
const AUTH_SERVICE_URL = "http://localhost:5000/api/users";
const axios = require('axios');

const sendLogRequest = async (logMessage) => {
    try {
        const response = await axios.post('http://localhost:5000/log', {
            logMessage,
        });
        console.log('Log saved successfully:', response.data);
    } catch (error) {
        console.error('Error sending log request:', error.response ? error.response.data : error.message);
    }
};

const THRESHOLD_MB = 100 * 1024 * 1024;

// Create a log entry
// const createLog = async (logMessage) => {
//     console.log(`Create log opened`);
//     const logEntry = new Log({
//         log: logMessage,
//     });
//     try {
//         await logEntry.save();
//         console.log(`Log saved: ${logMessage}`);
//     } catch (err) {
//         console.error('Error saving log:', err);
//     }
// };

// Track data usage
const trackUsage = async (req, res) => {
    const {type, volume} = req.body;
    //const {firebaseUserId, type, volume} = req.body; // Type: 'upload' or 'delete' or 'replace'
    const firebaseUserId = req.user.firebaseUserId;//make this a comment if firebase in req.body

    // Validate input
    if (!firebaseUserId || !type || !volume || typeof volume !== 'number') {
        return res.status(400).json({ allows: false,message: 'Invalid input: firebaseUserId, type, and volume are required.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight

    try {
        // Fetch the user from the users collection
        //AUTH
        const user = await User.findOne({ firebaseUserId });
        if (!user) {
            return res.status(404).json({ allows: false, message: 'User not found.' });
        }

        // Find today's usage log for the user
        let usage = await Usage.findOne({
            firebaseUserId,
            date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }, // Match today's date
        });

        // If no usage record exists for today, create a new one
        if (!usage) {
            usage = new Usage({
                firebaseUserId,
                date: today,
                dailyBandwidthUsed: 0,
            });
            await usage.save();
            sendLogRequest(`Usage tracking started for ${firebaseUserId} on ${new Date().toLocaleString()}`);
                
        }
        // Calculate temporary bandwidth for threshold validation
        const tempBandwidth = user.dailyBandwidthUsed + volume;

        if (type === 'upload') {
            if (tempBandwidth > THRESHOLD_MB) {
                sendLogRequest(`Upload blocked: Exceeded daily bandwidth limit. Current: ${usage.dailyBandwidthUsed}MB. ${firebaseUserId}`);
                return res.status(403).json({ allows: false,message: 'Daily bandwidth exceeded.' });
            }
            usage.dailyBandwidthUsed += volume;
            user.dailyBandwidthUsed += volume;
            sendLogRequest(`Uploaded ${volume}MB by ${firebaseUserId} on ${new Date().toLocaleString()}`);
            // Save both user and usage log
            await usage.save();
            await user.save();

            return res.json({ allows: true,message: 'Allowed.' });
        } else if (type === 'delete') {
            if (tempBandwidth > THRESHOLD_MB) {
                sendLogRequest(`Delete blocked: Exceeded daily bandwidth limit. Current: ${usage.dailyBandwidthUsed}MB. ${firebaseUserId}`);
                return res.status(403).json({ allows: false,message: 'Daily bandwidth exceeded.' });
            }
            usage.dailyBandwidthUsed += volume;
            user.dailyBandwidthUsed += volume;
            sendLogRequest(`Deleted ${volume}MB by ${firebaseUserId} on ${new Date().toLocaleString()}`);
            // Save both user and usage log
            await usage.save();
            await user.save();

            return res.json({ allows: true,message: 'Allowed.' });
        
        }else if (type === 'replace') {
            if (tempBandwidth > THRESHOLD_MB) {
                sendLogRequest(`Replace blocked: Exceeded daily bandwidth limit. Current: ${usage.dailyBandwidthUsed}MB. ${firebaseUserId}`);
                return res.status(403).json({ allows: false,message: 'Daily bandwidth exceeded.' });
            }
            usage.dailyBandwidthUsed += volume;
            user.dailyBandwidthUsed += volume;
            sendLogRequest(`Replaced ${volume}MB by ${firebaseUserId} on ${new Date().toLocaleString()}`);
            // Save both user and usage log
            await usage.save();
            await user.save();

            return res.json({ allows: true,message: 'Allowed.' });
        } 
        else {
            sendLogRequest(`Video Delete/Replace/Upload Request denied. Invalid request type: must be "upload" or "delete" or "replace".`);
            return res.json({allows: true, message: 'Invalid type: must be "upload" or "delete" or "replace".' });
        }
        
            
        res.status(200).json({ message: 'Usage tracked successfully.', usage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to track usage.', error: err.message });
    }
};
module.exports = { trackUsage };


