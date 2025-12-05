const WebSocket = require('ws');
const logger = require('../logger');
const UDMv7 = require('../udm/UDMv7');

class AdapterBaseV7 {
    constructor(config) {
        this.config = config;
        this.id = config.id || `adapter-${Date.now()}`;
        this.kernelUrl = config.kernelUrl || 'ws://localhost:8080/ws';
        this.ws = null;
        this.retryCount = 0;
    }

    start() {
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.kernelUrl);

        this.ws.on('open', () => {
            logger.info(`[${this.id}] Connected to Kernel`);
            this.retryCount = 0;
            this.register();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(message);
            } catch (err) {
                logger.error(`[${this.id}] Failed to parse message`, { error: err.message });
            }
        });

        this.ws.on('close', () => {
            logger.warn(`[${this.id}] Disconnected from Kernel`);
            this.reconnect();
        });

        this.ws.on('error', (err) => {
            logger.error(`[${this.id}] WebSocket error`, { error: err.message });
        });
    }

    reconnect() {
        const timeout = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
        setTimeout(() => {
            this.retryCount++;
            this.connect();
        }, timeout);
    }

    register() {
        const registration = {
            intent: "REGISTER",
            payload: {
                service_id: this.id,
                capabilities: this.config.capabilities,
                language: this.config.language,
                version: "7.0",
                auth: {
                    key: this.config.apiKey || "adapter-key" // Default for dev
                }
            }
        };
        this.send(registration);
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    async handleMessage(message) {
        // Handle Heartbeat
        if (message.type === 'HEARTBEAT') {
            this.send({ type: 'HEARTBEAT_ACK', id: this.id });
            return;
        }

        // Handle Execution Request
        if (message.payload) {
            try {
                const result = await this.execute(message);
                // Send response back
                this.send({
                    target: message.source, // Reply to source
                    source: this.id,
                    payload: result,
                    meta: { trace_id: message.meta?.trace_id }
                });
            } catch (err) {
                this.send({
                    target: message.source,
                    source: this.id,
                    error: true,
                    error_message: err.message,
                    meta: { trace_id: message.meta?.trace_id }
                });
            }
        }
    }

    async execute(message) {
        throw new Error("execute() must be implemented by subclass");
    }
}

module.exports = AdapterBaseV7;
