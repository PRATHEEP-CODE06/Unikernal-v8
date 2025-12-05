# Unikernal v8 API Reference

## HTTP Endpoints

### `POST /api/v8/task`
Submit a task for execution.

**Request Body:**
```json
{
  "model_version": "5.0",
  "task_type": "invoke",
  "language": "python",
  "target": { "function": "print" },
  "data": { "message": "Hello" }
}
```

**Response:**
```json
{
  "taskId": "uuid",
  "status": "success",
  "result": "..."
}
```

### `GET /health`
Check system health.

## WebSocket API

Connect to `ws://localhost:3000`.

### Commands

#### `subscribe`
Subscribe to a topic.
```json
{ "cmd": "subscribe", "topic": "kernel:metrics" }
```

#### `publish`
Publish an event.
```json
{ "cmd": "publish", "topic": "my:topic", "payload": {} }
```

## UDM v8 Specification

See `udm/` directory for JSON schemas.
