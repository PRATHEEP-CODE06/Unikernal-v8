# Example: Protocol Translation Demo

## Overview
This example demonstrates Unikernal v8's Universal Protocol Translator (UPT) automatically converting between REST and gRPC.

## Scenario
- **Client**: Sends REST API request
- **Service**: Expects gRPC calls
- **UPT**: Automatically translates REST ↔ gRPC

## Setup

### 1. Start Unikernal v8
```bash
node kernel/src/server.js
```

### 2. Start gRPC Service (simulated)
```bash
# In examples/v8/protocol_translation/
node grpc_service.js
```

## Test Translation

### REST Client → gRPC Service
```bash
curl -X POST http://localhost:8080/udl \
  -H "Content-Type: application/json" \
  -d '{
    "source": "rest-client",
    "target": "grpc-service",
    "payload": {
      "operation": "getUserProfile",
      "user_id": 123
    },
    "meta": {
      "translate_to": "grpc"
    }
  }'
```

**What Happens**:
1. UPT detects target protocol is gRPC
2. Converts REST payload to gRPC message format
3. Routes to gRPC service
4. Receives gRPC response
5. Converts back to REST
6. Returns to client

## Supported Translations

| From | To | Status |
|------|-----|--------|
| REST | gRPC | ✅ Active |
| gRPC | REST | ✅ Active |
| SOAP | REST | ✅ Active |
| GraphQL | REST | ✅ Active |
| Kafka | RabbitMQ | ✅ Active |

## Custom Translation

Add your own protocol translator:
```javascript
const upt = require('../../kernel/src/upt/UniversalProtocolTranslator');
upt.registerTranslator('custom', 'rest', async (msg) => {
  // Your translation logic
  return transformedMessage;
});
```

## Benefits
- ✅ No code changes to existing services
- ✅ Automatic protocol detection
- ✅ Bi-directional translation
- ✅ Zero configuration
