const logger = require("../logger");

class PolicyManager {
    constructor() {
        this.policies = new Map(); // target -> policy
        this.rateLimits = new Map(); // source -> { count, windowStart }
    }

    setPolicy(target, policy) {
        this.policies.set(target, policy);
    }

    check(message) {
        const target = message.target;
        const source = message.source;

        // 1. Rate Limiting
        if (!this.checkRateLimit(source)) {
            logger.warn(`[Policy] Rate limit exceeded for source: ${source}`);
            return false;
        }

        // 2. Access Control (Simple whitelist for now)
        const policy = this.policies.get(target);
        if (policy && policy.allowedSources) {
            if (!policy.allowedSources.includes(source)) {
                logger.warn(`[Policy] Access denied: ${source} -> ${target}`);
                return false;
            }
        }

        return true;
    }

    checkRateLimit(source) {
        // Default limit: 100 req/sec
        const LIMIT = 100;
        const WINDOW = 1000; // 1 sec

        const now = Date.now();
        if (!this.rateLimits.has(source)) {
            this.rateLimits.set(source, { count: 0, windowStart: now });
        }

        const stats = this.rateLimits.get(source);
        if (now - stats.windowStart > WINDOW) {
            stats.windowStart = now;
            stats.count = 0;
        }

        stats.count++;
        return stats.count <= LIMIT;
    }
}

module.exports = PolicyManager;
