const { routeUDL, smartRouter } = require("../kernel/src/routingKernel");
const logger = require("../kernel/src/logger");

// Test counter
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✓ PASS: ${message}`);
        passed++;
    } else {
        console.error(`✗ FAIL: ${message}`);
        failed++;
    }
}

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        console.log(`✓ PASS: ${message}`);
        passed++;
    } else {
        console.error(`✗ FAIL: ${message}`);
        console.error(`  Expected: ${expected}`);
        console.error(`  Actual: ${actual}`);
        failed++;
    }
}

async function runTests() {
    console.log("=== Unikernal v8 Kernel Tests ===\n");

    // Test 1: Valid UDM v8 to echo-service
    console.log("--- Test 1: Valid UDM v8 to echo-service ---");
    const validUDM = {
        version: "8.0",
        source: "test-client",
        target: "echo-service",
        intent: "invoke",
        meta: {
            timestamp: new Date().toISOString(),
            trace_id: "test-1"
        },
        payload: {
            message: "Hello Unikernal"
        }
    };
    const result1 = routeUDL(validUDM);
    assert(result1 !== null, "Result should not be null");
    assert(!result1.error, "Result should not have error");
    assert(result1.payload !== undefined, "Result should have payload");

    // Test 2: Invalid UDM - missing source
    console.log("\n--- Test 2: Invalid UDM - missing source ---");
    const invalidUDM1 = {
        version: "8.0",
        target: "echo-service",
        intent: "invoke",
        payload: {}
    };

    // Silence logger for expected error
    const originalError = logger.error;
    logger.error = () => { };

    const result2 = routeUDL(invalidUDM1);

    // Restore logger
    logger.error = originalError;

    assert(result2.error === true, "Should return error for missing source");
    assertEquals(result2.error_code, "UDL_VALIDATION_FAILED", "Error code should be UDL_VALIDATION_FAILED");

    // Test 3: Invalid UDM - missing target
    console.log("\n--- Test 3: Invalid UDM - missing target ---");
    const invalidUDM2 = {
        version: "8.0",
        source: "test-client",
        intent: "invoke",
        payload: {}
    };

    // Silence logger for expected error
    logger.error = () => { };

    const result3 = routeUDL(invalidUDM2);

    // Restore logger
    logger.error = originalError;

    assert(result3.error === true, "Should return error for missing target");
    assertEquals(result3.error_code, "UDL_VALIDATION_FAILED", "Error code should be UDL_VALIDATION_FAILED");

    // Test 4: Target not found
    console.log("\n--- Test 4: Target service not found ---");
    const nonExistentTarget = {
        version: "8.0",
        source: "test-client",
        target: "non-existent-service",
        intent: "invoke",
        meta: {
            timestamp: new Date().toISOString(),
            trace_id: "test-4"
        },
        payload: {}
    };

    // Silence logger for expected error
    logger.error = () => { };

    const result4 = routeUDL(nonExistentTarget);

    // Restore logger
    logger.error = originalError;

    assert(result4.error === true, "Should return error for non-existent target");
    assertEquals(result4.error_code, "TARGET_NOT_FOUND", "Error code should be TARGET_NOT_FOUND");
    assert(result4.available_adapters !== undefined, "Should include available_adapters list");

    // Test 5: Math service operation
    console.log("\n--- Test 5: Math service operation ---");
    try {
        const mathUDM = {
            version: "8.0",
            source: "test-client",
            target: "math-service",
            intent: "invoke",
            meta: {
                timestamp: new Date().toISOString(),
                trace_id: "test-5"
            },
            payload: {
                operation: "add",
                a: 10,
                b: 5
            }
        };
        const result5 = routeUDL(mathUDM);
        assert(!result5.error, "Math service should not return error");
        // Math service returns result at top level, not in payload wrapper
        assert(result5.result !== undefined, "Math service should return numeric result");
        assert(typeof result5.result === "number", "Result should be a number");
        assert(result5.result === 15, "Result should be 15 (10 + 5)");
    } catch (err) {
        console.error(`✗ FAIL: Math test crashed: ${err.message}`);
        failed++;
    }

    // Test 6: String service operation
    console.log("\n--- Test 6: String service operation ---");
    try {
        const stringUDM = {
            version: "8.0",
            source: "test-client",
            target: "string-service",
            intent: "invoke",
            meta: {
                timestamp: new Date().toISOString(),
                trace_id: "test-6"
            },
            payload: {
                operation: "reverse",
                text: "hello"
            }
        };
        const result6 = routeUDL(stringUDM);
        assert(!result6.error, "String service should not return error");
        // String service returns result at top level
        assert(result6.result !== undefined, "String service should return result");
        assert(typeof result6.result === "string", "Result should be a string");
        assert(result6.result === "olleh", "Result should be 'olleh'");
    } catch (err) {
        console.error(`✗ FAIL: String test crashed: ${err.message}`);
        failed++;
    }

    // Summary
    console.log("\n=== Test Summary ===");
    console.log(`Total: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        console.error("\nTests FAILED");
        process.exit(1);
    } else {
        console.log("\nAll tests PASSED");
        process.exit(0);
    }
}

runTests().catch((err) => {
    console.error("Test suite crashed:", err);
    process.exit(1);
});
