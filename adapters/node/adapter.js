const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Configuration
const KERNEL_URL = "ws://localhost:3000/ws";
const ADAPTER_ID = `adapter-node-${uuidv4()}`;

class NodeAdapter {
    constructor() {
        this.ws = null;
    }

    connect() {
        console.log(`[Node] Connecting to Kernel at ${KERNEL_URL}...`);
        this.ws = new WebSocket(KERNEL_URL);

        this.ws.on('open', () => {
            console.log(`[Node] Connected as ${ADAPTER_ID}`);
            this.register();
        });

        this.ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                this.handleMessage(msg);
            } catch (err) {
                console.error('[Node] Message error:', err);
            }
        });

        this.ws.on('error', (err) => {
            console.error('[Node] Connection error:', err);
        });
    }

    register() {
        // Register with V8-compliant UDM envelope
        this.send({
            version: '8.0',
            source: ADAPTER_ID,
            target: 'kernel',
            intent: 'register_adapter',
            meta: {
                timestamp: new Date().toISOString(),
                trace_id: ADAPTER_ID,
                language: 'node',
                adapter_version: '1.0'
            },
            payload: {
                adapterId: ADAPTER_ID,
                capabilities: ['execute', 'eval'],
                runtime: `node-${process.version}`
            }
        });

        // Subscribe to execution requests with V8 UDM envelope
        this.send({
            version: '8.0',
            source: ADAPTER_ID,
            target: 'kernel',
            intent: 'subscribe',
            meta: {
                timestamp: new Date().toISOString(),
                trace_id: ADAPTER_ID
            },
            payload: { topic: `adapter:${ADAPTER_ID}:execute` }
        });
    }

    send(msg) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    async handleMessage(msg) {
        // Standard UDM v8 handling
        const { intent, source, target, payload, meta } = msg;
        const traceId = meta?.trace_id || meta?.traceId;

        if (target === 'kernel') return; // Ignore control plane acks

        if (intent === 'invoke') {
            await this.executeTask(msg);
        } else if (intent === 'ping') {
            this.send({
                version: '8.0',
                source: ADAPTER_ID,
                target: source,
                intent: 'pong',
                meta: { trace_id: traceId, timestamp: new Date().toISOString() }
            });
        } else {
            console.log(`[Node] Unknown intent: ${intent}`);
        }
    }

    async executeTask(msg) {
        const { source, payload, meta } = msg;
        const traceId = meta?.trace_id;

        console.log(`[Node] Executing task for ${source}, trace=${traceId}`);

        try {
            let result;

            // Support 'code' execution (eval) or 'function' call
            if (payload.code) {
                // DANGEROUS: Eval for demo purposes
                result = eval(payload.code);
            } else if (payload.function) {
                // Call a function from a module
                // payload: { module: 'fs', function: 'readFileSync', args: [...] }
                const modName = payload.module;
                const funcName = payload.function;
                const args = payload.args || [];

                let mod;
                if (modName) {
                    mod = require(modName);
                } else {
                    // Default to global or local context?
                    throw new Error("Module not specified");
                }

                if (typeof mod[funcName] === 'function') {
                    result = await mod[funcName](...args);
                } else {
                    throw new Error(`Function ${funcName} not found in ${modName}`);
                }
            } else {
                throw new Error("Invalid payload: expected 'code' or 'function'");
            }

            this.send({
                version: '8.0',
                source: ADAPTER_ID,
                target: source,
                intent: 'response',
                meta: { trace_id: traceId, timestamp: new Date().toISOString() },
                payload: {
                    status: 'ok',
                    result: result
                }
            });

        } catch (err) {
            console.error(`[Node] Execution error: ${err.message}`);
            this.send({
                version: '8.0',
                source: ADAPTER_ID,
                target: source,
                intent: 'response',
                meta: { trace_id: traceId, timestamp: new Date().toISOString() },
                payload: {
                    status: 'error',
                    error: err.message
                }
            });
        }
    }
}

if (require.main === module) {
    const adapter = new NodeAdapter();
    adapter.connect();
}

module.exports = NodeAdapter;
