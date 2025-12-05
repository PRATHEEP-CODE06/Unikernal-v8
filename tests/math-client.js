const WebSocket = require("ws");

const KERNEL_URL = process.env.KERNEL_URL || "ws://localhost:3000/ws";

console.log("[MathClient] Connecting to Kernel at", KERNEL_URL);

const ws = new WebSocket(KERNEL_URL);

ws.on("open", () => {
    console.log("[MathClient] Connected to Kernel ✅");

    const traceId = "math-test-1";

    const envelope = {
        version: "8.0",
        source: "client-math-shell",
        target: "echo-service",
        intent: "invoke",
        meta: {
            timestamp: new Date().toISOString(),
            trace_id: traceId,
        },
        payload: {
            operation: "add",   // renamed from `op`
            a: 7,
            b: 5,
        },

    };

    // For your current kernel routing, better to directly target math-service:
    envelope.target = "math-service";

    console.log("[MathClient] Sending envelope:", envelope);
    ws.send(JSON.stringify(envelope));
});

ws.on("message", (data) => {
    try {
        const msg = JSON.parse(data.toString());
        console.log("\n[MathClient] Received reply from Kernel:");
        console.dir(msg, { depth: null });

        // Validate response
        if (!msg.payload) {
            console.error("[MathClient] FAIL: No payload in response");
            ws.close();
            process.exit(1);
        }

        if (msg.payload.result === undefined) {
            console.error("[MathClient] FAIL: No result field in payload");
            ws.close();
            process.exit(1);
        }

        const expected = 12; // 7 + 5
        if (msg.payload.result !== expected) {
            console.error(`[MathClient] FAIL: Expected ${expected}, got ${msg.payload.result}`);
            ws.close();
            process.exit(1);
        }

        console.log("[MathClient] SUCCESS: Math service returned correct result");
        console.log("\n[MathClient] Test complete. Closing connection.");
        ws.close();
        process.exit(0);
    } catch (err) {
        console.error("[MathClient] Error parsing message:", err);
        process.exit(1);
    }
});

ws.on("close", () => {
    console.log("[MathClient] Connection closed.");
});

ws.on("error", (err) => {
    console.error("[MathClient] WebSocket error:", err.message);
});
