const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const { PORT, HTTP_PATH, WS_PATH } = require("./config");
const {
    routeUDL,
    registerService,
    unregisterService,
    handleKernelControlMessage,
    smartRouter,
} = require("./routingKernel");

const logger = require("./logger");
const { interpretUDLToUDM } = require("./antigravityCore");
const IntelligenceEngine = require("./IntelligenceEngine");
const AdapterManager = require("./adapterManager");

// Initialize Core Components
const app = express();
app.use(express.json());
app.use(morgan("dev"));

// Root Route
app.get("/", (req, res) => {
    const { VERSION, KERNEL_NAME, API_VERSION } = require("./config");
    res.json({
        name: KERNEL_NAME,
        version: VERSION,
        api_version: API_VERSION,
        uptime: process.uptime(),
        routes: ["/health", "/services", HTTP_PATH],
        websocket: WS_PATH
    });
});

// Health Check
app.get("/health", (req, res) => {
    const { VERSION, API_VERSION, BUILD_HASH } = require("./config");
    const aiConfig = require("./ai/aiConfig");
    const adapters = smartRouter.getRoutes().map(r => ({
        id: r.id,
        status: r.ws?.readyState === 1 ? "connected" : "disconnected",
        messages: smartRouter.metrics.get(r.id)?.total || 0,
        lastActive: smartRouter.metrics.get(r.id)?.lastActive || null,
        errors: smartRouter.metrics.get(r.id)?.errors || 0
    }));

    res.json({
        status: "ok",
        kernel_version: VERSION,
        api_version: API_VERSION,
        build_hash: BUILD_HASH,
        uptime_seconds: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        adapters: adapters,
        adapter_count: adapters.length,
        ai: {
            enabled: aiConfig.AI_ENABLED,
            provider: aiConfig.AI_PROVIDER,
            default_model: aiConfig.AI_DEFAULT_MODEL,
            dev_mode: aiConfig.DEV_MODE
        }
    });
});

// Services Discovery
app.get("/services", (req, res) => {
    try {
        const routes = smartRouter.getRoutes();
        res.json({ status: "ok", count: routes.length, services: routes });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// Main UDL Entrypoint
app.post(HTTP_PATH, async (req, res) => {
    const message = req.body;
    try {
        // Antigravity Logic
        if (!message.force_direct && (message.use_antigravity || message.query)) {
            const interpretation = interpretUDLToUDM(message);
            if (interpretation.error) return res.status(400).json(interpretation);

            // If Antigravity routed it to a service, we route the UDM
            if (interpretation.udm) {
                const result = await routeUDL(interpretation.udm);
                return res.json({ ...result, antigravity: true });
            }
            return res.status(501).json({ error: true, message: "Not implemented" });
        }

        // Standard Routing
        const result = await routeUDL(message);
        return res.json(result);
    } catch (err) {
        logger.error("Error handling UDL request:", err);
        return res.status(500).json({ status: "error", message: err.message });
    }
});

// Server Setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: WS_PATH });

// Adapter Manager
const adaptersDir = path.join(__dirname, "..", "..", "adapters");
const adapterManager = new AdapterManager(adaptersDir);

wss.on("connection", (ws) => {
    logger.info("[Kernel] WebSocket client connected.");

    let serviceId = null;

    ws.on("message", async (raw) => {
        let data;

        try {
            data = JSON.parse(raw.toString());
        } catch (err) {
            logger.error("[Kernel] Failed to parse incoming message", {
                error: err.message,
                raw: raw.toString(),
            });
            return;
        }

        // 1) CONTROL PLANE (target === kernel)
        if (data.target === "kernel") {

            // Auto-register adapter
            if (data.intent === "register_adapter") {
                serviceId = data.payload?.adapterId || data.source;

                if (serviceId) {
                    smartRouter.register(serviceId, ws);
                }
            }

            handleKernelControlMessage(data)
                .then((result) => {
                    if (result) {
                        ws.send(JSON.stringify(result));
                    }
                })
                .catch((err) => {
                    logger.error("[KernelControl] Failed to process control message", {
                        error: err.message,
                    });
                    ws.send(JSON.stringify({
                        status: "error",
                        kind: "kernel_control",
                        message: "Kernel control handler error",
                        error: err.message,
                    }));
                });

            return;
        }

        // 2) DATA PLANE (normal routing)
        // NOTE: routeUDL may return a Promise (e.g., for AI requests), so we must await it
        try {
            const responsePayload = await routeUDL(data);

            // If routeUDL returns a direct result (e.g. from internal service or error), send it back
            if (responsePayload) {
                const { API_VERSION } = require("./config");
                const traceId = data.meta?.trace_id;
                const envelope = {
                    version: API_VERSION,
                    source: "kernel",
                    target: data.source || "unknown-client",
                    intent: "response",
                    meta: {
                        timestamp: new Date().toISOString(),
                        trace_id: traceId,
                    },
                    payload: responsePayload,
                };

                try {
                    ws.send(JSON.stringify(envelope));
                } catch (err) {
                    logger.error("[Kernel] Failed to send response envelope", {
                        error: err.message,
                    });
                }
            }
        } catch (err) {
            logger.error("[Kernel] Error routing message", { error: err.message });
            const errorEnvelope = {
                version: "8.0",
                source: "kernel",
                target: data.source || "unknown-client",
                intent: "response",
                meta: {
                    timestamp: new Date().toISOString(),
                    trace_id: data.meta?.trace_id,
                },
                payload: {
                    error: true,
                    error_code: "ROUTING_ERROR",
                    message: err.message
                },
            };
            try {
                ws.send(JSON.stringify(errorEnvelope));
            } catch (sendErr) {
                logger.error("[Kernel] Failed to send error envelope", { error: sendErr.message });
            }
        }
    });

    ws.on("close", () => {
        if (serviceId) {
            smartRouter.unregister(serviceId);
        } else {
            logger.info("[Kernel] WebSocket client disconnected.");
        }
    });
});

// Global Error Handlers
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Kernel staying alive...', { error: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION! Kernel staying alive...', { reason });
});

server.listen(PORT, () => {
    const { VERSION, KERNEL_NAME } = require("./config");
    logger.info(`${KERNEL_NAME} v${VERSION} kernel started on port ${PORT}`);
    logger.info(`HTTP endpoint: ${HTTP_PATH}`);
    logger.info(`WebSocket endpoint: ${WS_PATH}`);

    // Start Managers
    adapterManager.scanAndStart();

    // Start AI Engine
    const aiEngine = new IntelligenceEngine(smartRouter);
    aiEngine.start();
});
