const axios = require("axios");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

class UnikernalClient {
    constructor(httpUrl, wsUrl, serviceId) {
        this.httpUrl = httpUrl;
        this.wsUrl = wsUrl;
        this.serviceId = serviceId;
        this.ws = null;
        this.onMessageCallback = null;
    }

    createMessage(target, intent, payload, correlationId = null) {
        return {
            version: "1.0",
            source: this.serviceId,
            target,
            intent,
            payload,
            meta: {
                timestamp: new Date().toISOString(),
                trace_id: uuidv4(),
                correlation_id: correlationId,
            },
        };
    }

    async sendUdlHttp(message) {
        try {
            const res = await axios.post(this.httpUrl, message);
            return res.data;
        } catch (err) {
            console.error("[Node UnikernalClient] HTTP error:", err.message);
            return null;
        }
    }

    connectWs() {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on("open", () => {
            console.log("[Node UnikernalClient] Connected to Kernel via WebSocket");

            // registration
            const regMsg = this.createMessage(
                "unikernal-core",
                "REGISTER",
                { service_id: this.serviceId }
            );
            this.ws.send(JSON.stringify(regMsg));
        });

        this.ws.on("message", (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (this.onMessageCallback) {
                    this.onMessageCallback(msg);
                } else {
                    console.log("[Node UnikernalClient] Received UDL:", msg);
                }
            } catch (e) {
                console.error("[Node UnikernalClient] Failed to parse message:", e);
            }
        });

        this.ws.on("close", () => {
            console.log("[Node UnikernalClient] WebSocket closed");
        });

        this.ws.on("error", (err) => {
            console.error("[Node UnikernalClient] WebSocket error:", err.message);
        });
    }

    sendUdlWs(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error("[Node UnikernalClient] WebSocket not connected");
        }
    }

    setOnMessage(callback) {
        this.onMessageCallback = callback;
    }
}

module.exports = { UnikernalClient };
