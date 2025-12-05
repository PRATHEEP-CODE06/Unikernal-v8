const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch (err) {
        console.error("Failed to create logs directory:", err);
    }
}

const INFO_LOG = path.join(LOG_DIR, 'kernel.log');
const ERROR_LOG = path.join(LOG_DIR, 'error.log');

function formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`;
}

function writeToFile(file, text) {
    try {
        fs.appendFileSync(file, text + '\n');
    } catch (err) {
        console.error(`Failed to write to log file ${file}:`, err);
    }
}

const logger = {
    info: (message, meta) => {
        const text = formatMessage('info', message, meta);
        console.log(text); // Clean console output
        writeToFile(INFO_LOG, text);
    },
    error: (message, meta) => {
        const text = formatMessage('error', message, meta);
        console.error(text);
        writeToFile(ERROR_LOG, text);
    },
    warn: (message, meta) => {
        const text = formatMessage('warn', message, meta);
        console.warn(text);
        writeToFile(INFO_LOG, text);
    },
    debug: (message, meta) => {
        if (process.env.DEBUG === 'true') {
            const text = formatMessage('debug', message, meta);
            console.log(text);
            writeToFile(INFO_LOG, text);
        }
    }
};

module.exports = logger;
