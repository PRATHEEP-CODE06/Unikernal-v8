const logger = require("./logger");
const { logEnvelope } = require("./messageLogger");
const smartRouter = require("./SmartRouter");
const { runAIPipeline } = require("./ai/aiPipelineEngine");

// Import service handlers (plugins)
// We assume these are in ./services/
const { handleEcho } = require("./services/echoService");
const { handleMath } = require("./services/mathService");
const { handleString } = require("./services/stringService");

const serviceRegistry = {}; // Legacy registry, we should migrate to smartRouter fully but keeping for safety

/**
 * Register a WebSocket service by its serviceId.
 * @deprecated Use smartRouter.register instead
 */
function registerService(serviceId, ws) {
    smartRouter.register(serviceId, ws);
}

/**
 * Unregister a service when its WebSocket disconnects.
 * @deprecated Use smartRouter.unregister instead
 */
function unregisterService(serviceId) {
    smartRouter.unregister(serviceId);
}

/**
 * Inline validation helper
 */
function validateUDL(message) {
    if (!message || typeof message !== 'object') {
        return { valid: false, errors: ['Message must be an object'] };
    }
    if (!message.source || !message.target) {
        return { valid: false, errors: ['Message must have source and target'] };
    }
    return { valid: true };
}

/**
 * Core routing logic for UDL messages.
 */
function routeUDLToTarget(message) {
    // 0) Always log the raw envelope for observability
    logEnvelope(message);

    // 1) Validate UDL structure
    const validation = validateUDL(message);
    if (!validation.valid) {
        logger.error("UDL Validation Failed", { errors: validation.errors, message });
        const targetId = message && message.target ? message.target : 'unknown';
        smartRouter.recordMessage(targetId, true);
        return {
            error: true,
            error_code: "UDL_VALIDATION_FAILED",
            errors: validation.errors
        };
    }

    const traceId = message.meta && message.meta.trace_id;
    const targetId = message.target;

    // 1.5) Intercept AI Tasks - handle as first-class v8 service
    if (message.payload && (message.payload.task_type === "ai.chat" || message.payload.language === "ai" || targetId === "ai-service")) {
        logger.info("[AIService] Handling AI request", { trace_id: traceId });

        return runAIPipeline(message) // Pass full envelope so it can access meta.trace_id
            .then(aiResult => {
                const isError = aiResult.status === "error";
                smartRouter.recordMessage("ai-service", isError);

                // Return clean payload matching other internal services (echo, math, string)
                return {
                    status: aiResult.status,
                    service: "ai-service",
                    provider: aiResult.provider || "mock",
                    model: aiResult.model,
                    trace_id: aiResult.trace_id || traceId,
                    content: aiResult.content,
                    usage: aiResult.usage,
                    metadata: aiResult.metadata,
                    timestamp: new Date().toISOString()
                };
            })
            .catch(err => {
                logger.error("[Kernel] AI Pipeline Failed", { error: err.message });
                smartRouter.recordMessage("ai-service", true);
                return {
                    status: "error",
                    service: "ai-service",
                    error_code: "AI_EXECUTION_FAILED",
                    message: err.message,
                    trace_id: traceId,
                    timestamp: new Date().toISOString()
                };
            });
    }

    // 2) Route to internal plugin services
    // We wrap these in try-catch to ensure kernel never crashes
    try {
        if (targetId === "echo-service") {
            const result = handleEcho(message, traceId);
            smartRouter.recordMessage("echo-service", !!result?.error);
            return result;
        }

        if (targetId === "math-service") {
            const result = handleMath(message, traceId);
            smartRouter.recordMessage("math-service", !!result?.error);
            return result;
        }

        if (targetId === "string-service") {
            const result = handleString(message, traceId);
            smartRouter.recordMessage("string-service", !!result?.error);
            return result;
        }
    } catch (err) {
        logger.error(`[Kernel] Internal service crash: ${targetId}`, { error: err.message });
        smartRouter.recordMessage(targetId, true);
        return {
            error: true,
            error_code: "INTERNAL_SERVICE_ERROR",
            message: `Service ${targetId} crashed: ${err.message}`
        };
    }

    // 3) Normal routing to registered WebSocket services (external)
    const targetService = smartRouter.get(targetId);
    if (targetService) {
        if (targetService.readyState === targetService.OPEN) {
            try {
                targetService.send(JSON.stringify(message));
                logger.info("Message routed", {
                    source: message.source,
                    target: targetId,
                    trace_id: traceId
                });
                smartRouter.recordMessage(targetId, false);
                return { ok: true, routed: true };
            } catch (err) {
                logger.error(`[Kernel] Failed to send to ${targetId}`, { error: err.message });
                smartRouter.recordMessage(targetId, true);
                return {
                    error: true,
                    error_code: "SEND_FAILED",
                    message: err.message
                };
            }
        } else {
            logger.error("Target service connection not open", { target: targetId });
            smartRouter.recordMessage(targetId, true);
            return {
                error: true,
                error_code: "TARGET_CONNECTION_CLOSED",
                error_message: "Target service connection is not open"
            };
        }
    } else {
        const availableAdapters = smartRouter.getAvailableAdapters();
        const adapterList = availableAdapters.length > 0
            ? availableAdapters.join(', ')
            : 'none';

        // Don't log ERROR for client-* targets (temporary client connections)
        if (targetId && targetId.startsWith('client-')) {
            logger.debug("Target service not found (client connection)", { target: targetId });
        } else {
            logger.error("Target service not found", { target: targetId, available: adapterList });
        }

        smartRouter.recordMessage(targetId || 'unknown', true);
        return {
            error: true,
            error_code: "TARGET_NOT_FOUND",
            error_message: `Target service not registered: ${targetId}`,
            available_adapters: availableAdapters
        };
    }
}

