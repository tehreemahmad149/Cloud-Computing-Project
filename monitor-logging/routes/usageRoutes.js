const express = require('express');
const { trackUsage} = require('../controllers/usageControllers');
const { logRequest} = require('../controllers/logController');
const validateToken = require('../middleware/auth');
const router = express.Router();

// router.post('/track', trackUsage);
// router.post('/log', logRequest);

router.post('/track', validateToken, trackUsage);  // Protect this route
router.post('/log', validateToken, logRequest); 

module.exports = router;