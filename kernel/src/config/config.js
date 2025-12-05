/**
 * Unikernal v8 Configuration
 * Centralized configuration management.
 */

const path = require('path');

const config = {
    system: {
        name: 'Unikernal v8',
        version: '8.0.0',
        environment: process.env.NODE_ENV || 'development',
        root: path.resolve(__dirname, '../../..'),
    },
    kernel: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        logLevel: process.env.LOG_LEVEL || 'info',
    },
    umb: {
        maxMessageSize: 100 * 1024 * 1024, // 100MB
        pingInterval: 30000,
    },
    paths: {
        adapters: path.resolve(__dirname, '../../../adapters'),
        logs: path.resolve(__dirname, '../../../logs'),
        data: path.resolve(__dirname, '../../../data'),
    },
    timeouts: {
        taskExecution: 30000, // 30s default
        adapterHandshake: 5000,
    }
};

module.exports = config;
