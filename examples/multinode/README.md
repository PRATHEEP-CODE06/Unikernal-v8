# Example: Multi-Node Deployment

This example demonstrates Unikernal v8's distributed runtime capabilities with multiple nodes.

## Architecture
```
Node 1 (Port 8080) ← → Node 2 (Port 8081) ← → Node 3 (Port 8082)
```

- **Node Discovery**: Automatic peer discovery
- **Load Balancing**: Requests distributed across nodes
- **Failover**: Automatic rerouting on node failure
- **Config Sync**: Cluster-wide configuration synchronization

## Setup

### Terminal 1: Node 1 (Primary)
```bash
PORT=8080 node kernel/src/server.js
```

### Terminal 2: Node 2
```bash
PORT=8081 PEERS=ws://localhost:8080/ws node kernel/src/server.js
```

### Terminal 3: Node 3
```bash
PORT=8082 PEERS=ws://localhost:8080/ws,ws://localhost:8081/ws CLUSTER_MODE=true node kernel/src/server.js
```

## Test Load Balancing
```bash
# Send 10 requests - watch them distribute across nodes
for i in {1..10}; do
  curl -X POST http://localhost:8080/udl -H "Content-Type: application/json" -d '{
    "source": "client",
    "target": "echo-service",
    "payload": {"message": "Request '$i'"}
  }'
done
```

## Test Failover
1. Kill Node 2 (`Ctrl+C` in Terminal 2)
2. Send a request - it will automatically reroute
3. Restart Node 2 - it will automatically rejoin the cluster

## Monitoring
- Node 1 Dashboard: http://localhost:8080/dashboard
- Node 2 Dashboard: http://localhost:8081/dashboard
- Node 3 Dashboard: http://localhost:8082/dashboard
