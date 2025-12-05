# Example: Hot-Swappable Adapter Demo

## Overview
Update a running adapter without downtime using Unikernal v8's hot-swap capability.

## Scenario
- Running Python adapter v1.0
- Deploy Python adapter v2.0
- Zero downtime
- Automatic rollback if errors detected

## Setup

### 1. Start Kernel with Python Adapter v1.0
```bash
node kernel/src/server.js
# Python adapter v1.0 automatically starts
```

### 2. Verify Current Version
```bash
curl http://localhost:8080/services
# Shows python-adapter v1.0
```

## Hot-Swap Process

### 1. Deploy New Version
```bash
unikernal adapter reload python-adapter --version 2.0
```

**Process**:
```
Step 1: Load v2.0 in parallel
Step 2: Route 10% traffic to v2.0  
Step 3: Monitor error rates (30s)
Step 4: Gradually increase to 100%
Step 5: Drain v1.0
Step 6: Unload v1.0
```

### 2. Monitor Traffic Split
```bash
# Check current traffic distribution
curl http://localhost:8080/adapter-stats

# Response:
{
  "python-adapter": {
    "v1.0": "20%",
    "v2.0": "80%"
  }
}
```

### 3. Automatic Rollback (if errors)
If error rate > 10%:
- Instantly route 100% back to v1.0
- Unload v2.0
- Notify admin

## Deployment Strategies

### Blue-Green (Instant)
```bash
unikernal adapter reload python-adapter \
  --version 2.0 \
  --strategy blue-green
```

### Canary (Gradual)
```bash
unikernal adapter reload python-adapter \
  --version 2.0 \
  --strategy canary \
  --percentage 10
```

## Benefits
- ✅ Zero downtime
- ✅ Automatic rollback
- ✅ Traffic split testing
- ✅ State preservation
- ✅ In-flight request completion
