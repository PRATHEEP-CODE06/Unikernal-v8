const AdapterManager = require("../kernel/src/core/AdapterManager");
const path = require("path");
const fs = require('fs');
const util = require('util');

// Setup logging to file
const logFile = fs.createWriteStream('test_adapter_manager_results.txt', { flags: 'w' });
const logStdout = process.stdout;
console.log = function (d) {
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

async function runTests() {
    console.log("=== Starting Adapter Manager Verification ===");

    const adaptersDir = path.join(__dirname, "..", "adapters");
    const manager = new AdapterManager(adaptersDir);

    // Mock spawn to avoid actually starting processes and hanging the test
    // But we want to verify it TRIES to start.
    // We can override startAdapter method for testing.
    manager.startAdapter = function (dirPath, config) {
        console.log(`[Mock] Starting adapter: ${config.id} from ${dirPath}`);
        this.activeAdapters.set(config.id, { pid: 123 });
    };

    manager.scanAndStart();

    if (manager.activeAdapters.has("test-adapter-v7")) {
        console.log("SUCCESS: test-adapter-v7 detected and started.");
    } else {
        console.error("FAILURE: test-adapter-v7 NOT detected.");
    }

    console.log("=== Verification Complete ===");
}

runTests().catch(console.error);
