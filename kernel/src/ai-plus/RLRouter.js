const logger = require('../logger');

/**
 * Reinforcement Learning Router
 * Learns optimal routing patterns through trial and reward
 */
class RLRouter {
    constructor() {
        this.qTable = new Map(); // state -> action -> Q-value
        this.learningRate = 0.1;
        this.discountFactor = 0.95;
        this.epsilon = 0.2; // Exploration rate
        this.actions = []; // Available routes
    }

    /**
     * Register possible actions (routes)
     */
    registerAction(actionId, metadata = {}) {
        if (!this.actions.find(a => a.id === actionId)) {
            this.actions.push({ id: actionId, ...metadata });
            logger.info(`[RLRouter] Registered action: ${actionId}`);
        }
    }

    /**
     * Get state representation
     */
    getState(metrics) {
        // Discretize continuous metrics into state buckets
        const loadBucket = this.discretize(metrics.load || 0, [0, 50, 80, 100]);
        const errorBucket = this.discretize(metrics.errorRate || 0, [0, 0.01, 0.05, 0.1]);
        const latencyBucket = this.discretize(metrics.latency || 0, [0, 100, 500, 1000]);

        return `L${loadBucket}-E${errorBucket}-T${latencyBucket}`;
    }

    discretize(value, thresholds) {
        for (let i = 0; i < thresholds.length; i++) {
            if (value <= thresholds[i]) return i;
        }
        return thresholds.length;
    }

    /**
     * Select action using epsilon-greedy strategy
     */
    selectAction(state, availableActions = this.actions) {
        if (availableActions.length === 0) {
            throw new Error('No available actions');
        }

        // Exploration: random action
        if (Math.random() < this.epsilon) {
            const randomIndex = Math.floor(Math.random() * availableActions.length);
            return availableActions[randomIndex].id;
        }

        // Exploitation: best known action
        const stateValues = this.qTable.get(state) || {};
        let bestAction = availableActions[0].id;
        let bestValue = stateValues[bestAction] || 0;

        for (const action of availableActions) {
            const value = stateValues[action.id] || 0;
            if (value > bestValue) {
                bestValue = value;
                bestAction = action.id;
            }
        }

        return bestAction;
    }

    /**
     * Update Q-value based on reward
     */
    learn(state, action, reward, nextState) {
        // Initialize Q-values if needed
        if (!this.qTable.has(state)) {
            this.qTable.set(state, {});
        }

        const stateValues = this.qTable.get(state);
        const currentQ = stateValues[action] || 0;

        // Find max Q-value for next state
        const nextStateValues = this.qTable.get(nextState) || {};
        const maxNextQ = Math.max(...Object.values(nextStateValues), 0);

        // Q-learning update rule
        const newQ = currentQ + this.learningRate * (
            reward + this.discountFactor * maxNextQ - currentQ
        );

        stateValues[action] = newQ;

        logger.debug(`[RLRouter] Updated Q(${state}, ${action}) = ${newQ.toFixed(3)} (reward: ${reward})`);
    }

    /**
     * Calculate reward from result
     */
    calculateReward(result) {
        // Reward = -latency - 100*errors
        const latency = result.latency || 0;
        const errors = result.error ? 1 : 0;
        return -(latency / 1000) - 100 * errors;
    }

    /**
     * Full routing decision with learning
     */
    async route(metrics, availableRoutes, executeRoute) {
        const state = this.getState(metrics);
        const action = this.selectAction(state, availableRoutes);

        logger.info(`[RLRouter] State: ${state}, Action: ${action}`);

        // Execute route
        const startTime = Date.now();
        try {
            const result = await executeRoute(action);
            const latency = Date.now() - startTime;

            const nextState = this.getState({ ...metrics, latency });
            const reward = this.calculateReward({ ...result, latency });

            this.learn(state, action, reward, nextState);

            return { success: true, result, action, reward };

        } catch (error) {
            const latency = Date.now() - startTime;
            const nextState = this.getState({ ...metrics, latency });
            const reward = this.calculateReward({ error: true, latency });

            this.learn(state, action, reward, nextState);

            throw error;
        }
    }

    /**
     * Export Q-table for analysis
     */
    exportQTable() {
        const table = {};
        for (const [state, actions] of this.qTable) {
            table[state] = actions;
        }
        return table;
    }

    /**
     * Reduce exploration over time
     */
    decayEpsilon(factor = 0.99) {
        this.epsilon = Math.max(0.01, this.epsilon * factor);
    }
}

module.exports = RLRouter;
