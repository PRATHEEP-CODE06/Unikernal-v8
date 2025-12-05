> ?? Legacy Documentation
> This file describes a pre-v8 version of Unikernal (v2/v5/v7).
> It is preserved for history only. For the current version, see the root README.md and docs/v8.

# Unikernal v7 Folder Structure

```
Unikernal/
├── bin/                    # Binary executables (CLI)
├── config/                 # Configuration files
│   ├── default.udl         # Default system definition
│   ├── security.yaml       # Security policies
│   └── cluster.yaml        # Distributed config
├── docs/                   # Documentation
│   └── v7/                 # v7 Specifications
├── kernel/                 # Core Kernel Logic
│   ├── src/
│   │   ├── core/           # Core engines (Routing, Execution)
│   │   ├── security/       # Security modules (Auth, Policies)
│   │   ├── distributed/    # Clustering logic
│   │   ├── ai/             # AI & Intelligence modules
│   │   ├── udm/            # UDM Encoder/Decoder
│   │   └── udl/            # UDL Parser
│   └── server.js           # Entry point
├── adapters/               # Adapter Implementations
│   ├── python/
│   ├── node/
│   ├── java/
│   ├── go/
│   ├── rust/
│   ├── db/                 # Database adapters
│   ├── messaging/          # Messaging adapters
│   └── protocol/           # Protocol adapters
├── sdk/                    # Generated SDKs
├── tools/                  # Developer Tools
│   ├── cli/                # CLI source
│   └── dashboard/          # Web Dashboard
├── examples/               # v7 Examples
│   ├── py_java/
│   ├── go_node/
│   └── ...
├── tests/                  # Test Suite
└── package.json
```

