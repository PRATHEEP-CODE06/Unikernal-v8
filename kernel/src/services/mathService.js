const logger = require("../logger");

function handleMath(message, traceId) {
    const payload = message.payload || {};

    // Support both `operation` (new) and `op` (old)
    const op = payload.operation || payload.op;
    const { a, b } = payload;

    // Basic validation
    if (typeof a !== "number" || typeof b !== "number" || !op) {
        logger.error("[MathService] Invalid payload", {
            trace_id: traceId,
            received: payload,
        });

        return {
            status: "error",
            service: "math-service",
            trace_id: traceId,
            error: "Invalid payload. Expected: { operation|'op', a:number, b:number }",
            received: payload,
            timestamp: new Date().toISOString(),
        };
    }

    let result;

    switch (op) {
        case "add":
            result = a + b;
            break;
        case "sub":
        case "subtract":
            result = a - b;
            break;
        case "mul":
        case "multiply":
            result = a * b;
            break;
        case "div":
        case "divide":
            if (b === 0) {
                return {
                    status: "error",
                    service: "math-service",
                    trace_id: traceId,
                    error: "Division by zero",
                    received: payload,
                    timestamp: new Date().toISOString(),
                };
            }
            result = a / b;
            break;
        default:
            return {
                status: "error",
                service: "math-service",
                trace_id: traceId,
                error: `Unsupported operation '${op}'. Use one of: add, sub, mul, div`,
                received: payload,
                timestamp: new Date().toISOString(),
            };
    }

    logger.info("[MathService] Computed result", {
        trace_id: traceId,
        op,
        a,
        b,
        result,
    });

    return {
        status: "ok",
        service: "math-service",
        trace_id: traceId,
        operation: op,
        a,
        b,
        result,
        timestamp: new Date().toISOString(),
    };
}

module.exports = {
    handleMath,
};
