> ?? Legacy Documentation
> This file describes a pre-v8 version of Unikernal (v2/v5/v7).
> It is preserved for history only. For the current version, see the root README.md and docs/v8.

# Unikernal v7 Distributed Runtime Specification

## 1. Overview
Unikernal v7 supports running on a single node or a distributed cluster of thousands of nodes. The runtime abstracts the physical infrastructure from the logical systems.

## 2. Architecture
- **Master-less Architecture**: Peer-to-peer model where all nodes are equal (or leader-elected for specific tasks).
- **Gossip Protocol**: Uses a gossip protocol (like SWIM) for node discovery and failure detection.

## 3. Node Types
- **Core Node**: Runs the Kernel and manages routing.
- **Adapter Node**: Runs specific adapters (e.g., a node dedicated to running Python ML models).
- **Edge Node**: Lightweight node for IoT or remote locations.

## 4. Features
- **Service Discovery**: Automatic registration of adapters across the cluster.
- **Load Balancing**:
    - **Round Robin**: Simple distribution.
    - **Least Connection**: Route to the least busy node.
    - **Latency-Aware**: Route to the closest/fastest node.
- **Failover**:
    - If a node fails, traffic is instantly rerouted to healthy replicas.
    - State is replicated (if configured) to prevent data loss.
- **Distributed Configuration**:
    - Changes to UDL or Policies are propagated to all nodes in milliseconds.
    - Uses a consensus algorithm (Raft/Paxos) for critical state changes.

## 5. Deployment
- **Docker/Kubernetes**: Native support for containerized deployment.
- **Bare Metal**: Can run as a systemd service or standalone binary.

