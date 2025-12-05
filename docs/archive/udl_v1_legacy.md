> ⚠️ Legacy Documentation
> This file describes a pre-v8 version of Unikernal (v2/v5/v7).
> It is preserved for history only. For the current version, see the root README.md and docs/v8.

# UDL v1 Specification

## Overview
Universal Digital Language (UDL) is a JSON-based message format designed for interoperability between services in the Unikernal ecosystem.

## Message Structure
All UDL messages are JSON objects with the following top-level fields:

- `version` (string, required): The UDL version, e.g., "1.0".
- `source` (string, required): ID of the sending service.
- `target` (string, required): ID of the destination service.
- `intent` (string, required): The action requested (e.g., "CREATE_ORDER", "PING").
- `payload` (object, required): Domain data, which may follow UDM schemas.
- `meta` (object, required): Metadata for the message.

### Metadata Fields
The `meta` object must contain:
- `timestamp` (string, required): ISO 8601 formatted string (e.g., "2025-11-28T00:00:00Z").
- `trace_id` (string, required): UUID for tracing the request.
- `correlation_id` (string, optional): ID to correlate responses with requests.

## Error UDL Format
If an error occurs, the `payload` should contain error details, or a specific error message structure can be used. A standard error message should have an `intent` of "ERROR" (or specific error intent) and a payload containing:

- `error_code` (string): A unique code for the error.
- `error_message` (string): A human-readable message.
- `details` (object, optional): Additional context.

## Versioning
- New optional fields can be added without bumping the major version.
- Breaking changes (removing required fields, changing field types) require a version bump (e.g., "2.0").

## Examples

### 1. PING Message
```json
{
  "version": "1.0",
  "source": "python-test-service",
  "target": "echo-service",
  "intent": "PING",
  "payload": {
    "msg": "Hello World"
  },
  "meta": {
    "timestamp": "2025-11-28T10:00:00Z",
    "trace_id": "abc-123-uuid",
    "correlation_id": "req-001"
  }
}
```

### 2. CREATE_USER Message
```json
{
  "version": "1.0",
  "source": "web-frontend",
  "target": "user-service",
  "intent": "CREATE_USER",
  "payload": {
    "id": "u-100",
    "name": "Alice",
    "email": "alice@example.com",
    "created_at": "2025-11-28T10:05:00Z"
  },
  "meta": {
    "timestamp": "2025-11-28T10:05:00Z",
    "trace_id": "def-456-uuid"
  }
}
```

### 3. Error Message
```json
{
  "version": "1.0",
  "source": "user-service",
  "target": "web-frontend",
  "intent": "ERROR",
  "payload": {
    "error_code": "USER_ALREADY_EXISTS",
    "error_message": "A user with email alice@example.com already exists.",
    "details": {
      "conflicting_id": "u-99"
    }
  },
  "meta": {
    "timestamp": "2025-11-28T10:06:00Z",
    "trace_id": "def-456-uuid",
    "correlation_id": "req-002"
  }
}
```
