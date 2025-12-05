from unikernal.client import UnikernalClient

# Create a client pointing to your running kernel
client = UnikernalClient(
    http_url="http://localhost:4000/udl",
    ws_url="ws://localhost:4000/ws",
    service_id="python-test-service"
)

# Build a simple UDL message
message = {
    "version": "1.0",
    "source": "python-test-service",
    "target": "echo-service",
    "intent": "PING",
    "payload": {
        "msg": "Hello from Python adapter!"
    },
    "meta": {
        "timestamp": "2025-11-28T00:00:00Z",
        "trace_id": "test-trace-123"
    }
}

# Send via HTTP to the kernel
response = client.send_udl_http(message)
print("Kernel response:")
print(response)
