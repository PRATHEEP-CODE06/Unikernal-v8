const logger = require("../logger");

class SmartRoutingEngine {
    constructor(policyManager, resilienceEngine) {
        this.routes = new Map(); // target -> [adapters]
        this.policyManager = policyManager;
        this.resilienceEngine = resilienceEngine;
        this.metrics = new Map(); // adapterId -> { latency: [], errors: 0 }
    }

    registerRoute(target, adapterId) {
        if (!this.routes.has(target)) {
            this.routes.set(target, []);
        }
        const adapters = this.routes.get(target);
        if (!adapters.includes(adapterId)) {
            adapters.push(adapterId);
        }
        logger.info(`[SmartRouter] Registered route: ${target} -> ${adapterId}`);
    }

    unregisterRoute(target, adapterId) {
        if (this.routes.has(target)) {
            const adapters = this.routes.get(target);
            const index = adapters.indexOf(adapterId);
            if (index > -1) {
                adapters.splice(index, 1);
                logger.info(`[SmartRouter] Unregistered route: ${target} -> ${adapterId}`);
            }
        }
    }

    async route(message) {
        const target = message.target;

        // 1. Policy Check
        if (!this.policyManager.check(message)) {
            throw new Error(`Policy violation for target: ${target}`);
        }

        // 2. Find Route
        const adapters = this.routes.get(target);
        if (!adapters || adapters.length === 0) {
            throw new Error(`No route found for target: ${target}`);
        }

        // 3. Select Best Adapter (Load Balancing / Optimization)
        const selectedAdapter = this.selectBestAdapter(adapters);

        // 4. Execute with Resilience (Retry, Circuit Breaker)
        return this.resilienceEngine.execute(selectedAdapter, message);
    }

    selectBestAdapter(adapters) {
        // Simple Round-Robin or Random for now. 
        // v7-Intelligent will add latency-based selection here.
        return adapters[Math.floor(Math.random() * adapters.length)];
    }

    updateMetrics(adapterId, latency, success) {
        if (!this.metrics.has(adapterId)) {
            this.metrics.set(adapterId, { latency: [], errors: 0, total: 0 });
        }
        const m = this.metrics.get(adapterId);
        m.total++;
        if (!success) m.errors++;
        m.latency.push(latency);
        if (m.latency.length > 100) m.latency.shift(); // Keep last 100
    }
}

module.exports = SmartRoutingEngine;
