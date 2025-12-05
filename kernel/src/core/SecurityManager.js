const crypto = require('crypto');
const logger = require('../logger');

class SecurityManager {
    constructor() {
        this.apiKeys = new Map(); // key -> metadata
        this.tokens = new Map(); // token -> metadata

        // Load default keys (in production, load from secure vault)
        this.apiKeys.set("admin-key", { role: "admin", user: "system" });
        this.apiKeys.set("adapter-key", { role: "adapter", user: "adapter" });
    }

    validateApiKey(key) {
        if (this.apiKeys.has(key)) {
            return { valid: true, ...this.apiKeys.get(key) };
        }
        return { valid: false, error: "Invalid API Key" };
    }

    generateToken(identity) {
        const token = crypto.randomBytes(32).toString('hex');
        this.tokens.set(token, { identity, expires: Date.now() + 3600000 }); // 1 hour
        return token;
    }

    validateToken(token) {
        if (this.tokens.has(token)) {
            const data = this.tokens.get(token);
            if (Date.now() > data.expires) {
                this.tokens.delete(token);
                return { valid: false, error: "Token expired" };
            }
            return { valid: true, identity: data.identity };
        }
        return { valid: false, error: "Invalid Token" };
    }

    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = SecurityManager;
