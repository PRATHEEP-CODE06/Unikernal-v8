const { routeUDL, registerService } = require("../kernel/src/routingKernel");
const logger = require("../kernel/src/logger");

// Mock WebSocket
class MockWS {
    constructor(name, shouldFail = false) {
        this.name = name;
        this.readyState = 1; // OPEN
        this.OPEN = 1;
        this.shouldFail = shouldFail;
        this.failCount = 0;
    }

    send(msg) {
        if (this.shouldFail) {
            this.failCount++;
            if (this.failCount <= 2) {
                throw new Error("Simulated Network Error");
            }
        }
        logger.info(`[MockWS:${this.name}] Received: ${msg}`);
    }
}

const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('test_results.txt', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (d) {
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

async function runTests() {
    console.log("=== Starting Kernel v7 Verification ===");

    // 1. Register Mock Services
    const serviceA = new MockWS("ServiceA");
    const serviceB = new MockWS("ServiceB");
    registerService("service-a", serviceA);
    registerService("service-b", serviceB);

    // 2. Test Basic Routing
    console.log("\n--- Test 1: Basic Routing ---");
    const res1 = await routeUDL({
        version: "8.0",
        source: "test",
        target: "service-a",
        intent: "invoke",
        meta: { trace_id: "test-1" },
        payload: "hello"
    });
    console.log("Result 1:", res1);

    // 3. Test Parallel Execution with Promise.all
    console.log("\n--- Test 2: Parallel Execution ---");
    const tasks = [
        { version: "8.0", source: "test", target: "service-a", intent: "invoke", payload: "task1", meta: { id: 1, trace_id: "test-2a" } },
        { version: "8.0", source: "test", target: "service-a", intent: "invoke", payload: "task2", meta: { id: 2, trace_id: "test-2b" } },
        { version: "8.0", source: "test", target: "service-b", intent: "invoke", payload: "task3", meta: { id: 3, trace_id: "test-2c" } }
    ];

    try {
        const results = await Promise.all(tasks.map(task => Promise.resolve(routeUDL(task))));
        console.log("Parallel Results:", results);
        console.log("Parallel execution completed successfully");
    } catch (err) {
        console.error("Parallel execution failed:", err);
    }

    // 4. Test Error Handling
    console.log("\n--- Test 3: Error Handling ---");
    try {
        const invalidResult = await routeUDL({
            source: "test",
            // missing target
            payload: "test"
        });
        console.log("Invalid UDM Result:", invalidResult);
        if (invalidResult.error) {
            console.log("Error handling works correctly");
        }
    } catch (err) {
        console.error("Error test failed:", err);
    }

    console.log("\n=== Verification Complete ===");
}

runTests().catch(console.error);

