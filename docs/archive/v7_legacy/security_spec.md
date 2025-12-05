> ?? Legacy Documentation
> This file describes a pre-v8 version of Unikernal (v2/v5/v7).
> It is preserved for history only. For the current version, see the root README.md and docs/v8.

# Unikernal v7 Security Specification

## 1. Overview
Security in Unikernal v7 is "Enterprise-Grade" and "Zero Trust". Every component, connection, and request is verified.

## 2. Adapter-Level Security
- **mTLS (Mutual TLS)**: All adapters must authenticate with the Kernel using mTLS certificates.
- **API Keys**: For simple adapters or external clients, API Key authentication is supported.
- **Secrets Management**: Adapters do not store secrets. Secrets are injected by the Kernel at runtime from a secure vault.

## 3. Kernel-Level Security
- **Authentication**:
    - **System Auth**: Verifies adapters via mTLS/Tokens.
    - **User Auth**: Passthrough support for OAuth2/JWT.
- **Authorization (RBAC)**:
    - Policies define which systems can call which routes.
    - Example: `web_frontend` can call `get_products` but NOT `drop_table`.
- **Rate Limiting**:
    - Global and per-client limits.
    - DDoS protection via adaptive rate limiting.
- **Input Validation**:
    - All UDM payloads are validated against schemas before processing.

## 4. Distributed Security
- **Node Identity**: Each node has a unique cryptographic identity.
- **Encrypted Gossip**: Cluster state is shared via encrypted channels.
- **Isolation**: Multi-tenant support with logical isolation of resources.

## 5. Observability Security
- **Audit Logs**: Immutable logs of all security events (login, access denied, config change).
- **Anomaly Detection**: AI models monitor for unusual traffic patterns (e.g., sudden spike in database deletion requests).
- **Auto-Block**: The system can automatically block malicious IPs or compromised adapters.

