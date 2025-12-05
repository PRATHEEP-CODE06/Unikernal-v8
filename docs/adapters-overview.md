# Adapters Overview

## What are Adapters?
Adapters are language-specific client libraries that make it easy for services to connect to the Unikernal Kernel.

## Provided Adapters
1.  **Python Adapter**: A Python library (`unikernal`) that provides a `UnikernalClient` class.
2.  **Node.js Adapter**: A Node.js library (`unikernal-adapter`) that provides a `UnikernalClient` class.

## Functionality
Adapters handle:
- **Connection**: Establishing WebSocket connections to the Kernel.
- **Registration**: Automatically registering the service with the Kernel upon connection.
- **Message Creation**: Helper methods to build valid UDL messages.
- **Sending**: Sending messages via HTTP or WebSocket.
- **Receiving**: Listening for incoming messages over WebSocket.
