/**
 * antigravityCore.js
 * 
 * The brain of Unikernal v3.
 * Responsible for interpreting natural language or partial UDL into strict UDM.
 */

const logger = require("./logger");

// Feature flag for debugging Antigravity
const DEBUG_ANTIGRAVITY = process.env.DEBUG_ANTIGRAVITY === "true";

/**
 * Helper to log if debug is enabled
 */
function debugLog(msg, data) {
    if (DEBUG_ANTIGRAVITY) {
        logger.info(`[Antigravity] ${msg}`, data);
    }
}

/**
 * Deterministically maps a natural language operation to a task name.
 * @param {string} text 
 * @returns {string|null} taskName or null
 */
function inferMathTask(text) {
    const t = text.toLowerCase();

    // List operations
    if (t.includes("sum") || t.includes("add all") || t.includes("total")) return "math.sum";
    if (t.includes("product") || t.includes("multiply all")) return "math.product";
    if (t.includes("average") || t.includes("mean")) return "math.average";
    if (t.includes("min") || t.includes("minimum") || t.includes("smallest")) return "math.min";
    if (t.includes("max") || t.includes("maximum") || t.includes("largest")) return "math.max";

    // Binary / Calculator operations
    // We need to be careful not to overlap too much, but for now simple keywords work.
    // "add 5 and 3" -> calc.binary
    if (t.includes("add") || t.includes("plus")) return "calc.binary";
    if (t.includes("subtract") || t.includes("minus") || t.includes("difference")) return "calc.binary"; // or math.subtract if list?
    // Let's assume "subtract" on a list is math.subtract, but "subtract a from b" is calc.
    // For simplicity in v3, we'll try to detect if it looks like a list or binary.

    if (t.includes("multiply") || t.includes("times")) return "calc.binary";
    if (t.includes("divide") || t.includes("div")) return "calc.binary"; // or math.divide
    if (t.includes("mod") || t.includes("modulo") || t.includes("remainder")) return "calc.binary";
    if (t.includes("pow") || t.includes("power") || t.includes("exponent")) return "calc.binary";

    return null;
}

/**
 * Extracts numbers from a string.
 * @param {string} text 
 * @returns {number[]}
 */
function extractNumbers(text) {
    const regex = /-?\d+(\.\d+)?/g;
    const matches = text.match(regex);
    return matches ? matches.map(Number) : [];
}

/**
 * Main entry point for Intelligent Mode.
 * 
 * @param {object} udl The incoming request object.
 * @returns {object} { udm, service, error? }
 */
function interpretUDLToUDM(udl) {
    debugLog("Interpreting UDL:", udl);

    const query = udl.query || udl.text || "";
    const source = udl.source || "unknown";

    // 1. Try to detect Math intent
    const mathTask = inferMathTask(query);
    if (mathTask) {
        const nums = extractNumbers(query);

        // DECISION: List vs Calc
        // If we have > 2 numbers, it's likely a list operation (unless it's complex calc, but v3 is simple).
        // If we have exactly 2 numbers, it could be list or calc.
        // If task is explicitly "math.sum", "math.product", etc., it's list.
        // If task is "calc.binary", it's calc.

        // Refine inferMathTask ambiguity:
        let finalTask = mathTask;
        let mode = "list";
        let op = "unknown";

        // Map task to op string for the response/UDM
        if (mathTask === "math.sum") op = "sum";
        if (mathTask === "math.product") op = "product";
        if (mathTask === "math.average") op = "average";
        if (mathTask === "math.min") op = "min";
        if (mathTask === "math.max") op = "max";

        // Handle ambiguous "subtract" / "divide"
        if (query.includes("subtract") || query.includes("minus")) {
            // If "subtract 10 from 20", that's binary.
            // If "subtract list", that's list.
            // Default to calc if 2 args, list if > 2.
            if (nums.length === 2) {
                finalTask = "calc.binary";
                op = "sub"; // calc expects 'sub'
                mode = "calc";
            } else {
                finalTask = "math.subtract";
                op = "subtract";
                mode = "list";
            }
        }

        if (query.includes("divide") || query.includes("div")) {
            if (nums.length === 2) {
                finalTask = "calc.binary";
                op = "div";
                mode = "calc";
            } else {
                finalTask = "math.divide";
                op = "divide";
                mode = "list";
            }
        }

        // Explicit calc keywords
        if (mathTask === "calc.binary") {
            mode = "calc";
            if (query.includes("add") || query.includes("plus")) op = "add";
            if (query.includes("multiply") || query.includes("times")) op = "mul";
            if (query.includes("mod")) op = "mod";
            if (query.includes("pow")) op = "pow";
            // sub/div handled above or fall through
        }

        // Construct UDM
        const udm = {
            model_version: "3.0",
            type: "task",
            task_name: finalTask,
            data: {},
            context: {
                trace_id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                source: source,
                original_query: query
            }
        };

        if (mode === "list") {
            udm.data = { inputs: nums };
        } else {
            // Calc mode requires a and b
            if (nums.length < 2) {
                return {
                    error: true,
                    message: "Calculator mode requires at least 2 numbers found in query."
                };
            }
            udm.data = {
                op: op,
                a: nums[0],
                b: nums[1]
            };
        }

        debugLog("Generated UDM:", udm);

        return {
            udm,
            service: "python-math-service", // Antigravity decides this is a math job
            mode: mode, // For the server to know how to format the final response if needed (though adapter does it too)
            operation: op
        };
    }

    // 2. String Service (Legacy support via Antigravity?)
    // If query says "uppercase this", we could route to string-service.
    if (query.toLowerCase().includes("upper") || query.toLowerCase().includes("uppercase")) {
        // This is just a demo of routing to another service
        // We don't have a python adapter for strings, but we have a node one in v2?
        // Actually v2 demo calls "string-service". Let's assume it's handled by routingKernel if registered.
        // But for now, let's just focus on Python Math as the primary "Intelligent" demo.
    }

    return {
        error: true,
        message: "Antigravity could not understand the query."
    };
}

module.exports = {
    interpretUDLToUDM
};
