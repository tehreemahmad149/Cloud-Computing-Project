const mongoose = require('mongoose');
const logSchema = new mongoose.Schema({
    log: { type: String, required: true },
});


module.exports = mongoose.model('Log', logSchema);