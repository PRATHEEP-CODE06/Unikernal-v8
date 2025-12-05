const logger = require("../logger");

function handleString(message, traceId) {
    logger.info("[StringService] Handling message", {
        source: message.source,
        target: message.target,
        trace_id: traceId
    });

    const payload = message.payload || {};
    const operation = payload.operation;
    const text = payload.text;

    if (!operation || typeof text !== "string") {
        return {
            status: "error",
            service: "string-service",
            trace_id: traceId,
            error: "Invalid payload. Expected: { operation:string, text:string }",
            received: payload,
            timestamp: new Date().toISOString()
        };
    }

    let result;

    switch (operation) {
        case "upper":
            result = text.toUpperCase();
            break;
        case "lower":
            result = text.toLowerCase();
            break;
        case "trim":
            result = text.trim();
            break;
        case "length":
            result = text.length;
            break;
        case "reverse":
            result = text.split("").reverse().join("");
            break;
        default:
            return {
                status: "error",
                service: "string-service",
                trace_id: traceId,
                error: `Unsupported operation '${operation}'. Use one of: upper, lower, trim, length, reverse`,
                received: payload,
                timestamp: new Date().toISOString()
            };
    }

    return {
        status: "ok",
        service: "string-service",
        trace_id: traceId,
        operation,
        input: text,
        result,
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    handleString,
};
