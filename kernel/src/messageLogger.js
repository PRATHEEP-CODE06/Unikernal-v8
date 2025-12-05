const logger = require('./logger');

function logEnvelope(envelope) {
    if (!envelope) return;

    const { source, target, intent, meta } = envelope;
    const traceId = meta?.trace_id || 'no-trace';

    logger.info(`[UMB] ${source} -> ${target} [${intent}]`, {
        traceId,
        timestamp: meta?.timestamp
    });
}

module.exports = {
    logEnvelope
};
