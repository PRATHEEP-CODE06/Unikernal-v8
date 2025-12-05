/**
 * Unikernal v8 Cross-Language Test Suite
 * Verifies interoperability between services using v8 UDL/UDM protocol.
 */

const WebSocket = require("ws");
const assert = require("assert");

const KERNEL_URL = process.env.KERNEL_URL || "ws://localhost:3000/ws";

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Helper to create a v8 UDL/UDM envelope
 */
function createEnvelope(target, payload, traceId) {
    return {
        version: "8.0",
        source: "test-suite",
        target: target,
        intent: "invoke",
        meta: {
            timestamp: new Date().toISOString(),
            trace_id: traceId || `test-${target}-${Date.now()}`
        },
        payload: payload
    };
}

/**
 * Run a single test
 */
function runTest(testName, envelope, validator) {
    return new Promise((resolve, reject) => {
        totalTests++;
        const ws = new WebSocket(KERNEL_URL);

        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error(`Test timeout: ${testName}`));
        }, 5000);

        ws.on("open", () => {
            ws.send(JSON.stringify(envelope));
        });

        ws.on("message", (data) => {
            clearTimeout(timeout);
            try {
                const response = JSON.parse(data.toString());
                validator(response);
                passedTests++;
                console.log(`✓ PASS: ${testName}`);
                ws.close();
                resolve();
            } catch (err) {
                failedTests++;
                console.error(`✗ FAIL: ${testName}`);
                console.error(`  Error: ${err.message}`);
                ws.close();
                resolve(); // Don't reject, continue with other tests
            }
        });

        ws.on("error", (err) => {
            clearTimeout(timeout);
            failedTests++;
            console.error(`✗ FAIL: ${testName}`);
            console.error(`  WebSocket error: ${err.message}`);
            resolve();
        });
    });
}

/**
 * Main test execution
 */
async function runTests() {
    console.log("Unikernal v8 Cross-Language Test Suite\n");

    // Test 1: Echo service invocation
    await runTest(
        "Echo service invocation",
        createEnvelope("echo-service", { message: "Hello from test suite" }, "test-echo-1"),
        (response) => {
            assert.strictEqual(response.version, "8.0", "Response version should be 8.0");
            assert.strictEqual(response.source, "kernel", "Response source should be kernel");
            assert.strictEqual(response.intent, "response", "Response intent should be response");
            assert.ok(response.payload, "Response should have payload");
            assert.strictEqual(response.payload.status, "ok", "Payload status should be ok");
            assert.strictEqual(response.payload.service, "echo-service", "Service should be echo-service");
        }
    );

    // Test 2: Math add operation
    await runTest(
        "Math add operation",
        createEnvelope("math-service", { operation: "add", a: 10, b: 5 }, "test-math-1"),
        (response) => {
            assert.strictEqual(response.version, "8.0", "Response version should be 8.0");
            assert.strictEqual(response.source, "kernel", "Response source should be kernel");
            assert.strictEqual(response.intent, "response", "Response intent should be response");
            assert.ok(response.payload, "Response should have payload");
            assert.strictEqual(response.payload.status, "ok", "Payload status should be ok");
            assert.strictEqual(response.payload.service, "math-service", "Service should be math-service");
            assert.strictEqual(response.payload.result, 15, "Math result should be 15");
        }
    );

    // Test 3: String reverse operation
    await runTest(
        "String reverse operation",
        createEnvelope("string-service", { operation: "reverse", text: "hello" }, "test-string-1"),
        (response) => {
            assert.strictEqual(response.version, "8.0", "Response version should be 8.0");
            assert.strictEqual(response.source, "kernel", "Response source should be kernel");
            assert.strictEqual(response.intent, "response", "Response intent should be response");
            assert.ok(response.payload, "Response should have payload");
            assert.strictEqual(response.payload.status, "ok", "Payload status should be ok");
            assert.strictEqual(response.payload.service, "string-service", "Service should be string-service");
            assert.strictEqual(typeof response.payload.result, "string", "Result should be a string");
        }
    );

    // Test 4: Python adapter routing
    await runTest(
        "Python adapter routing",
        createEnvelope("python-python", { code: "print('Hello from Python')" }, "test-python-1"),
        (response) => {
            assert.strictEqual(response.version, "8.0", "Response version should be 8.0");
            assert.ok(response.payload, "Response should have payload");
            // Python adapter returns { ok: true, routed: true }
            assert.strictEqual(response.payload.ok, true, "Payload ok should be true");
            assert.strictEqual(response.payload.routed, true, "Payload routed should be true");
        }
    );

    // Print summary
    console.log("\n=== Test Summary ===");
    console.log(`Total: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests > 0) {
        console.error("\nTests FAILED");
        process.exit(1);
    } else {
        console.log("\nAll tests PASSED");
        process.exit(0);
    }
}

// Run tests
runTests().catch((err) => {
    console.error("Test suite crashed:", err);
    process.exit(1);
});
