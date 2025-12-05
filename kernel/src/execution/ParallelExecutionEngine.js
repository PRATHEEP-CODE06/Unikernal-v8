const logger = require("../logger");

class ParallelExecutionEngine {
    constructor(router) {
        this.router = router; // Reference to SmartRoutingEngine
    }

    /**
     * Execute multiple tasks in parallel.
     * @param {Array} tasks - List of UDL messages
     * @returns {Promise<Array>} - List of results
     */
    async execute(tasks) {
        logger.info(`[Parallel] Executing ${tasks.length} tasks`);

        const promises = tasks.map(task => {
            return this.router.route(task)
                .then(result => ({ status: 'fulfilled', value: result, task_id: task.meta?.id }))
                .catch(err => ({ status: 'rejected', reason: err, task_id: task.meta?.id }));
        });

        const results = await Promise.all(promises);
        return results;
    }
}

module.exports = ParallelExecutionEngine;
