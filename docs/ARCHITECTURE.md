# Unikernal v8 Architecture

## Overview

Unikernal v8 is built on a modular, event-driven architecture centered around the **Universal Message Bus (UMB)**.

```mermaid
graph TD
    Client[Client / CLI] -->|HTTP/WS| Kernel
    Kernel -->|UMB| Router
    Kernel -->|UMB| ILS[Intelligent Language Selector]
    Kernel -->|UMB| PCE[Program Compatibility Engine]
    
    Router -->|UMB| AdapterPython[Python Adapter]
    Router -->|UMB| AdapterNode[Node.js Adapter]
    Router -->|UMB| AdapterNative[Native Adapters (C++, Rust, Go...)]
    
    AdapterPython -->|Execution| RuntimePython
    AdapterNode -->|Execution| RuntimeNode
    AdapterNative -->|Execution| RuntimeNative
```

## Components

### 1. Kernel Core
The central orchestrator. Handles HTTP/WebSocket connections, initializes subsystems, and manages the UMB.

### 2. Universal Message Bus (UMB)
A high-performance event bus supporting:
- Pub/Sub
- Request/Response (RPC)
- Streaming

### 3. Intelligent Language Selector (ILS)
Analyzes natural language queries to determine the best programming language for a task.

### 4. Program Compatibility Engine (PCE)
Virtualizes file paths and syscalls to ensure compatibility across different operating systems and legacy environments.

### 5. Language Adapters
Standardized interfaces for executing code in different languages.
- **WebSocket Adapters**: Run as separate processes (Python, Node.js).
- **Native Adapters**: Wrappers for compiled/interpreted CLI tools (C++, Rust, Go, etc.).

## Data Model (UDM v8)

All tasks are defined using the Universal Data Model (UDM) v8 JSON format.

```json
{
  "model_version": "5.0",
  "task_type": "invoke",
  "language": "python",
  "target": { "function": "my_func" },
  "data": { "arg1": "value" }
}
```
