# Kernel Architecture

## Overview
The Unikernal Kernel is the central hub of the system. It acts as a **Smart Routing Kernel** that facilitates communication between different services.

## Core Responsibilities
1.  **Service Registry**: Maintains a registry of active services and their connection details (WebSocket).
2.  **Message Routing**: Receives UDL messages via HTTP or WebSocket and routes them to the correct target service.
3.  **Validation**: Validates incoming UDL messages against the UDL specification (structure, required fields).
4.  **Logging**: Logs all activities and message flows for observability.

## Components
- **Server**: Entry point, handles HTTP and WebSocket connections.
- **Routing Kernel**: Logic for service registration and message routing.
- **Validator**: Checks message validity.
- **Logger**: Structured JSON logging.
