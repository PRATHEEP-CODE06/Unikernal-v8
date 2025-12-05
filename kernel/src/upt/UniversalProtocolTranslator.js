const logger = require('../logger');

/**
 * Universal Protocol Translator (UPT)
 * Automatically translates between different protocols
 */
class UniversalProtocolTranslator {
    constructor() {
        this.translators = new Map();
        this.registerBuiltInTranslators();
    }

    registerBuiltInTranslators() {
        // REST ↔ gRPC
        this.registerTranslator('rest', 'grpc', this.restToGrpc.bind(this));
        this.registerTranslator('grpc', 'rest', this.grpcToRest.bind(this));

        // SOAP ↔ REST
        this.registerTranslator('soap', 'rest', this.soapToRest.bind(this));
        this.registerTranslator('rest', 'soap', this.restToSoap.bind(this));

        // GraphQL ↔ REST
        this.registerTranslator('graphql', 'rest', this.graphqlToRest.bind(this));
        this.registerTranslator('rest', 'graphql', this.restToGraphql.bind(this));

        // Kafka ↔ RabbitMQ
        this.registerTranslator('kafka', 'rabbitmq', this.kafkaToRabbitMQ.bind(this));
        this.registerTranslator('rabbitmq', 'kafka', this.rabbitMQToKafka.bind(this));

        logger.info("[UPT] Built-in translators registered");
    }

    registerTranslator(fromProtocol, toProtocol, translatorFn) {
        const key = `${fromProtocol}->${toProtocol}`;
        this.translators.set(key, translatorFn);
    }

    async translate(message, fromProtocol, toProtocol) {
        const key = `${fromProtocol}->${toProtocol}`;
        const translator = this.translators.get(key);

        if (!translator) {
            throw new Error(`No translator found for ${fromProtocol} -> ${toProtocol}`);
        }

        logger.debug(`[UPT] Translating ${fromProtocol} -> ${toProtocol}`);
        return translator(message);
    }

    detectProtocol(message, hints = {}) {
        // Auto-detect protocol from message structure and hints
        if (hints.contentType?.includes('application/grpc')) return 'grpc';
        if (hints.contentType?.includes('application/soap+xml')) return 'soap';
        if (hints.contentType?.includes('application/graphql')) return 'graphql';
        if (message.payload?.__proto === 'kafka') return 'kafka';
        if (message.payload?.__proto === 'amqp') return 'rabbitmq';

        // Default to REST
        return 'rest';
    }

    // REST → gRPC translator
    async restToGrpc(restMessage) {
        return {
            service: restMessage.target,
            method: restMessage.payload.operation || 'execute',
            request: {
                ...restMessage.payload
            },
            metadata: {
                ...restMessage.meta,
                'content-type': 'application/grpc'
            }
        };
    }

    // gRPC → REST translator
    async grpcToRest(grpcMessage) {
        return {
            source: grpcMessage.service,
            target: grpcMessage.method,
            payload: grpcMessage.request,
            meta: {
                ...grpcMessage.metadata,
                protocol: 'grpc->rest'
            }
        };
    }

    // SOAP → REST translator
    async soapToRest(soapMessage) {
        // Extract from SOAP envelope
        const body = soapMessage.payload['soap:Body'];
        const operation = Object.keys(body)[0];
        const params = body[operation];

        return {
            source: soapMessage.source,
            target: operation,
            payload: params,
            meta: {
                ...soapMessage.meta,
                protocol: 'soap->rest'
            }
        };
    }

    // REST → SOAP translator
    async restToSoap(restMessage) {
        return {
            source: restMessage.source,
            target: restMessage.target,
            payload: {
                'soap:Envelope': {
                    'soap:Body': {
                        [restMessage.target]: restMessage.payload
                    }
                }
            },
            meta: {
                ...restMessage.meta,
                'content-type': 'application/soap+xml'
            }
        };
    }

    // GraphQL → REST translator
    async graphqlToRest(graphqlMessage) {
        const { query, variables } = graphqlMessage.payload;

        // Parse GraphQL query to extract operation
        const operation = this.parseGraphQLOperation(query);

        return {
            source: graphqlMessage.source,
            target: operation,
            payload: variables || {},
            meta: {
                ...graphqlMessage.meta,
                graphql_query: query,
                protocol: 'graphql->rest'
            }
        };
    }

    // REST → GraphQL translator
    async restToGraphql(restMessage) {
        const operation = restMessage.target;
        const variables = restMessage.payload;

        // Generate GraphQL query
        const query = this.generateGraphQLQuery(operation, variables);

        return {
            source: restMessage.source,
            payload: {
                query,
                variables
            },
            meta: {
                ...restMessage.meta,
                'content-type': 'application/graphql'
            }
        };
    }

    // Kafka → RabbitMQ translator
    async kafkaToRabbitMQ(kafkaMessage) {
        return {
            exchange: kafkaMessage.topic,
            routingKey: kafkaMessage.key || '',
            message: {
                content: Buffer.from(JSON.stringify(kafkaMessage.value)),
                properties: {
                    headers: kafkaMessage.headers,
                    timestamp: kafkaMessage.timestamp
                }
            }
        };
    }

    // RabbitMQ → Kafka translator
    async rabbitMQToKafka(rabbitMQMessage) {
        return {
            topic: rabbitMQMessage.exchange,
            key: rabbitMQMessage.routingKey,
            value: JSON.parse(rabbitMQMessage.message.content.toString()),
            headers: rabbitMQMessage.message.properties.headers,
            timestamp: rabbitMQMessage.message.properties.timestamp || Date.now()
        };
    }

    // Helper: Parse GraphQL operation name
    parseGraphQLOperation(query) {
        const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
        return match ? match[1] : 'execute';
    }

    // Helper: Generate GraphQL query
    generateGraphQLQuery(operation, variables) {
        const fields = Object.keys(variables).join('\n    ');
        return `query ${operation} {
  ${operation} {
    ${fields}
  }
}`;
    }
}

module.exports = UniversalProtocolTranslator;
