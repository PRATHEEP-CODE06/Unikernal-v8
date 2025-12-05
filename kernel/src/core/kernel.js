/**
 * Unikernal v8 Kernel Core
 * Main entry point for the system.
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const morgan = require('morgan');
const config = require('../config/config');
const umb = require('../umb/umb');
require('../execution/execution-engine'); // Initialize Execution Engine

class Kernel {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.startTime = Date.now();

        this._setupMiddleware();
        this._setupRoutes();
        this._setupWebSocket();
        this._setupSystemEvents();
    }

    _setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(morgan('dev'));
    }

    _setupRoutes() {
        this.app.get('/', (req, res) => {
            res.json({
                system: config.system.name,
                version: config.system.version,
                status: 'running',
                uptime: (Date.now() - this.startTime) / 1000
            });
        });

        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // UDM Task Submission Endpoint
        this.app.post('/api/v8/task', async (req, res) => {
            try {
                const task = req.body;
                // Task is routed via Execution Engine which listens to 'kernel:submit_task'
                const result = await umb.request('kernel:submit_task', task);
                res.json(result);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        });
    }

    _setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('[Kernel] Client connected via WebSocket');
            const subscriptions = new Set();

            ws.on('message', (message) => {
                try {
                    const msg = JSON.parse(message);

                    if (msg.cmd === 'subscribe') {
                        const topic = msg.topic;
                        subscriptions.add(topic);
                        // Forward internal UMB events to this WS client
                        const handler = (umbMsg) => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ cmd: 'event', topic, payload: umbMsg }));
                            }
                        };
                        umb.subscribe(topic, handler);
                        // TODO: Store handler to unsubscribe later
                    }
                    else if (msg.cmd === 'publish') {
                        umb.publish(msg.topic, msg.payload, msg.metadata);
                    }
                    else if (msg.cmd === 'request') {
                        // Handle request from remote adapter (if needed)
                    }
                    else if (msg.cmd === 'response') {
                        // Handle response from remote adapter (e.g. task result)
                        // We need to bridge this to the internal UMB request
                        // The internal UMB request is waiting on 'response:<requestId>'
                        // The remote adapter sends payload and metadata with requestId
                        // We publish to the response topic
                        umb.publish(msg.topic, msg.payload, msg.metadata);
                    }

                } catch (err) {
                    console.error('[Kernel] WebSocket message error:', err);
                }
            });

            ws.on('close', () => {
                console.log('[Kernel] Client disconnected');
                // Cleanup subscriptions (TODO: proper cleanup)
            });
        });
    }

    _setupSystemEvents() {
        umb.subscribe('kernel:shutdown', () => this.shutdown());
    }

    start() {
        return new Promise((resolve) => {
            this.server.listen(config.kernel.port, config.kernel.host, () => {
                console.log(`
⚡️ ${config.system.name} v${config.system.version}
==================================================
🚀 Kernel running at http://${config.kernel.host}:${config.kernel.port}
📡 Universal Message Bus active
🔧 Environment: ${config.system.environment}
==================================================
                `);
                resolve();
            });
        });
    }

    async shutdown() {
        console.log('[Kernel] Shutting down...');
        this.server.close();
        process.exit(0);
    }
}

// Start the Kernel if run directly
if (require.main === module) {
    const kernel = new Kernel();
    kernel.start();
}

module.exports = Kernel;
