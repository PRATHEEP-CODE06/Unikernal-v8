const logger = require("./logger");

class IntelligenceEngine {
    constructor(smartRouter) {
        this.smartRouter = smartRouter;
        this.interval = null;
    }

    start() {
        logger.info("[Intelligence] AI Engine Started (God-Mode Active)");
        // Run analysis every 30 seconds
        this.interval = setInterval(() => this.analyze(), 30000);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
    }

    analyze() {
        if (!this.smartRouter || !this.smartRouter.metrics) {
            return;
        }

        logger.debug("[Intelligence] Analyzing system health...");

        for (const [serviceId, metrics] of this.smartRouter.metrics.entries()) {
            if (!metrics) continue;

            const messages = metrics.messages || 0;
            const errors = metrics.errors || 0;
            const errorRate = messages > 0 ? errors / messages : 0;

            // Self-Healing Logic: Detect high error rates
            if (messages >= 5 && errorRate > 0.1) {
                logger.warn(
                    `[Intelligence] ⚠️ High error rate detected for ${serviceId}: ` +
                    `${(errorRate * 100).toFixed(1)}% (errors=${errors}, messages=${messages})`
                );

                this.suggestAction(serviceId, "restart_adapter");
            }

            // Latency Analysis
            if (metrics.latency && metrics.latency.length > 0) {
                const avgLatency = metrics.latency.reduce((a, b) => a + b, 0) / metrics.latency.length;
                if (avgLatency > 500) { // > 500ms is slow
                    logger.warn(`[Intelligence] 🐢 High latency for ${serviceId}: ${avgLatency.toFixed(0)}ms`);
                    this.suggestAction(serviceId, "optimize_or_scale");
                }
            }
        }
    }

    suggestAction(target, action) {
        logger.info(`[Intelligence] 💡 SUGGESTION: Apply '${action}' on '${target}' to restore system health.`);
        // In a real "God-Mode", we might auto-execute this.
        // For now, we log it as a directive for the control plane.
    }
}

module.exports = IntelligenceEngine;
