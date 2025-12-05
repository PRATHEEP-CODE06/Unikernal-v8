const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

class AdapterManager {
    constructor(adaptersDir) {
        this.adaptersDir = adaptersDir;
        this.processes = {};
        this.adapterStatus = {};
    }

    scanAndStart() {
        logger.info(`[AdapterManager] Scanning adapters in ${this.adaptersDir}`);

        if (!fs.existsSync(this.adaptersDir)) {
            logger.error(`[AdapterManager] Adapters directory not found: ${this.adaptersDir}`);
            return;
        }

        const entries = fs.readdirSync(this.adaptersDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                this.startAdapter(entry.name);
            }
        }
    }

    startAdapter(name) {
        const adapterPath = path.join(this.adaptersDir, name);
        const adapterId = `${name}-adapter-v8-${uuidv4().substring(0, 8)}`;

        // Detect adapter type
        let command = null;
        let args = [];

        if (fs.existsSync(path.join(adapterPath, 'adapter.js'))) {
            // Node.js Wrapper or Adapter
            command = 'node';
            args = ['adapter.js'];
        } else if (fs.existsSync(path.join(adapterPath, 'package.json'))) {
            // Node.js Project
            command = 'npm';
            args = ['start'];
        } else if (fs.existsSync(path.join(adapterPath, 'requirements.txt')) || fs.existsSync(path.join(adapterPath, 'main.py')) || fs.existsSync(path.join(adapterPath, 'adapter.py'))) {
            // Python
            command = 'python';
            args = [fs.existsSync(path.join(adapterPath, 'main.py')) ? 'main.py' : 'adapter.py'];
        } else if (fs.existsSync(path.join(adapterPath, 'go.mod'))) {
            // Go
            command = 'go';
            args = ['run', '.'];
        } else if (fs.existsSync(path.join(adapterPath, 'Cargo.toml'))) {
            // Rust
            command = 'cargo';
            args = ['run'];
        }

        if (command) {
            logger.info(`[AdapterManager] Starting adapter: ${name} (${command} ${args.join(' ')})`);

            try {
                // SECURE SPAWN - NO shell:true
                const child = spawn(command, args, {
                    cwd: adapterPath,
                    stdio: 'pipe'
                });

                // Initialize adapter status tracking
                this.adapterStatus[adapterId] = {
                    name: name,
                    lastActive: null,
                    errorCount: 0,
                    messageCount: 0,
                    latency: [],
                    status: 'starting'
                };

                child.stdout.on('data', (data) => {
                    logger.debug(`[Adapter:${name}] ${data.toString().trim()}`);
                });

                child.stderr.on('data', (data) => {
                    logger.error(`[Adapter:${name}] ${data.toString().trim()}`);
                    this.adapterStatus[adapterId].errorCount++;
                });

                child.on('close', (code) => {
                    logger.warn(`[Adapter:${name}] Process exited with code ${code}`);
                    this.adapterStatus[adapterId].status = 'disconnected';
                    delete this.processes[name];
                });

                child.on('error', (err) => {
                    logger.error(`[Adapter:${name}] Process error: ${err.message}`);
                    this.adapterStatus[adapterId].status = 'error';
                    this.adapterStatus[adapterId].errorCount++;
                });

                this.processes[name] = child;

                // Registration timeout watcher (5 seconds)
                const registrationTimeout = setTimeout(() => {
                    if (this.adapterStatus[adapterId].status === 'starting') {
                        logger.warn(`[AdapterManager] ${name} did not register within 5000ms`);
                        this.adapterStatus[adapterId].status = 'timeout';
                    }
                }, 5000);

                // Clear timeout if adapter registers
                child.once('message', (msg) => {
                    if (msg && msg.type === 'registered') {
                        clearTimeout(registrationTimeout);
                        this.adapterStatus[adapterId].status = 'connected';
                        logger.info(`[AdapterManager] ${name} registered successfully`);
                    }
                });

            } catch (err) {
                logger.error(`[AdapterManager] Failed to start ${name}: ${err.message}`);
            }
        } else {
            logger.debug(`[AdapterManager] No known entry point for ${name}, skipping auto-start.`);
        }
    }

    getAdapterStatus(adapterId) {
        return this.adapterStatus[adapterId] || null;
    }

    getAllAdapterStatus() {
        return this.adapterStatus;
    }

    stopAll() {
        for (const name in this.processes) {
            logger.info(`[AdapterManager] Stopping ${name}`);
            this.processes[name].kill();
        }
    }
}

module.exports = AdapterManager;
