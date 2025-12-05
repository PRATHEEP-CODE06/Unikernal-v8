/**
 * UDM v8 Parser & Validator
 * Handles parsing, validation, and normalization of Universal Data Model tasks.
 */

const Ajv = require('ajv');
const ajv = new Ajv();

const UDM_SCHEMA = {
    type: "object",
    properties: {
        model_version: { type: "string", pattern: "^8\\.\\d+" },
        task_type: { enum: ["invoke", "compute", "execute", "stream", "system"] },
        language: { type: "string" },
        target: {
            type: "object",
            properties: {
                module: { type: "string" },
                class: { type: "string" },
                method: { type: "string" },
                function: { type: "string" },
                file: { type: "string" },
                path: { type: "string" }
            }
        },
        data: { type: "object" },
        context: {
            type: "object",
            properties: {
                trace_id: { type: "string" },
                source: { type: "string" },
                timestamp: { type: "string" },
                permissions: { type: "object" },
                sandbox: { type: "boolean" },
                priority: { enum: ["low", "normal", "high"] }
            }
        }
    },
    required: ["model_version", "task_type", "language", "target"]
};

class UDMParser {
    constructor() {
        this.validate = ajv.compile(UDM_SCHEMA);
    }

    /**
     * Parse and validate a UDM task
     * @param {object} task 
     * @returns {object} Normalized task
     */
    parse(task) {
        if (!task) throw new Error("Task is empty");

        // Backward compatibility for UDL v2/v3
        if (task.udl_version) {
            return this._upgradeV3(task);
        }

        const valid = this.validate(task);
        if (!valid) {
            const errors = this.validate.errors.map(e => `${e.instancePath} ${e.message}`).join(', ');
            throw new Error(`Invalid UDM v8 Task: ${errors}`);
        }

        // Normalize defaults
        task.context = task.context || {};
        task.context.timestamp = task.context.timestamp || new Date().toISOString();
        task.context.priority = task.context.priority || 'normal';
        task.data = task.data || {};

        return task;
    }

    _upgradeV3(oldTask) {
        // Simple upgrade logic
        return {
            model_version: "8.0",
            task_type: "invoke", // Default mapping
            language: oldTask.language || "unknown",
            target: {
                function: oldTask.function,
                module: oldTask.module
            },
            data: oldTask.args || {},
            context: {
                source: "v3-upgrade"
            }
        };
    }
}

module.exports = new UDMParser();
