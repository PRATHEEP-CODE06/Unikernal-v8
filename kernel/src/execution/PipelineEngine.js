const logger = require("../logger");

class PipelineEngine {
    constructor(router) {
        this.router = router;
    }

    /**
     * Execute a pipeline of steps.
     * @param {Object} pipeline - { steps: [{ name, target, transform? }] }
     * @param {Object} initialPayload - Initial data
     */
    async execute(pipeline, initialPayload) {
        logger.info(`[Pipeline] Starting pipeline with ${pipeline.steps.length} steps`);

        let currentPayload = initialPayload;
        const history = [];

        for (const step of pipeline.steps) {
            logger.info(`[Pipeline] Executing step: ${step.name} -> ${step.target}`);

            // 1. Transform (if needed)
            // In a real system, we might call a transformation service here.
            // For v7 prototype, we assume the payload is compatible or transformed by the adapter.

            // 2. Create Message
            const message = {
                source: "pipeline-engine",
                target: step.target,
                payload: currentPayload,
                meta: {
                    pipeline_step: step.name,
                    timestamp: new Date().toISOString()
                }
            };

            // 3. Execute Step
            try {
                const result = await this.router.route(message);

                // 4. Update Payload for next step
                // Assuming the result contains the data for the next step.
                // If the result is just an ack, we might keep the old payload or merge.
                // For now, we assume the result IS the new payload.
                currentPayload = result;
                history.push({ step: step.name, status: 'success', result });

            } catch (err) {
                logger.error(`[Pipeline] Step ${step.name} failed: ${err.message}`);
                history.push({ step: step.name, status: 'failed', error: err.message });

                // Stop pipeline on error (unless configured to continue)
                throw new Error(`Pipeline failed at step ${step.name}: ${err.message}`);
            }
        }

        return { status: 'completed', final_result: currentPayload, history };
    }
}

module.exports = PipelineEngine;