/**
 * Public routing entry point.
 */
function routeUDL(message) {
    return routeUDLToTarget(message);
}

/**
 * Execute a pipeline of steps, passing data through each step
 * @param {Object} pipeline - Pipeline configuration with steps array
 * @param {Object} initialData - Initial data to process
 * @returns {Promise<Object>} Final result after all steps
 */
async function executePipeline(pipeline, initialData) {
    if (!pipeline || !pipeline.steps || !Array.isArray(pipeline.steps)) {
        throw new Error("Invalid pipeline: must have steps array");
    }

    let currentData = initialData;
    const results = [];

    logger.info("[Pipeline] Starting pipeline execution", {
        steps: pipeline.steps.length,
        initialData
    });

    for (let i = 0; i < pipeline.steps.length; i++) {
        const step = pipeline.steps[i];
        const stepName = step.name || `step-${i}`;
        const targetId = step.target;

        logger.info(`[Pipeline] Executing step ${i + 1}/${pipeline.steps.length}: ${stepName}`, {
            target: targetId
        });

        try {
            // Create UDL envelope for this step
            const envelope = {
                version: "8.0",
                source: "pipeline-executor",
                target: targetId,
                intent: "invoke",
                meta: {
                    timestamp: new Date().toISOString(),
                    trace_id: `pipeline-${stepName}-${Date.now()}`,
                    step: stepName
                },
                payload: currentData
            };

            // Route the message
            const result = routeUDLToTarget(envelope);

            if (result.error) {
                throw new Error(`Step ${stepName} failed: ${result.error_message || result.message}`);
            }

            // Update current data for next step
            currentData = result.payload || result;
            results.push({
                step: stepName,
                target: targetId,
                result: currentData
            });

            logger.info(`[Pipeline] Step ${stepName} completed successfully`);
        } catch (err) {
            logger.error(`[Pipeline] Step ${stepName} failed`, { error: err.message });
            throw err;
        }
    }

    logger.info("[Pipeline] Pipeline execution completed successfully", {
        totalSteps: pipeline.steps.length
    });

    return {
        success: true,
        steps: results,
        finalData: currentData
    };
}

/**
 * Handle internal control-plane messages targeted at the kernel
 */
async function handleKernelControlMessage(envelope) {
    const { intent, meta, payload, source } = envelope;
    const traceId = meta?.trace_id || meta?.traceId;
    const sourceId = source || 'unknown-adapter';

    logger.debug('[KernelControl] Received control message', {
        intent,
        traceId,
        source: sourceId
    });

    try {
        switch (intent) {
            case 'register_adapter':
                logger.info(`[KernelControl] register_adapter -> ${payload?.adapterId || sourceId}`);
                return {
                    status: 'ok',
                    kind: 'kernel_control',
                    action: 'register_adapter_ack',
                    adapterId: payload?.adapterId || sourceId,
                    trace_id: traceId
                };

            case 'subscribe':
                logger.info(`[KernelControl] subscribe -> ${sourceId}`);
                return {
                    status: 'ok',
                    kind: 'kernel_control',
                    action: 'subscribe_ack',
                    topic: payload?.topic,
                    trace_id: traceId
                };

            case 'ping':
            case 'health_check':
                return {
                    status: 'ok',
                    kind: 'kernel_control',
                    action: 'pong',
                    trace_id: traceId,
                    timestamp: new Date().toISOString()
                };

            default:
                logger.warn('[KernelControl] Unknown control intent', {
                    intent,
                    traceId,
                    source: sourceId
                });
                return {
                    status: 'ignored',
                    kind: 'kernel_control',
                    reason: 'unknown_intent',
                    intent,
                    trace_id: traceId
                };
        }
    } catch (err) {
        logger.error("[KernelControl] Error processing message", { error: err.message });
        return {
            status: 'error',
            kind: 'kernel_control',
            error: err.message
        };
    }
}

module.exports = {
    registerService,
    unregisterService,
    routeUDL,
    routeUDLToTarget,
    smartRouter,
    handleKernelControlMessage,
    executePipeline
};
