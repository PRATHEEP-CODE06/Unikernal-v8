/**
 * aiPipelineEngine.js
 * Core orchestrator for AI tasks in Unikernal v8.
 */

const logger = require('../logger');
const aiConfig = require('./aiConfig');
const modelRegistry = require('./modelRegistry');
const { v4: uuidv4 } = require('uuid'); // Assuming uuid is available, else fallback

/**
 * Execute an AI pipeline task.
 * @param {Object} task - The UDM envelope or task object
 * @returns {Promise<Object>} Normalized AI response
 */
async function runAIPipeline(task) {
    // 1. Check if AI is enabled
    if (!aiConfig.AI_ENABLED) {
        return {
            status: "error",
            error_code: "AI_DISABLED",
            error: "AI pipeline is disabled in configuration."
        };
    }

    try {
        // 2. Normalize Request - handle both full envelope and direct payload
        // If task has a payload property, it's a full envelope; otherwise it's a direct task
        const payload = task.payload || task.data || task;
        const messages = payload.messages;

        if (!Array.isArray(messages) || messages.length === 0) {
            return {
                status: "error",
                error_code: "INVALID_REQUEST",
                error: "Task must contain a non-empty 'messages' array."
            };
        }

        const model = payload.model || task.model || task.model_version || aiConfig.AI_DEFAULT_MODEL;

        // Extract trace_id: check envelope meta first, then payload context
        let traceId = task.meta?.trace_id || task.meta?.traceId ||
            task.context?.trace_id || payload.context?.trace_id;
        if (!traceId) {
            try {
                traceId = uuidv4();
            } catch (e) {
                traceId = `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            }
        }

        const metadata = task.context || task.meta || {};

        // 3. Get Provider
        const provider = modelRegistry.getDefaultProvider();

        // 4. Call Provider
        logger.info(`[AI] Executing chat completion`, {
            provider: aiConfig.AI_PROVIDER,
            model,
            traceId
        });

        const result = await provider.chat({
            messages,
            model,
            traceId,
            metadata
        });

        // 5. Return Normalized Response
        return {
            status: "ok",
            provider: result.provider,
            model: result.model,
            trace_id: result.trace_id,
            content: result.content,
            usage: result.usage || null,
            metadata: result.metadata || {}
        };

    } catch (error) {
        logger.error("[AI] Pipeline error", { error: error.message });
        return {
            status: "error",
            error_code: "AI_PIPELINE_ERROR",
            error: error.message || "Unknown AI pipeline error"
        };
    }
}

module.exports = {
    runAIPipeline
};
