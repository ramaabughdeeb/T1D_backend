const express = require('express');
const router = express.Router();

const glucoseController = require('../controllers/glucoseController');

router.post('/', glucoseController.addReading);

router.post(
  '/low-treatment/suggestions',
  glucoseController.getLowTreatmentSuggestions
);

router.get('/reading/:readingId', glucoseController.getReadingById);

router.put('/:readingId/low-treatment', glucoseController.saveLowTreatment);

router.get('/:userId', glucoseController.getReadingsByUser);

module.exports = router;