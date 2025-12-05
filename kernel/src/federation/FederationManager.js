const logger = require('../logger');
const WebSocket = require('ws');

/**
 * Multi-Cluster Federation Manager
 * Enables global routing and failover across geographic clusters
 */
class FederationManager {
    constructor(myClusterId, myUrl) {
        this.myClusterId = myClusterId;
        this.myUrl = myUrl;
        this.clusters = new Map(); // clusterId -> { url, ws, routes, region, lastSeen }
        this.globalRoutes = new Map(); // target -> [clusterIds]
    }

    /**
     * Connect to peer cluster
     */
    connectToCluster(clusterId, url, region) {
        logger.info(`[Federation] Connecting to cluster: ${clusterId} at ${url}`);

        const ws = new WebSocket(url);

        ws.on('open', () => {
            logger.info(`[Federation] Connected to ${clusterId}`);

            // Send handshake
            ws.send(JSON.stringify({
                type: 'FEDERATION_HANDSHAKE',
                clusterId: this.myClusterId,
                url: this.myUrl,
                routes: Array.from(this.globalRoutes.keys())
            }));
        });

        ws.on('message', (data) => {
            this.handleClusterMessage(clusterId, JSON.parse(data.toString()));
        });

        ws.on('close', () => {
            logger.warn(`[Federation] Disconnected from ${clusterId}`);
            this.clusters.delete(clusterId);
            // Auto-reconnect after delay
            setTimeout(() => this.connectToCluster(clusterId, url, region), 5000);
        });

        this.clusters.set(clusterId, {
            id: clusterId,
            url,
            region,
            ws,
            routes: new Set(),
            lastSeen: Date.now()
        });
    }

    handleClusterMessage(clusterId, message) {
        const cluster = this.clusters.get(clusterId);
        if (!cluster) return;

        cluster.lastSeen = Date.now();

        switch (message.type) {
            case 'FEDERATION_HANDSHAKE':
                logger.info(`[Federation] Handshake from ${message.clusterId}`);
                this.syncRoutes(clusterId, message.routes);
                break;

            case 'ROUTE_UPDATE':
                this.receiveRouteUpdate(clusterId, message.routes);
                break;

            case 'HEARTBEAT':
                // Update last seen
                break;
        }
    }

    /**
     * Synchronize routes across clusters
     */
    syncRoutes(clusterId, routes) {
        const cluster = this.clusters.get(clusterId);
        if (!cluster) return;

        cluster.routes = new Set(routes);

        // Update global routing table
        routes.forEach(target => {
            if (!this.globalRoutes.has(target)) {
                this.globalRoutes.set(target, []);
            }
            const clusters = this.globalRoutes.get(target);
            if (!clusters.includes(clusterId)) {
                clusters.push(clusterId);
            }
        });

        logger.info(`[Federation] Synced ${routes.length} routes from ${clusterId}`);
    }

    receiveRouteUpdate(clusterId, newRoutes) {
        logger.debug(`[Federation] Route update from ${clusterId}`);
        this.syncRoutes(clusterId, newRoutes);
    }

    /**
     * Select best cluster for target based on geo-location
     */
    selectCluster(target, clientRegion = 'US') {
        const availableClusters = this.globalRoutes.get(target) || [];

        if (availableClusters.length === 0) {
            return null; // No cluster has this target
        }

        // Geo-aware selection
        const regionMap = {
            'US': ['NA', 'US'],
            'EU': ['EU', 'Europe'],
            'Asia': ['Asia', 'APAC']
        };

        const preferredRegions = regionMap[clientRegion] || ['US'];

        // Find cluster in preferred region
        for (const clusterId of availableClusters) {
            const cluster = this.clusters.get(clusterId);
            if (cluster && preferredRegions.includes(cluster.region)) {
                return clusterId;
            }
        }

        // Fallback to first available
        return availableClusters[0];
    }

    /**
     * Route message to remote cluster
     */
    async routeToCluster(clusterId, message) {
        const cluster = this.clusters.get(clusterId);

        if (!cluster) {
            throw new Error(`Cluster ${clusterId} not found`);
        }

        if (cluster.ws.readyState !== WebSocket.OPEN) {
            throw new Error(`Cluster ${clusterId} not connected`);
        }

        return new Promise((resolve, reject) => {
            const requestId = `req-${Date.now()}`;

            // Send request
            cluster.ws.send(JSON.stringify({
                type: 'REMOTE_ROUTE',
                requestId,
                message
            }));

            // Wait for response (simplified - real implementation needs timeout)
            const handler = (data) => {
                const response = JSON.parse(data.toString());
                if (response.requestId === requestId) {
                    cluster.ws.off('message', handler);
                    resolve(response.result);
                }
            };

            cluster.ws.on('message', handler);
        });
    }

    /**
     * Broadcast route updates to all clusters
     */
    broadcastRoutes(localRoutes) {
        const message = JSON.stringify({
            type: 'ROUTE_UPDATE',
            routes: localRoutes
        });

        this.clusters.forEach((cluster, id) => {
            if (cluster.ws.readyState === WebSocket.OPEN) {
                cluster.ws.send(message);
            }
        });
    }

    /**
     * Get federation status
     */
    getStatus() {
        return {
            myCluster: this.myClusterId,
            connectedClusters: this.clusters.size,
            globalTargets: this.globalRoutes.size,
            clusters: Array.from(this.clusters.values()).map(c => ({
                id: c.id,
                region: c.region,
                connected: c.ws.readyState === WebSocket.OPEN,
                routes: c.routes.size,
                lastSeen: c.lastSeen
            }))
        };
    }
}

module.exports = FederationManager;
