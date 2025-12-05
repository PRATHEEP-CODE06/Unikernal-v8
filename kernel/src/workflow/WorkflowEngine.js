const logger = require('../logger');

/**
 * Workflow Engine v8
 * Executes visual workflows and integrates with pipeline engine
 */
class WorkflowEngine {
    constructor(pipelineEngine, smartRouter) {
        this.pipelineEngine = pipelineEngine;
        this.smartRouter = smartRouter;
        this.workflows = new Map();
    }

    /**
     * Load a workflow from UDL v8 format
     */
    loadWorkflow(workflowDefinition) {
        const { name, nodes, connections } = workflowDefinition.workflow;

        // Validate
        if (!name || !nodes || !Array.isArray(nodes)) {
            throw new Error('Invalid workflow definition');
        }

        // Build execution graph
        const executionGraph = this.buildExecutionGraph(nodes, connections);

        this.workflows.set(name, {
            definition: workflowDefinition,
            graph: executionGraph
        });

        logger.info(`[WorkflowEngine] Loaded workflow: ${name}`);
        return { success: true, workflowId: name };
    }

    /**
     * Execute a workflow
     */
    async executeWorkflow(workflowName, initialData) {
        const workflow = this.workflows.get(workflowName);
        if (!workflow) {
            throw new Error(`Workflow '${workflowName}' not found`);
        }

        logger.info(`[WorkflowEngine] Executing workflow: ${workflowName}`);

        const { graph } = workflow;
        const results = new Map(); // nodeId -> result
        let currentData = initialData;

        // Topological execution
        for (const node of graph.executionOrder) {
            logger.debug(`[WorkflowEngine] Executing node: ${node.id}`);

            try {
                const result = await this.executeNode(node, currentData);
                results.set(node.id, result);
                currentData = result; // Pass result to next node

            } catch (err) {
                logger.error(`[WorkflowEngine] Node ${node.id} failed:`, err);
                throw new Error(`Workflow failed at node ${node.id}: ${err.message}`);
            }
        }

        return {
            success: true,
            finalResult: currentData,
            nodeResults: Object.fromEntries(results)
        };
    }

    /**
     * Execute a single node
     */
    async executeNode(node, inputData) {
        switch (node.type) {
            case 'source':
                return this.executeSource(node, inputData);
            case 'transform':
                return this.executeTransform(node, inputData);
            case 'validate':
                return this.executeValidate(node, inputData);
            case 'route':
                return this.executeRoute(node, inputData);
            case 'target':
                return this.executeTarget(node, inputData);
            case 'python':
            case 'java':
                return this.executeAdapter(node, inputData);
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    async executeSource(node, data) {
        // Source node fetches data from external source
        logger.debug(`[WorkflowEngine] Source: ${node.id}`);
        // In real implementation, fetch from API/DB/File
        return node.config.mockData || data;
    }

    async executeTransform(node, data) {
        logger.debug(`[WorkflowEngine] Transform: ${node.id}`);

        const { mapping } = node.config;
        if (!mapping) return data;

        // Apply transformations
        const transformed = {};
        for (const [targetField, sourceExpr] of Object.entries(mapping)) {
            // Simple field mapping for now
            transformed[targetField] = data[sourceExpr] || null;
        }

        return transformed;
    }

    async executeValidate(node, data) {
        logger.debug(`[WorkflowEngine] Validate: ${node.id}`);

        const { schema } = node.config;
        if (!schema) return data;

        // Simple validation
        for (const [field, rules] of Object.entries(schema)) {
            if (rules.required && !data[field]) {
                throw new Error(`Validation failed: ${field} is required`);
            }
        }

        return data;
    }

    async executeRoute(node, data) {
        logger.debug(`[WorkflowEngine] Route: ${node.id}`);

        // Route to target based on condition
        const { target, payload } = node.config;
        const message = {
            source: 'workflow-engine',
            target: target || 'default-service',
            payload: payload || data
        };

        return this.smartRouter.route(message);
    }

    async executeTarget(node, data) {
        logger.debug(`[WorkflowEngine] Target: ${node.id}`);

        // Send to target (DB, API, etc.)
        const { type, target } = node.config;

        if (type === 'database') {
            // Write to database
            logger.debug(`[WorkflowEngine] Writing to database: ${target}`);
        } else if (type === 'api') {
            // Send to API
            logger.debug(`[WorkflowEngine] Sending to API: ${target}`);
        }

        return { success: true, written: data };
    }

    async executeAdapter(node, data) {
        logger.debug(`[WorkflowEngine] Adapter: ${node.id} (${node.type})`);

        const message = {
            source: 'workflow-engine',
            target: `${node.type}-adapter`,
            payload: data,
            meta: { node_id: node.id }
        };

        return this.smartRouter.route(message);
    }

    /**
     * Build execution graph with topological order
     */
    buildExecutionGraph(nodes, connections = []) {
        // For simplicity, assume linear execution for now
        // In real implementation, use topological sort for DAG

        const executionOrder = nodes.sort((a, b) => {
            // Source first, target last
            const typeOrder = { source: 0, transform: 1, validate: 2, route: 3, target: 4 };
            return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
        });

        return { executionOrder, connections };
    }

    listWorkflows() {
        return Array.from(this.workflows.keys());
    }
}

module.exports = WorkflowEngine;
