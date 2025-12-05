const logger = require("../logger");

function handleEcho(message, traceId) {
    logger.info("[EchoService] Handling message", {
        source: message.source,
        target: message.target,
        trace_id: traceId
    });

    return {
        status: "ok",
        service: "echo-service",
        trace_id: traceId,
        description: "Built-in echo test service",
        payload: {
            received: message.payload || null,
            message: "Echo response from Unikernal"
        },
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    handleEcho,
};
