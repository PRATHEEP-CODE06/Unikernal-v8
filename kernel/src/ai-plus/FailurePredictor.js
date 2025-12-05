const logger = require('../logger');

/**
 * AI-Plus ML-Based Failure Predictor
 * Predicts service failures before they occur
 */
class FailurePredictor {
    constructor() {
        this.history = new Map(); // serviceId -> metrics history
        this.predictions = new Map(); // serviceId -> prediction
        this.windowSize = 100; // samples
    }

    /**
     * Record metrics for analysis
     */
    recordMetrics(serviceId, metrics) {
        if (!this.history.has(serviceId)) {
            this.history.set(serviceId, []);
        }

        const history = this.history.get(serviceId);
        history.push({
            timestamp: Date.now(),
            errorRate: metrics.errorRate || 0,
            latency: metrics.latency || 0,
            load: metrics.load || 0
        });

        // Keep only recent samples
        if (history.length > this.windowSize) {
            history.shift();
        }
    }

    /**
     * Predict failure probability
     */
    predict(serviceId) {
        const history = this.history.get(serviceId);

        if (!history || history.length < 10) {
            return { willFail: false, confidence: 0, timeToFailure: null };
        }

        // Simple ML: Detect trends
        const recent = history.slice(-10);
        const errorRateTrend = this.calculateTrend(recent.map(m => m.errorRate));
        const latencyTrend = this.calculateTrend(recent.map(m => m.latency));

        // Failure criteria
        const avgErrorRate = recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length;
        const avgLatency = recent.reduce((sum, m) => sum + m.latency, 0) / recent.length;

        const willFail = (
            errorRateTrend > 0.05 || // Error rate increasing
            avgErrorRate > 0.2 ||    // High error rate
            avgLatency > 1000        // High latency
        );

        const confidence = Math.min(
            (errorRateTrend * 10 + avgErrorRate + avgLatency / 1000) / 3,
            1.0
        );

        const timeToFailure = willFail ? this.estimateTimeToFailure(errorRateTrend) : null;

        const prediction = {
            serviceId,
            willFail,
            confidence: Math.round(confidence * 100) / 100,
            timeToFailure,
            reason: this.getFailureReason(errorRateTrend, avgErrorRate, avgLatency),
            timestamp: Date.now()
        };

        this.predictions.set(serviceId, prediction);

        if (willFail) {
            logger.warn(`[FailurePredictor] ${serviceId} predicted to fail in ${timeToFailure}ms (confidence: ${prediction.confidence})`);
        }

        return prediction;
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;

        // Simple linear regression slope
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    }

    estimateTimeToFailure(trend) {
        // Simple estimation: time until metric crosses threshold
        // In reality, this would use more sophisticated models
        return Math.max(300000, 600000 - trend * 100000); // 5-10 minutes
    }

    getFailureReason(errorTrend, avgError, avgLatency) {
        if (avgError > 0.2) return 'High error rate';
        if (errorTrend > 0.05) return 'Increasing errors';
        if (avgLatency > 1000) return 'High latency';
        return 'Unknown';
    }

    getPredictions() {
        return Array.from(this.predictions.values()).filter(p => p.willFail);
    }
}

module.exports = FailurePredictor;
