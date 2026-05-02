const express = require("express");
const router = express.Router();

const aiActivityController = require("../controllers/aiActivityController");

router.post("/analyze", aiActivityController.analyzeActivityPlan);

module.exports = router;