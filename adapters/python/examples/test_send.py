from unikernal.client import UnikernalClient

# Create a client pointing to the running kernel
client = UnikernalClient(
    http_url="http://localhost:4000/udl",
    ws_url="ws://localhost:4000/ws",
    service_id="python-test-service",
)

# Build a UDL message for STRING SERVICE
message = {
    "version": "1.0",
    "source": "python-test-service",
    "target": "string-service",   # <--- IMPORTANT
    "intent": "PING",
    "payload": {
        "operation": "upper",     # upper / lower / length / concat
        "text": "unikernal is awesome"
    },
    "meta": {
        "timestamp": "2025-11-28T00:00:00Z",
        "trace_id": "string-test-123"
    }
}

# Send message to the kernel via HTTP
response = client.send_udl_http(message)
print("Kernel response:")
print(response)
