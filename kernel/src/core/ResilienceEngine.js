const logger = require("../logger");

class ResilienceEngine {
    constructor(executionEngine) {
        this.executionEngine = executionEngine; // Function to actually send the message
        this.circuitBreakers = new Map(); // adapterId -> state
    }

    async execute(adapterId, message) {
        // 1. Circuit Breaker Check
        if (this.isOpen(adapterId)) {
            throw new Error(`Circuit breaker open for adapter: ${adapterId}`);
        }

        // 2. Retry Logic
        const maxRetries = 3;
        let attempt = 0;
        let lastError;

        while (attempt < maxRetries) {
            try {
                const start = Date.now();
                const result = await this.executionEngine(adapterId, message);
                this.recordSuccess(adapterId, Date.now() - start);
                return result;
            } catch (err) {
                lastError = err;
                attempt++;
                this.recordFailure(adapterId);
                logger.warn(`[Resilience] Retry ${attempt}/${maxRetries} for ${adapterId} failed: ${err.message}`);
                await this.wait(Math.pow(2, attempt) * 100); // Exponential backoff
            }
        }

        throw lastError;
    }

    isOpen(adapterId) {
        const state = this.circuitBreakers.get(adapterId);
        if (!state) return false;
        if (state.status === 'OPEN') {
            if (Date.now() > state.resetAt) {
                state.status = 'HALF_OPEN';
                return false; // Allow one trial
            }
            return true;
        }
        return false;
    }

    recordSuccess(adapterId, latency) {
        const state = this.circuitBreakers.get(adapterId) || { failures: 0, status: 'CLOSED' };
        if (state.status === 'HALF_OPEN') {
            state.status = 'CLOSED';
            state.failures = 0;
        }
        this.circuitBreakers.set(adapterId, state);
    }

    recordFailure(adapterId) {
        const state = this.circuitBreakers.get(adapterId) || { failures: 0, status: 'CLOSED' };
        state.failures++;
        if (state.failures > 5) {
            state.status = 'OPEN';
            state.resetAt = Date.now() + 10000; // Open for 10 seconds
            logger.error(`[Resilience] Circuit breaker OPENED for ${adapterId}`);
        }
        this.circuitBreakers.set(adapterId, state);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ResilienceEngine;
