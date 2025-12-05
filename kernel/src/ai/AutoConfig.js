const fs = require('fs');
const logger = require('../logger');

class AutoConfig {
    static detect() {
        const config = {
            environment: 'development',
            concurrency: 1,
            logLevel: 'INFO'
        };

        // 1. Detect Containerization
        if (fs.existsSync('/.dockerenv')) {
            config.environment = 'docker';
            logger.info("[AutoConfig] Docker environment detected");
        }

        // 2. Detect Cloud (Simple env check)
        if (process.env.AWS_REGION) {
            config.environment = 'aws';
            logger.info("[AutoConfig] AWS environment detected");
        }

        // 3. Detect Resources
        // Node.js os module could be used here
        // For now, simple logic
        if (process.env.NODE_ENV === 'production') {
            config.logLevel = 'WARN';
            config.concurrency = 4; // Auto-scale
        }

        return config;
    }
}

module.exports = AutoConfig;
