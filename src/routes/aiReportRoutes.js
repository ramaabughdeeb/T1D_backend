const express = require('express');
const router = express.Router();

const aiReportController = require('../controllers/aiReportController');

router.post('/analyze', aiReportController.analyzeGlucoseReport);

module.exports = router;