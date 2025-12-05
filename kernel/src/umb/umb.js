/**
 * Universal Message Bus (UMB)
 * Handles inter-component communication, streaming, and events.
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

class UMB extends EventEmitter {
    constructor() {
        super();
        this.subscribers = new Map(); // topic -> Set<callback>
        this.requestHandlers = new Map(); // topic -> callback
        this.streams = new Map(); // streamId -> StreamData

        console.log('[UMB] Initialized Universal Message Bus');
    }

    /**
     * Publish a message to a topic (Fire and Forget)
     * @param {string} topic 
     * @param {any} payload 
     * @param {object} metadata 
     */
    publish(topic, payload, metadata = {}) {
        const message = this._createMessage(topic, payload, 'event', metadata);
        this.emit(topic, message);

        // Also notify wildcard subscribers if we implement them later
        this.emit('*', message);
    }

    /**
     * Subscribe to a topic
     * @param {string} topic 
     * @param {function} callback 
     */
    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Set());
            this.on(topic, (msg) => {
                this.subscribers.get(topic).forEach(cb => cb(msg));
            });
        }
        this.subscribers.get(topic).add(callback);
        console.log(`[UMB] Subscribed to ${topic}`);
    }

    /**
     * Send a request and wait for a response (RPC style)
     * @param {string} topic 
     * @param {any} payload 
     * @param {number} timeoutMs 
     * @returns {Promise<any>}
     */
    async request(topic, payload, timeoutMs = 5000) {
        const requestId = uuidv4();
        const responseTopic = `response:${requestId}`;

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.removeAllListeners(responseTopic);
                reject(new Error(`UMB Request Timeout: ${topic}`));
            }, timeoutMs);

            this.once(responseTopic, (msg) => {
                clearTimeout(timer);
                if (msg.error) {
                    reject(new Error(msg.error));
                } else {
                    resolve(msg.payload);
                }
            });

            const message = this._createMessage(topic, payload, 'request', { requestId, responseTopic });
            this.emit(topic, message);
        });
    }

    /**
     * Register a handler for requests on a topic
     * @param {string} topic 
     * @param {function} handler - async function(payload, metadata) returning response
     */
    handle(topic, handler) {
        if (this.requestHandlers.has(topic)) {
            throw new Error(`Handler already registered for ${topic}`);
        }
        this.requestHandlers.set(topic, handler);

        this.on(topic, async (msg) => {
            if (msg.type === 'request') {
                try {
                    const result = await handler(msg.payload, msg.metadata);
                    this.publish(msg.metadata.responseTopic, result, { requestId: msg.metadata.requestId });
                } catch (err) {
                    this.publish(msg.metadata.responseTopic, null, {
                        requestId: msg.metadata.requestId,
                        error: err.message
                    });
                }
            }
        });
        console.log(`[UMB] Registered handler for ${topic}`);
    }

    /**
     * Start a data stream
     * @param {string} sourceId 
     * @param {string} targetId 
     * @returns {string} streamId
     */
    createStream(sourceId, targetId) {
        const streamId = uuidv4();
        this.streams.set(streamId, {
            id: streamId,
            source: sourceId,
            target: targetId,
            active: true,
            created: Date.now()
        });
        console.log(`[UMB] Stream created: ${streamId} (${sourceId} -> ${targetId})`);
        return streamId;
    }

    /**
     * Push data to a stream
     * @param {string} streamId 
     * @param {Buffer|string} chunk 
     */
    streamPush(streamId, chunk) {
        if (!this.streams.has(streamId)) {
            throw new Error(`Stream ${streamId} not found`);
        }
        this.emit(`stream:${streamId}`, { streamId, chunk, timestamp: Date.now() });
    }

    /**
     * Close a stream
     * @param {string} streamId 
     */
    streamClose(streamId) {
        if (this.streams.has(streamId)) {
            this.emit(`stream:${streamId}:end`, { streamId });
            this.streams.delete(streamId);
            console.log(`[UMB] Stream closed: ${streamId}`);
        }
    }

    _createMessage(topic, payload, type, metadata) {
        return {
            id: uuidv4(),
            topic,
            type, // 'event', 'request', 'response'
            timestamp: new Date().toISOString(),
            payload,
            metadata
        };
    }
}

module.exports = new UMB();
