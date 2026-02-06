const express = require('express');
const metricsController = require('./controllers/metricsController');

const router = express.Router();

router.get('/metrics/calculate', metricsController.calculate);
module.exports = router;