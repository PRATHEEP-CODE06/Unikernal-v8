// tests/echo-client.js
const WebSocket = require("ws");

const KERNEL_URL = "ws://localhost:3000/ws";

console.log("[Client] Connecting to Kernel at", KERNEL_URL);

const ws = new WebSocket(KERNEL_URL);

ws.on("open", () => {
    console.log("[Client] Connected to Kernel ✅");

    // Build a UDM v8 envelope targeting echo-service
    const envelope = {
        version: "8.0",
        source: "client-shell",          // any id you like
        target: "echo-service",          // internal service
        intent: "invoke",                // not strictly required by router, but good style
        meta: {
            timestamp: new Date().toISOString(),
            trace_id: "manual-test-1",
        },
        payload: {
            message: "Hello from Unikernal test client! 👋",
        },
    };

    console.log("[Client] Sending envelope:", envelope);
    ws.send(JSON.stringify(envelope));
});

ws.on("message", (data) => {
    try {
        const msg = JSON.parse(data.toString());
        console.log("\n[Client] Received reply from Kernel:");
        console.dir(msg, { depth: null });

        // Validate response
        if (!msg.payload) {
            console.error("[Client] FAIL: No payload in response");
            ws.close();
            process.exit(1);
        }

        if (msg.payload.status !== "ok") {
            console.error("[Client] FAIL: Payload status is not ok");
            ws.close();
            process.exit(1);
        }

        if (msg.payload.service !== "echo-service") {
            console.error("[Client] FAIL: Service is not echo-service");
            ws.close();
            process.exit(1);
        }

        if (!msg.payload.payload || !msg.payload.payload.received) {
            console.error("[Client] FAIL: Missing nested payload structure");
            ws.close();
            process.exit(1);
        }

        if (!msg.payload.payload.received.message) {
            console.error("[Client] FAIL: Missing received message in payload");
            ws.close();
            process.exit(1);
        }

        console.log("[Client] SUCCESS: Echo service responded correctly");
        console.log("\n[Client] Test complete. Closing connection.");
        ws.close();
        process.exit(0);
    } catch (err) {
        console.error("[Client] Failed to parse message:", err);
        process.exit(1);
    }
});

ws.on("close", () => {
    console.log("[Client] Connection closed.");
});

ws.on("error", (err) => {
    console.error("[Client] WebSocket error:", err.message);
});
