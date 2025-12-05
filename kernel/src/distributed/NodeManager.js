const logger = require('../logger');
const WebSocket = require('ws');

class NodeManager {
    constructor(myId, port, peers = []) {
        this.myId = myId;
        this.port = port;
        this.peers = new Map(); // peerId -> { ws, lastSeen }
        this.initialPeers = peers;
    }

    start() {
        logger.info(`[NodeManager] Starting node ${this.myId} on port ${this.port}`);

        // Connect to initial peers
        this.initialPeers.forEach(peerUrl => this.connectToPeer(peerUrl));

        // Start Heartbeat Loop
        setInterval(() => this.heartbeat(), 5000);
    }

    connectToPeer(url) {
        if ([...this.peers.values()].some(p => p.url === url)) return;

        logger.info(`[NodeManager] Connecting to peer: ${url}`);
        const ws = new WebSocket(url);

        ws.on('open', () => {
            ws.send(JSON.stringify({
                type: 'HELLO',
                source: this.myId,
                payload: { url: `ws://localhost:${this.port}` }
            }));
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                this.handleMessage(msg, ws, url);
            } catch (err) {
                logger.error(`[NodeManager] Failed to parse peer message`, { error: err.message });
            }
        });

        ws.on('close', () => {
            logger.warn(`[NodeManager] Peer disconnected: ${url}`);
            this.removePeerByUrl(url);
            // Retry logic
            setTimeout(() => this.connectToPeer(url), 5000);
        });

        ws.on('error', (err) => {
            // logger.error(`[NodeManager] Peer error: ${url}`, { error: err.message });
        });
    }

    handleMessage(msg, ws, url) {
        if (msg.type === 'HELLO') {
            const peerId = msg.source;
            this.peers.set(peerId, { id: peerId, ws, url, lastSeen: Date.now() });
            logger.info(`[NodeManager] Peer identified: ${peerId}`);
        } else if (msg.type === 'HEARTBEAT') {
            const peer = this.peers.get(msg.source);
            if (peer) peer.lastSeen = Date.now();
        }
    }

    heartbeat() {
        const now = Date.now();
        this.peers.forEach((peer, id) => {
            if (now - peer.lastSeen > 15000) {
                logger.warn(`[NodeManager] Peer ${id} timed out`);
                peer.ws.terminate();
                this.peers.delete(id);
            } else {
                if (peer.ws.readyState === WebSocket.OPEN) {
                    peer.ws.send(JSON.stringify({ type: 'HEARTBEAT', source: this.myId }));
                }
            }
        });
    }

    removePeerByUrl(url) {
        for (const [id, peer] of this.peers.entries()) {
            if (peer.url === url) {
                this.peers.delete(id);
                break;
            }
        }
    }
}

module.exports = NodeManager;
