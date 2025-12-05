/**
 * deepseekProvider.js
 * Integration stub for DeepSeek AI.
 * Falls back to mock if API key is missing.
 */

const BaseProvider = require('./baseProvider');
const MockProvider = require('./mockProvider');
const logger = require('../../logger');

class DeepseekProvider extends BaseProvider {
    constructor(config) {
        super(config);
        this.apiKey = process.env.DEEPSEEK_API_KEY;
        this.mockFallback = new MockProvider(config);
    }

    async chat(request) {
        if (!this.apiKey) {
            logger.warn("[DeepSeek] No API key found (DEEPSEEK_API_KEY). Falling back to mock.");
            return this.mockFallback.chat(request);
        }

        // STUB: Real implementation would go here using axios or fetch
        // For now, return a safe placeholder to avoid external calls in this task
        return {
            provider: "deepseek",
            model: request.model || "deepseek-default",
            trace_id: request.traceId || "deepseek-trace",
            content: "[DEEPSEEK_PLACEHOLDER] AI integration not fully implemented yet.",
            usage: {
                input_tokens: 0,
                output_tokens: 0,
                total_tokens: 0
            },
            metadata: request.metadata || {}
        };
    }
}

module.exports = DeepseekProvider;
