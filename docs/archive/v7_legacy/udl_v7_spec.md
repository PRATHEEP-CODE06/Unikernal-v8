> ?? Legacy Documentation
> This file describes a pre-v8 version of Unikernal (v2/v5/v7).
> It is preserved for history only. For the current version, see the root README.md and docs/v8.

# Universal Definition Language (UDL) v7 Specification

## Overview
UDL is a declarative language used to define the behavior, connections, and policies of the Unikernal system. It is designed to be human-readable and machine-parseable.

## Syntax
UDL uses a YAML-like structure or a custom DSL. For v7, we standardize on a YAML-based schema for broad compatibility, with optional DSL syntax support.

## Core Concepts

### 1. Systems
Defines the connected entities (Adapters).

```yaml
systems:
  user_service:
    type: python
    path: ./services/user.py
    instances: 3
  
  order_db:
    type: postgres
    connection: postgres://user:pass@localhost:5432/db
```

### 2. Routes
Defines how data flows between systems.

```yaml
routes:
  - from: user_service.create_user
    to: order_db.insert_user
    policy: retry_3x
  
  - from: web_frontend.get_orders
    to: order_db.query_orders
    cache: 60s
```

### 3. Pipelines
Defines complex workflows.

```yaml
pipelines:
  process_order:
    steps:
      - name: validate
        system: user_service.validate
      - name: charge
        system: payment_gateway.charge
      - name: save
        system: order_db.save
    on_error:
      - system: notification.send_alert
```

### 4. Policies
Defines security and operational rules.

```yaml
policies:
  retry_3x:
    type: retry
    attempts: 3
    backoff: exponential
  
  rate_limit_api:
    type: rate_limit
    limit: 100
    window: 1m
```

## v7 Features
- **Inheritance**: Policies can inherit from base policies.
- **Variables**: Support for environment variables `${ENV_VAR}`.
- **Imports**: Split UDL into multiple files `import: ./modules/auth.udl`.

