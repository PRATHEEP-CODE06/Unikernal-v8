/**
 * mockProvider.js
 * Safe fallback provider for development and testing.
 * No external API calls.
 */

const BaseProvider = require('./baseProvider');

class MockProvider extends BaseProvider {
    async chat(request) {
        const { messages, model, traceId, metadata } = request;

        // Extract first user message for echo effect
        const userMsg = messages.find(m => m.role === 'user');
        const userContent = userMsg ? userMsg.content : "No user content";

        return {
            provider: "mock",
            model: model || "mock-v8-chat",
            trace_id: traceId || "mock-trace",
            content: `MOCK_AI_RESPONSE: ${userContent}`,
            usage: {
                input_tokens: 10,
                output_tokens: 20,
                total_tokens: 30
            },
            metadata: metadata || {}
        };
    }

    async embed(request) {
        throw new Error("Mock embedding not implemented yet");
    }
}

module.exports = MockProvider;
