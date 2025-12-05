function validateUDL(message) {
    const errors = [];

    if (!message) {
        return { valid: false, errors: ["Message is empty"] };
    }

    const requiredFields = ["version", "source", "target", "intent", "payload", "meta"];
    requiredFields.forEach((field) => {
        if (!message[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    });

    if (message.meta) {
        if (!message.meta.timestamp) {
            errors.push("Missing required meta field: timestamp");
        }
        if (!message.meta.trace_id) {
            errors.push("Missing required meta field: trace_id");
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true, errors: [] };
}

module.exports = { validateUDL };
