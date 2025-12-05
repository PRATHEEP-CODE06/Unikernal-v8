# Example: Kafka Pipeline

This example demonstrates a data processing pipeline using Kafka and Unikernal v8.

## Architecture
```
Kafka Producer → Kafka Topic → Unikernal Pipeline → Database
```

## Pipeline Steps
1. **Ingest**: Read from Kafka topic
2. **Transform**: Process/validate data
3. **Enrich**: Add metadata
4. **Store**: Write to database

## Setup (Requires Kafka)

### 1. Start Kafka
```bash
# Start Zookeeper
zookeeper-server-start config/zookeeper.properties

# Start Kafka
kafka-server-start config/server.properties

# Create topic
kafka-topics --create --topic unikernal-events --bootstrap-server localhost:9092
```

### 2. Start Unikernal
```bash
node kernel/src/server.js
```

### 3. Run Pipeline
```bash
node examples/kafka_pipeline/pipeline.js
```

## Test
```bash
# Send test message to Kafka
kafka-console-producer --topic unikernal-events --bootstrap-server localhost:9092
> {"event": "user_signup", "user_id": 123}
```

## How It Works
1. Kafka adapter listens to topic
2. Messages converted to UDM v8
3. Pipeline Engine executes transformation steps
4. Final data routed to database adapter
