const WebSocket = require("ws");

const KERNEL_URL = process.env.KERNEL_URL || "ws://localhost:3000/ws";

console.log("[StringClient] Connecting to Kernel at", KERNEL_URL);

const ws = new WebSocket(KERNEL_URL);

ws.on("open", () => {
    console.log("[StringClient] Connected to Kernel ✅");

    const envelope = {
        version: "8.0",
        source: "client-string-shell",
        target: "string-service",
        intent: "invoke",
        meta: {
            timestamp: new Date().toISOString(),
            trace_id: "string-test-1",
        },
        payload: {
            operation: "reverse",
            text: "Unikernal v8 is Supreme",
        },
    };

    console.log("[StringClient] Sending envelope:", envelope);
    ws.send(JSON.stringify(envelope));
});

ws.on("message", (data) => {
    try {
        const msg = JSON.parse(data.toString());
        console.log("\n[StringClient] Received reply from Kernel:");
        console.dir(msg, { depth: null });

        // Validate response
        if (!msg.payload) {
            console.error("[StringClient] FAIL: No payload in response");
            ws.close();
            process.exit(1);
        }

        if (!msg.payload.result) {
            console.error("[StringClient] FAIL: No result field in payload");
            ws.close();
            process.exit(1);
        }

        console.log("[StringClient] SUCCESS: String service responded correctly");
        ws.close();
        process.exit(0);
    } catch (err) {
        console.error("[StringClient] Error parsing message:", err);
        process.exit(1);
    }
});

ws.on("close", () => {
    console.log("[StringClient] Connection closed.");
});

ws.on("error", (err) => {
    console.error("[StringClient] WebSocket error:", err.message);
    process.exit(1);
});
