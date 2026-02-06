const { calculateMetrics } = require('../services/metricsService');

function calculate(req, res) {
    try {
        const result = calculateMetrics(req.body);
        return res.json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message,
        details: error.details || null, })
    }
}

module.exports = {
    calculate,
};