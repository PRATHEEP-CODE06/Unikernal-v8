const logger = require("../logger");

class IntelligenceEngine {
    constructor(smartRouter) {
        this.smartRouter = smartRouter;
    }

    start() {
        logger.info("[Intelligence] AI Engine Started");
        // Run every 30 seconds
        setInterval(() => this.analyze(), 30000);
    }

    analyze() {
        // If smartRouter is not ready, just skip
        if (!this.smartRouter || !this.smartRouter.metrics) {
            logger.debug("[Intelligence] No metrics available yet");
            return;
        }

        logger.debug("[Intelligence] Analyzing metrics...");

        for (const [serviceId, metrics] of this.smartRouter.metrics.entries()) {
            if (!metrics) continue;

            const messages = metrics.messages || 0;
            const errors = metrics.errors || 0;

            const errorRate = messages > 0 ? errors / messages : 0;

            if (messages >= 5 && errorRate > 0.2) {
                // using info instead of warn to avoid logger.warn()
                logger.info(
                    `[Intelligence] High error rate for ${serviceId}: ` +
                    `${(errorRate * 100).toFixed(1)}% (errors=${errors}, messages=${messages})`
                );
            }

            // You can also log healthy services if you want:
            // else {
            //     logger.debug(`[Intelligence] ${serviceId} healthy: messages=${messages}, errors=${errors}`);
            // }
        }
    }

    suggestAction(target, action) {
        // keep this simple for now
        logger.info(`[Intelligence] SUGGESTION: Apply '${action}' on '${target}'`);
    }
}

module.exports = IntelligenceEngine;
