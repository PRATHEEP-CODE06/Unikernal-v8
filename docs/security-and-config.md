# Security and Configuration

## Security Status
> [!WARNING]
> **v1 is NOT production-secure.**

This version is intended for development and demonstration purposes only. It lacks authentication, encryption, and access control.

## Future Security Plans
- **API Keys**: Require API keys for service registration and message sending.
- **Auth Tokens**: Implement JWT or similar for service authentication.
- **TLS**: Enforce HTTPS and WSS for all communications.
- **Rate Limiting**: Protect the Kernel from flooding.
- **Allowlists/Denylists**: Control which services can register and communicate.

## Configuration
Configuration is handled via JSON files or environment variables (in future versions).
Currently, the `config/unikernal.example.config.json` file provides a template for client configuration.

### Example Configuration
```json
{
  "kernelHttpUrl": "http://localhost:4000/udl",
  "kernelWsUrl": "ws://localhost:4000/ws",
  "serviceId": "example-service"
}
```
