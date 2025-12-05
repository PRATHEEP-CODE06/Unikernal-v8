const Kernel = require('./core/kernel');
const umb = require('./umb/umb');
const { spawn } = require('child_process');
const path = require('path');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
    console.log('--- Starting C++ Adapter Verification ---');

    // 1. Start Kernel
    const kernel = new Kernel();
    await kernel.start();

    // 2. Start C++ Adapter
    const adapterPath = path.resolve(__dirname, '../../adapters/cpp/adapter.js');
    console.log(`[Test] Starting C++ Adapter: ${adapterPath}`);
    const adapterProcess = spawn('node', [adapterPath], { stdio: 'inherit' });

    // Wait for adapter to connect
    await sleep(2000);

    // 3. Submit C++ Task
    console.log('--- Testing C++ Task ---');
    const cppCode = `
    #include <iostream>
    int main() {
        std::cout << "Hello from C++ Adapter!" << std::endl;
        return 0;
    }
    `;

    try {
        const result = await umb.request('kernel:submit_task', {
            model_version: "5.0",
            task_type: "compute",
            language: "cpp",
            target: { file: "" }, // Dynamic code
            data: { code: cppCode }
        });
        console.log('[PASS] C++ Result:', result);
    } catch (err) {
        console.error('[FAIL] C++ Task Failed:', err);
    }

    // Cleanup
    adapterProcess.kill();
    await kernel.shutdown();
}

test().catch(err => console.error(err));
