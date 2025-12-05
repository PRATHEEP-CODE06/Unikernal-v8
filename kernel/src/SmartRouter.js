const logger = require("./logger");

class SmartRouter {
    constructor() {
        this.routes = {};
        this.metrics = new Map();
    }

    /**
     * Register a WebSocket connection for a service.
     * @param {string} serviceId 
     * @param {WebSocket} ws 
     */
    register(serviceId, ws) {
        this.routes[serviceId] = ws;

        if (!this.metrics.has(serviceId)) {
            this.metrics.set(serviceId, {
                total: 0,
                errors: 0,
                lastActive: null,
                latency: []
            });
        }
        logger.info(`[SmartRouter] Registered route: ${serviceId}`);
    }

    /**
     * Unregister a service.
     * @param {string} serviceId 
     */
    unregister(serviceId) {
        if (this.routes[serviceId]) {
            delete this.routes[serviceId];
            logger.info(`[SmartRouter] Unregistered route: ${serviceId}`);
        }
    }

    /**
     * Get the WebSocket for a service.
     * @param {string} serviceId 
     * @returns {WebSocket|null}
     */
    get(serviceId) {
        return this.routes[serviceId] || null;
    }

    /**
     * Record message metrics with latency tracking.
     * @param {string} serviceId 
     * @param {boolean} isError 
     * @param {number} latencyMs 
     */
    recordMessage(serviceId, isError = false, latencyMs = 0) {
        const current = this.metrics.get(serviceId) || {
            total: 0,
            errors: 0,
            lastActive: null,
            latency: []
        };

        current.total += 1;
        current.lastActive = new Date().toISOString();
        if (isError) current.errors += 1;

        if (latencyMs > 0) {
            current.latency.push(latencyMs);
            if (current.latency.length > 10) current.latency.shift();
        }

        this.metrics.set(serviceId, current);
    }

    /**
     * Get metrics for a service.
     * @param {string} serviceId 
     */
    getMetrics(serviceId) {
        return this.metrics.get(serviceId);
    }

    /**
     * Get all registered routes with full details.
     */
    getRoutes() {
        return Object.keys(this.routes).map(id => ({
            id,
            ws: this.routes[id]
        }));
    }

    /**
     * Get list of available adapter IDs.
     */
    getAvailableAdapters() {
        return Object.keys(this.routes);
    }
}

const smartRouter = new SmartRouter();
module.exports = smartRouter;
