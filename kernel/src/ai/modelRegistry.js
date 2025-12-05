/**
 * modelRegistry.js
 * Manages AI providers and model selection.
 */

const aiConfig = require('./aiConfig');
const MockProvider = require('./providers/mockProvider');
const DeepseekProvider = require('./providers/deepseekProvider');
const logger = require('../logger');

class ModelRegistry {
    constructor() {
        this.providers = new Map();
        this.initializeProviders();
    }

    initializeProviders() {
        // Initialize singletons for each provider
        this.providers.set('mock', new MockProvider(aiConfig));
        this.providers.set('deepseek', new DeepseekProvider(aiConfig));
    }

    /**
     * Get a provider instance by name.
     * @param {String} name - Provider name (e.g., "mock", "deepseek")
     * @returns {Object} Provider instance
     */
    getProvider(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            logger.warn(`[AI] Unknown provider '${name}', falling back to mock.`);
            return this.providers.get('mock');
        }
        return provider;
    }

    /**
     * Get the default provider based on configuration.
     * @returns {Object} Default provider instance
     */
    getDefaultProvider() {
        return this.getProvider(aiConfig.AI_PROVIDER);
    }
}

// Export a singleton registry
module.exports = new ModelRegistry();
