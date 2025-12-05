const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const KERNEL_URL = 'ws://localhost:3000/ws';

class NativeAdapter {
    constructor(language, config) {
        this.language = language;
        this.config = config;
        this.id = `adapter-${language}-${uuidv4()}`;
        this.ws = null;
    }

    connect() {
        console.log(`[${this.language}] Connecting to Kernel at ${KERNEL_URL}...`);
        this.ws = new WebSocket(KERNEL_URL);

        this.ws.on('open', () => {
            console.log(`[${this.language}] Connected as ${this.id}`);
            this.register();
        });

        this.ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                this.handleMessage(msg);
            } catch (err) {
                console.error(`[${this.language}] Message error:`, err);
            }
        });
    }

    register() {
        // Register with V8-compliant UDM envelope
        this.send({
            version: '8.0',
            source: this.id,
            target: 'kernel',
            intent: 'register_adapter',
            meta: {
                timestamp: new Date().toISOString(),
                trace_id: this.id,
                language: this.language,
                adapter_version: '1.0'
            },
            payload: {
                adapterId: this.id,
                capabilities: ['execute', 'compile'],
                runtime: `${this.language}-native`
            }
        });

        // Subscribe to execution requests with V8 UDM envelope
        this.send({
            version: '8.0',
            source: this.id,
            target: 'kernel',
            intent: 'subscribe',
            meta: {
                timestamp: new Date().toISOString(),
                trace_id: this.id
            },
            payload: { topic: `adapter:${this.id}:execute` }
        });
    }

    send(msg) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    async handleMessage(msg) {
        const { intent, source, target, payload, meta } = msg;
        const traceId = meta?.trace_id || meta?.traceId;

        if (target === 'kernel') return;

        if (intent === 'invoke') {
            await this.executeTask(msg);
        } else if (intent === 'ping') {
            this.send({
                version: '8.0',
                source: this.id,
                target: source,
                intent: 'pong',
                meta: { trace_id: traceId, timestamp: new Date().toISOString() }
            });
        }
    }

    async executeTask(msg) {
        const { source, payload, meta } = msg;
        const traceId = meta?.trace_id;

        console.log(`[${this.language}] Executing task for ${source}...`);

        try {
            const result = await this.runNativeCode(payload);

            this.send({
                version: '8.0',
                source: this.id,
                target: source,
                intent: 'response',
                meta: { trace_id: traceId, timestamp: new Date().toISOString() },
                payload: {
                    status: 'ok',
                    result: result
                }
            });

        } catch (err) {
            console.error(`[${this.language}] Error: ${err.message}`);
            this.send({
                version: '8.0',
                source: this.id,
                target: source,
                intent: 'response',
                meta: { trace_id: traceId, timestamp: new Date().toISOString() },
                payload: {
                    status: 'error',
                    error: err.message
                }
            });
        }
    }

    async runNativeCode(task) {
        const { code, file } = task.data;
        const tmpDir = os.tmpdir();
        const jobId = uuidv4();

        let sourcePath;
        if (file) {
            sourcePath = file;
        } else if (code) {
            sourcePath = path.join(tmpDir, `${jobId}.${this.config.extension}`);
            fs.writeFileSync(sourcePath, code);
        } else {
            throw new Error("No code or file provided");
        }

        const exePath = path.join(tmpDir, `${jobId}.exe`);

        // Compile
        if (this.config.compileCmd) {
            const compileCmd = this.config.compileCmd
                .replace('{source}', sourcePath)
                .replace('{output}', exePath);

            await this.execShell(compileCmd);
        }

        // Execute
        const runCmd = this.config.runCmd
            ? this.config.runCmd.replace('{output}', exePath).replace('{source}', sourcePath)
            : exePath;

        const output = await this.execShell(runCmd);

        // Cleanup
        if (code && fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
        if (fs.existsSync(exePath)) fs.unlinkSync(exePath);

        return output;
    }

    execShell(cmd) {
        return new Promise((resolve, reject) => {
            const child = spawn(cmd, { shell: true });
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', d => stdout += d);
            child.stderr.on('data', d => stderr += d);

            child.on('close', code => {
                if (code === 0) resolve(stdout.trim());
                else reject(new Error(`Command failed: ${cmd}\nStderr: ${stderr}`));
            });
        });
    }
}

module.exports = NativeAdapter;
