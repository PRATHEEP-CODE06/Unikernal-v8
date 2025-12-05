# UDM Overview

## What is UDM?
Universal Data Model (UDM) is a **logical data model** layer that uses JSON Schema–style definitions to describe common entities in the Unikernal ecosystem.

## Purpose
- **Standardization**: Defines a common language for data entities (User, Order, Product, etc.) across different services.
- **Independence**: It is independent of implementation technologies. It can be mapped to SQL tables, NoSQL documents, REST API resources, etc.
- **Interoperability**: Ensures that a "User" object sent from a Python service looks the same as one received by a Node.js service.

## Schema Definitions
UDM schemas are defined in the `udm/` directory as JSON files. These schemas specify the structure, types, and required fields for each entity.
