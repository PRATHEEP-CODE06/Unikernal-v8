/**
 * tests/ai-pipeline.js
 * Verifies the AI pipeline integration in Unikernal v8.
 */

const WebSocket = require('ws');

const KERNEL_WS_URL = 'ws://localhost:3000/ws';

function runTest() {
    console.log("Connecting to Kernel at", KERNEL_WS_URL);
    const ws = new WebSocket(KERNEL_WS_URL);

    ws.on('open', () => {
        console.log("Connected. Sending AI task...");

        const envelope = {
            version: "8.0",
            source: "client-ai-test",
            target: "ai-service",
            intent: "invoke",
            meta: {
                timestamp: new Date().toISOString(),
                trace_id: "ai-test-1"
            },
            payload: {
                task_type: "ai.chat",
                model: "mock-v8-chat",
                messages: [
                    { role: "user", content: "Hello AI, what is Unikernal v8?" }
                ]
            }
        };

        ws.send(JSON.stringify(envelope));
    });

    ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        console.log("Received response:", JSON.stringify(response, null, 2));

        // Validation Logic
        let success = true;
        const errors = [];

        if (response.source !== 'kernel') {
            success = false;
            errors.push(`Expected source 'kernel', got '${response.source}'`);
        }
        if (response.target !== 'client-ai-test') {
            success = false;
            errors.push(`Expected target 'client-ai-test', got '${response.target}'`);
        }

        const payload = response.payload;
        if (payload.status !== 'ok') {
            success = false;
            errors.push(`Expected payload.status 'ok', got '${payload.status}'`);
        }
        if (payload.service !== 'ai-service') {
            success = false;
            errors.push(`Expected payload.service 'ai-service', got '${payload.service}'`);
        }
        if (payload.provider !== 'mock') {
            success = false;
            errors.push(`Expected payload.provider 'mock', got '${payload.provider}'`);
        }
        if (!payload.content || !payload.content.includes("MOCK_AI_RESPONSE")) {
            success = false;
            errors.push("Response content does not look like a mock response");
        }

        if (success) {
            console.log("✅ AI Pipeline Test PASSED");
            process.exit(0);
        } else {
            console.error("❌ AI Pipeline Test FAILED");
            errors.forEach(e => console.error(` - ${e}`));
            process.exit(1);
        }
    });

    ws.on('error', (err) => {
        console.error("WebSocket error:", err);
        process.exit(1);
    });
}

// Wait for kernel to be ready (if running in CI/CD, but here we assume kernel is running)
// In a real test runner, we might start the kernel. For this script, we assume `npm start` is running.
runTest();
