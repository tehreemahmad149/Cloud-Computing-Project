const express = require('express');
const { trackUsage} = require('../controllers/usageControllers');
const { logRequest} = require('../controllers/logController');
const router = express.Router();

router.post('/track', trackUsage);
router.post('/log', logRequest);

module.exports = router;