> ?? Legacy Documentation
> This file describes a pre-v8 version of Unikernal (v2/v5/v7).
> It is preserved for history only. For the current version, see the root README.md and docs/v8.

# Unikernal v7 Automation Specification

## 1. Overview
Unikernal v7 aims for "Zero Manual Configuration". The system should auto-detect, auto-configure, and auto-heal.

## 2. Automatic Adapter Detection
- **Scan**: The Kernel scans the `adapters/` directory and known paths.
- **Identify**: It reads `adapter.json` or parses the code to identify the language and capabilities.
- **Register**: Automatically registers the adapter in the System Registry.
- **Hot Reload**: Detects new adapters added at runtime without restart.

## 3. Automatic Routing
- **Intent-Based Routing**: User defines "I want to save this user", system finds the best "save user" route.
- **Dynamic Optimization**: If a route becomes slow, the system automatically tries alternative paths.

## 4. Automatic Environment Selection
- **Dev/Prod Detection**: Detects environment (Local, K8s, AWS) and adjusts logging/security levels.
- **Resource Tuning**: Auto-tunes thread pools and memory limits based on available hardware.

## 5. Automatic SDK Generation
- The Kernel exposes an OpenAPI/gRPC reflection endpoint.
- Clients can download auto-generated SDKs for their language on the fly.
- `unikernal sdk generate python`

## 6. Self-Healing
- **Restart**: Auto-restarts crashed adapters.
- **Circuit Break**: Opens circuit on repeated failures to prevent cascading.
- **Scale**: Auto-scales adapter instances based on load (if running in a container orchestrator).

