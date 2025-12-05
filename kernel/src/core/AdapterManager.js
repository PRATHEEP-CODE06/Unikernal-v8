const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../logger');

class AdapterManager {
    constructor(adaptersDir) {
        this.adaptersDir = adaptersDir;
        this.activeAdapters = new Map();
    }

    /**
     * Scan for adapters and start them.
     */
    scanAndStart() {
        logger.info(`[AdapterManager] Scanning ${this.adaptersDir}`);

        if (!fs.existsSync(this.adaptersDir)) {
            logger.warn(`[AdapterManager] Adapters directory not found: ${this.adaptersDir}`);
            return;
        }

        const entries = fs.readdirSync(this.adaptersDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                this.detectAndStart(path.join(this.adaptersDir, entry.name), entry.name);
            }
        }
    }

    detectAndStart(dirPath, name) {
        // Check for adapter.json or known files
        if (fs.existsSync(path.join(dirPath, 'adapter.json'))) {
            const config = JSON.parse(fs.readFileSync(path.join(dirPath, 'adapter.json')));
            this.startAdapter(dirPath, config);
        } else if (fs.existsSync(path.join(dirPath, 'adapter.py'))) {
            this.startAdapter(dirPath, { type: 'python', entry: 'adapter.py', id: `python-${name}` });
        } else if (fs.existsSync(path.join(dirPath, 'adapter.js'))) {
            this.startAdapter(dirPath, { type: 'node', entry: 'adapter.js', id: `node-${name}` });
        }
        // Add more detections (Go, Java, etc.)
    }

    startAdapter(dirPath, config) {
        if (this.activeAdapters.has(config.id)) return;

        logger.info(`[AdapterManager] Starting adapter: ${config.id}`);

        let child;
        if (config.type === 'python') {
            child = spawn('python', [config.entry], { cwd: dirPath, stdio: 'inherit' });
        } else if (config.type === 'node') {
            child = spawn('node', [config.entry], { cwd: dirPath, stdio: 'inherit' });
        }
        // Add more runners

        if (child) {
            this.activeAdapters.set(config.id, child);
            child.on('exit', (code) => {
                console.log(`[AdapterManager] Adapter ${config.id} exited with code ${code}`);
                this.activeAdapters.delete(config.id);
                // Auto-restart logic could go here
            });
        }
    }
}

module.exports = AdapterManager;
