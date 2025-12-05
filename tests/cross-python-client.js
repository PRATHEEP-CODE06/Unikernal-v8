const WebSocket = require("ws");

const KERNEL_URL = process.env.KERNEL_URL || "ws://localhost:3000/ws";

console.log("[CrossPythonClient] Connecting to Kernel at", KERNEL_URL);

const ws = new WebSocket(KERNEL_URL);

ws.on("open", () => {
    console.log("[CrossPythonClient] Connected to Kernel ✅");

    const envelope = {
        version: "8.0",
        source: "client-cross-python",
        target: "python-python", // Must match Python adapter ID
        intent: "invoke",
        meta: {
            timestamp: new Date().toISOString(),
            trace_id: "cross-py-test-1",
        },
        payload: {
            code: "print('Hello from Python Adapter via Kernel!')",
        },
    };

    console.log("[CrossPythonClient] Sending envelope:", envelope);
    ws.send(JSON.stringify(envelope));
});

ws.on("message", (data) => {
    try {
        const msg = JSON.parse(data.toString());
        console.log("\n[CrossPythonClient] Received reply from Kernel:");
        console.dir(msg, { depth: null });

        // Validate response
        if (!msg.payload) {
            console.error("[CrossPythonClient] FAIL: No payload in response");
            ws.close();
            process.exit(1);
        }

        if (msg.payload.ok !== true) {
            console.error("[CrossPythonClient] FAIL: payload.ok is not true");
            ws.close();
            process.exit(1);
        }

        if (msg.payload.routed !== true) {
            console.error("[CrossPythonClient] FAIL: payload.routed is not true");
            ws.close();
            process.exit(1);
        }

        console.log("[CrossPythonClient] SUCCESS: Python adapter routing confirmed");
        ws.close();
        process.exit(0);
    } catch (err) {
        console.error("[CrossPythonClient] Error parsing message:", err);
        process.exit(1);
    }
});

ws.on("error", (err) => {
    console.error("[CrossPythonClient] WebSocket error:", err.message);
});

ws.on("close", () => {
    console.log("[CrossPythonClient] Connection closed.");
});
