const logger = require('../logger');

class ClusterSync {
    constructor(nodeManager, smartRouter) {
        this.nodeManager = nodeManager;
        this.smartRouter = smartRouter;
    }

    start() {
        // Periodically sync routing table
        setInterval(() => this.syncRoutes(), 10000);
    }

    syncRoutes() {
        const routes = Array.from(this.smartRouter.routes.entries());
        const payload = {
            type: 'SYNC_ROUTES',
            source: this.nodeManager.myId,
            payload: routes
        };

        this.nodeManager.peers.forEach(peer => {
            if (peer.ws.readyState === 1) {
                peer.ws.send(JSON.stringify(payload));
            }
        });
    }

    handleSync(message) {
        if (message.type === 'SYNC_ROUTES') {
            const remoteRoutes = message.payload;
            // Merge logic: Add remote routes to local router pointing to the peer
            // For now, just log
            logger.debug(`[ClusterSync] Received routes from ${message.source}: ${remoteRoutes.length}`);
        }
    }
}

module.exports = ClusterSync;
