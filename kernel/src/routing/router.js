/**
 * Unikernal Task Router
 * Routes tasks to the appropriate language adapter.
 */

const umb = require('../umb/umb');
const config = require('../config/config');

class Router {
    constructor() {
        this.adapters = new Map(); // language -> adapterId
        this._setupListeners();
    }

    _setupListeners() {
        // Listen for adapter registration
        umb.subscribe('adapter:register', (msg) => {
            const { language, adapterId } = msg.payload;
            this.registerAdapter(language, adapterId);
        });

        // Listen for adapter heartbeat (optional for now)
        umb.subscribe('adapter:heartbeat', (msg) => {
            // Update adapter status
        });
    }

    registerAdapter(language, adapterId) {
        this.adapters.set(language, adapterId);
        console.log(`[Router] Registered adapter for ${language}: ${adapterId}`);
    }

    /**
     * Route a task to an adapter
     * @param {object} task 
     * @returns {Promise<string>} adapterId
     */
    async route(task) {
        const language = task.language;
        if (!language) {
            throw new Error("Task language not specified");
        }

        const adapterId = this.adapters.get(language);
        if (!adapterId) {
            // TODO: Attempt to spawn adapter if not running
            throw new Error(`No adapter available for language: ${language}`);
        }

        return adapterId;
    }
}

module.exports = new Router();
