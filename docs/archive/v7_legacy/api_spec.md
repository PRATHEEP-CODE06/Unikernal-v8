> ?? Legacy Documentation
> This file describes a pre-v8 version of Unikernal (v2/v5/v7).
> It is preserved for history only. For the current version, see the root README.md and docs/v8.

# Unikernal v7 API Specification

## 1. Kernel API
The Kernel exposes a control plane API for management and a data plane API for message passing.

### Control Plane (REST/gRPC)
- `GET /v1/system/status`: Get overall system health.
- `GET /v1/nodes`: List connected nodes.
- `GET /v1/routes`: List active routes.
- `POST /v1/config/reload`: Hot reload configuration.
- `POST /v1/adapters/register`: Manually register an adapter.

### Data Plane (Internal/External)
- `POST /v1/execute`: Execute a command/route.
    - Body: UDM JSON.
- `STREAM /v1/stream`: Bi-directional stream for real-time data.

## 2. Adapter API
Every adapter must implement the standard Adapter Protocol.

- `Initialize(config)`: Setup the adapter.
- `HealthCheck()`: Return status.
- `Process(udm_request)`: Handle an incoming request.
- `Shutdown()`: Graceful cleanup.

## 3. SDK Interface
The generated SDKs provide a unified interface.

```python
# Python SDK Example
client = UnikernalClient()
response = client.call("order_service.create_order", {
    "product_id": 123,
    "quantity": 1
})
```

