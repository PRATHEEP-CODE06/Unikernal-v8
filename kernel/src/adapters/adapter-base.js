/**
 * Language Adapter Base Class
 * Defines the standard protocol for all language adapters.
 */

const umb = require('../umb/umb');
const { v4: uuidv4 } = require('uuid');

class AdapterBase {
    /**
     * @param {string} language - The language this adapter supports (e.g., 'python', 'java')
     * @param {object} config - Adapter configuration
     */
    constructor(language, config = {}) {
        this.language = language;
        this.id = `adapter-${language}-${uuidv4()}`;
        this.config = config;
        this.status = 'initializing';

        this._setupUMB();
    }

    _setupUMB() {
        // Register with Router
        umb.publish('adapter:register', {
            language: this.language,
            adapterId: this.id,
            capabilities: this.config.capabilities || []
        });

        // Listen for execution requests
        umb.handle(`adapter:${this.id}:execute`, async (task) => {
            return this.execute(task);
        });

        // Listen for shutdown
        umb.subscribe('kernel:shutdown', () => this.shutdown());

        console.log(`[Adapter:${this.language}] Initialized as ${this.id}`);
        this.status = 'ready';
    }

    /**
     * Execute a UDM task
     * Must be implemented by subclasses
     * @param {object} task 
     * @returns {Promise<object>} Result
     */
    async execute(task) {
        throw new Error('execute() must be implemented by subclass');
    }

    /**
     * Helper to stream data back to Kernel/Caller
     * @param {string} streamId 
     * @param {any} data 
     */
    stream(streamId, data) {
        umb.streamPush(streamId, data);
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log(`[Adapter:${this.language}] Shutting down...`);
        // Cleanup resources
    }
}

module.exports = AdapterBase;
