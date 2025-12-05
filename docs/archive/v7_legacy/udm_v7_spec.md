> ?? Legacy Documentation
> This file describes a pre-v8 version of Unikernal (v2/v5/v7).
> It is preserved for history only. For the current version, see the root README.md and docs/v8.

# Universal Data Model (UDM) v7 Specification

## Overview
UDM is the lingua franca of Unikernal. All data entering the kernel is converted to UDM, and all data leaving is converted from UDM to the target format.

## Structure
UDM is a structured format supporting:
- **Primitives**: String, Integer, Float, Boolean, Null.
- **Complex Types**: Map (Dictionary), List (Array), Struct (Typed Object).
- **Binary**: Raw bytes support.
- **Metadata**: Headers for tracing, auth, and routing info.

## JSON Representation
```json
{
  "meta": {
    "id": "req_12345",
    "source": "user_service",
    "target": "order_db",
    "trace_id": "abc-xyz",
    "auth": { "token": "..." }
  },
  "payload": {
    "type": "struct",
    "name": "User",
    "data": {
      "id": 1,
      "name": "Alice",
      "roles": ["admin", "editor"]
    }
  }
}
```

## Type System
UDM v7 enforces strict typing options:
- **Any**: Dynamic typing (default).
- **Strict**: Schema validation against defined UDL types.

## Auto-Inference
Adapters automatically infer UDM types from native types:
- Python `dict` -> UDM `Map`
- Java `POJO` -> UDM `Struct`
- SQL `Row` -> UDM `Map`
- JSON -> UDM `Map/List`

## Serialization
- **Text**: JSON (for debugging and web).
- **Binary**: Protobuf or MessagePack (for internal performance).

