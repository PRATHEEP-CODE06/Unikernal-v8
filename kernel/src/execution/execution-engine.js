/**
 * Task Execution Engine
 * Manages the lifecycle of tasks.
 */

const umb = require('../umb/umb');
const router = require('../routing/router');
const udmParser = require('../udm/udm-parser');
const { v4: uuidv4 } = require('uuid');

class ExecutionEngine {
    constructor() {
        this.activeTasks = new Map(); // taskId -> task info
        this._setupHandlers();
    }

    _setupHandlers() {
        // Handle task submission from Kernel
        umb.handle('kernel:submit_task', async (rawTask) => {
            return this.executeTask(rawTask);
        });
    }

    async executeTask(rawTask) {
        const taskId = uuidv4();

        try {
            // 1. Parse & Validate
            const task = udmParser.parse(rawTask);
            task.context.trace_id = taskId;

            console.log(`[Execution] Starting task ${taskId} (${task.language})`);

            // 2. Route
            const adapterId = await router.route(task);

            // 3. Dispatch to Adapter
            // We use request/response pattern with the adapter
            const result = await umb.request(`adapter:${adapterId}:execute`, task, 30000); // 30s timeout

            console.log(`[Execution] Task ${taskId} completed`);
            return {
                taskId,
                status: 'success',
                result
            };

        } catch (err) {
            console.error(`[Execution] Task ${taskId} failed:`, err.message);
            return {
                taskId,
                status: 'error',
                error: err.message
            };
        }
    }
}

module.exports = new ExecutionEngine();
