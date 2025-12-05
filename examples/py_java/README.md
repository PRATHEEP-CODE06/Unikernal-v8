# Example: Python ↔ Java Communication

This example demonstrates cross-language communication between Python and Java services using Unikernal v8.

## Architecture
- **Python Service**: Handles data processing
- **Java Service**: Handles business logic
- **Unikernal Kernel**: Routes messages between services

## Files
- `python_service.py` - Python adapter service
- `JavaService.java` - Java adapter service
- `README.md` - This file

## Setup

### 1. Start Unikernal Kernel
```bash
cd ../../
node kernel/src/server.js
```

### 2. Start Python Service
```bash
python examples/py_java/python_service.py
```

### 3. Start Java Service
```bash
javac examples/py_java/JavaService.java
java -cp examples/py_java JavaService
```

## Test
Send a message from Python to Java:
```bash
curl -X POST http://localhost:8080/udl -H "Content-Type: application/json" -d '{
  "source": "python-service",
  "target": "java-service",
  "payload": {"action": "process", "data": [1,2,3]}
}'
```

## How It Works
1. Python service registers with Kernel as `python-service`
2. Java service registers with Kernel as `java-service`
3. Kernel routes messages using SmartRoutingEngine
4. UDM v8 ensures data compatibility between languages
