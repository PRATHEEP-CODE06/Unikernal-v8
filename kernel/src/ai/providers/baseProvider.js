/**
 * baseProvider.js
 * Abstract base class for AI providers in Unikernal v8.
 */

class BaseProvider {
    constructor(config = {}) {
        this.config = config;
    }

    /**
     * Send a chat completion request.
     * @param {Object} request
     * @param {Array} request.messages - Array of { role, content }
     * @param {String} request.model - Model identifier
     * @param {String} request.traceId - Trace ID for observability
     * @param {Object} request.metadata - Additional metadata
     * @returns {Promise<Object>} Normalized response
     */
    async chat(request) {
        throw new Error("Method 'chat' must be implemented by subclass");
    }

    /**
     * Generate embeddings (stub for future).
     * @param {Object} request
     * @returns {Promise<Object>}
     */
    async embed(request) {
        throw new Error("Method 'embed' must be implemented by subclass");
    }
}

module.exports = BaseProvider;
