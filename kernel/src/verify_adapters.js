const Kernel = require('./core/kernel');
const umb = require('./umb/umb');
const { spawn } = require('child_process');
const path = require('path');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
    console.log('--- Starting Adapter Verification ---');

    // 1. Start Kernel
    const kernel = new Kernel();
    await kernel.start();
    console.log('[Test] Kernel started');

    // 2. Start Python Adapter
    const pythonAdapterPath = path.resolve(__dirname, '../../adapters/python/adapter.py');
    console.log(`[Test] Starting Python Adapter: ${pythonAdapterPath}`);
    const pythonProcess = spawn('python', [pythonAdapterPath], { stdio: 'inherit' });

    // 3. Start Node Adapter
    const nodeAdapterPath = path.resolve(__dirname, '../../adapters/node/adapter.js');
    console.log(`[Test] Starting Node Adapter: ${nodeAdapterPath}`);
    const nodeProcess = spawn('node', [nodeAdapterPath], { stdio: 'inherit' });

    // Wait for adapters to connect
    await sleep(2000);

    // 4. Submit Python Task
    console.log('--- Testing Python Task ---');
    try {
        const result = await umb.request('kernel:submit_task', {
            model_version: "5.0",
            task_type: "invoke",
            language: "python",
            target: { function: "print" },
            data: { message: "Hello from Python Adapter!" }
        });
        console.log('[PASS] Python Result:', result);
    } catch (err) {
        console.error('[FAIL] Python Task Failed:', err);
    }

    // 5. Submit Node Task
    console.log('--- Testing Node Task ---');
    try {
        const result = await umb.request('kernel:submit_task', {
            model_version: "5.0",
            task_type: "invoke",
            language: "node",
            target: { function: "eval" }, // Using eval for quick test
            data: { code: "1 + 1" }
        });
        console.log('[PASS] Node Result:', result);
    } catch (err) {
        console.error('[FAIL] Node Task Failed:', err);
    }

    // Cleanup
    console.log('--- Cleaning Up ---');
    pythonProcess.kill();
    nodeProcess.kill();
    await kernel.shutdown();
}

test().catch(err => console.error(err));
