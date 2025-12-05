# Unikernal v8 – Universal Runtime Engine

## Overview
Unikernal v8 is the Universal Runtime Engine designed to make every programming language talk to each other instantly. It solves the fragmentation problem in polyglot systems, enabling seamless interoperability for the AI era.

## Key Features
- **Cross-language routing**: Support for Python, Java, C, C++, Rust, Go, Kotlin, C#, Swift, PHP, Ruby, R, Lua, Matlab, Haskell, Typescript, Bash, and more.
- **UDL v8 (Universal Description Language)**: A standardized JSON-based messaging envelope for clear communication.
- **UDM v8 (Universal Data Model)**: A robust schema for defining tasks and data structures.
- **Smart Routing Kernel v8**: A high-performance WebSocket-based kernel for intelligent message routing.
- **Cross-language test suite**: Comprehensive Nightmare tests and echo/math/string clients to ensure reliability.
- **Kafka-style ETL pipeline**: Demonstrates powerful data processing capabilities.
- **Workflow builder**: Experimental CLI tools for building and inspecting workflows.

## Architecture
The system follows a hub-and-spoke architecture:
`Clients` → `UDL messages` → `Kernel` → `SmartRouter` → `Adapters` → `Target runtimes`

Key components:
- `kernel/src/server.js`: The main entry point for the kernel.
- `kernel/src/routingKernel.js`: Handles message routing logic.
- `kernel/src/SmartRouter.js`: Intelligent routing decisions.
- `kernel/src/adapterManager.js`: Manages language adapters.
- `adapters/*/adapter.js` or `adapter.py`: Language-specific adapters.

**Protocol**: Version 8.0 (JSON-based envelopes)
**Endpoints**:
- Health: `http://localhost:3000/health`
- Root: `http://localhost:3000/`

## Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- Python 3.x (for Python adapter)
- Other runtimes as needed for specific adapters.

### Installation
```bash
git clone <repo-url>
cd Unikernal
npm install
```

### Start Kernel
```bash
npm start
# or
node tools/cli/unikernal.js run
```

### Health Check
```bash
curl http://localhost:3000/
curl http://localhost:3000/health
```

### Running Tests
**Full Test Suite**
```bash
npm test
npm run test:kernel
npm run test:suite
```

**Individual Clients**
```bash
node tests/echo-client.js
node tests/math-client.js
node tests/string-client.js
node tests/cross-python-client.js
```

**Nightmare Tests (Example)**
```bash
node tests/haskell-matlab-nightmare.js
node tests/nightmare-matrix.js
```

## Examples

### Kafka Pipeline
`examples/kafka_pipeline/pipeline.js`
Demonstrates an ETL-style pipeline running through the kernel.

### Python ↔ Java
`examples/py_java/`
A scenario showing interoperability between Python and Java.

### Multi-node
`examples/multinode/`
Concept for a multi-node cluster.

### Hot Swap
`examples/v8/hot_swap/`
Demonstration of hot-swapping capabilities.

### Workflow Builder
`examples/v8/workflow_builder/`
Experimental workflow builder demo.

## CLI Usage
The CLI is located at `tools/cli/unikernal.js`.

```bash
node tools/cli/unikernal.js --help
node tools/cli/unikernal.js run
node tools/cli/unikernal.js inspect
# If implemented:
node tools/cli/unikernal.js flow build
node tools/cli/unikernal.js adapter reload <adapter-id>
```

## Status & Roadmap
**Current version**: 8.0.0

**Stable features**: Kernel, UDL/UDM v8, health endpoints, test clients, cross-adapter routing.

**Experimental**: Workflow builder, mesh, ETL, advanced AI integration.

## License
Research/prototype engine for global interoperability.
