const express = require('express');
const router = express.Router();

const waterController = require('../controllers/waterController');

router.get('/:userId/today', waterController.getTodayWater);
router.post('/add', waterController.addWater);

module.exports = router;