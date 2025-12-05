# Example: Visual Workflow Builder Demo

## Overview
Create a complete data pipeline without writing code using the Visual Workflow Builder.

## Scenario
Build a user registration pipeline:
```
REST API → Validate → Transform → PostgreSQL → Send Welcome Email
```

## Steps

### 1. Open Workflow Builder
```bash
# Start kernel
node kernel/src/server.js

# Open browser
http://localhost:8080/workflow-builder
```

### 2. Drag Nodes to Canvas
1. **Source Node**: REST API (port 8080)
2. **Validate Node**: User schema
3. **Transform Node**: Map fields
4. **Target Node**: PostgreSQL
5. **Target Node**: Email service

### 3. Connect Nodes
Click and drag between nodes to create data flow.

### 4. Configure Each Node

#### Source (REST API)
```json
{
  "type": "rest",
  "port": 8080,
  "path": "/register"
}
```

#### Validate
```json
{
  "schema": {
    "email": { "type": "string", "required": true },
    "password": { "type": "string", "required": true, "min": 8 }
  }
}
```

#### Transform
```json
{
  "mapping": {
    "user_email": "email",
    "hashed_password": "HASH(password)",
    "created_at": "NOW()"
  }
}
```

#### Target (PostgreSQL)
```json
{
  "type": "postgres",
  "connection": "prod_db",
  "table": "users"
}
```

### 5. Generate UDL
Click **"Generate UDL"** button.

Generated:
```yaml
version: "8.0"
workflow:
  name: user-registration
  nodes:
    - id: source-1
      type: source
      config: {...}
    - id: validate-1
      type: validate
      config: {...}
    - id: transform-1
      type: transform
      config: {...}
    - id: target-1
      type: target
      config: {...}
  connections:
    - from: source-1
      to: validate-1
    - from: validate-1
      to: transform-1
    - from: transform-1
      to: target-1
```

### 6. Deploy
Click **"Deploy"** to activate the workflow.

## Test the Workflow
```bash
curl -X POST http://localhost:8080/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**Flow Execution**:
1. ✅ Validates email and password
2. ✅ Transforms to database format
3. ✅ Inserts into PostgreSQL
4. ✅ Sends welcome email
5. ✅ Returns success response

## Features
- 🎨 Drag-and-drop interface
- 🔄 Real-time validation
- 📝 Auto-generates UDL v8
- 🚀 One-click deployment
- 💾 Save and share workflows

## Benefits
- ✅ Zero code required
- ✅ Visual debugging
- ✅ Rapid prototyping
- ✅ Team collaboration
