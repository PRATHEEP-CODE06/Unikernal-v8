import json
import requests
import asyncio
import websockets
import uuid
import datetime
from .config import Config


class UnikernalClient:
    """
    Simple client for talking to the Unikernal Kernel over HTTP and WebSocket.
    """

    def __init__(self, http_url=None, ws_url=None, service_id=None):
        # Allow explicit values or fall back to Config defaults
        self.http_url = http_url or Config.KERNEL_HTTP_URL
        self.ws_url = ws_url or Config.KERNEL_WS_URL
        self.service_id = service_id or Config.SERVICE_ID

        self.ws = None
        self.on_message_callback = None

    def create_message(self, target, intent, payload, correlation_id=None):
        """
        Build a UDL message with standard fields.
        """
        return {
            "version": "1.0",
            "source": self.service_id,
            "target": target,
            "intent": intent,
            "payload": payload,
            "meta": {
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "trace_id": str(uuid.uuid4()),
                "correlation_id": correlation_id,
            },
        }

    def send_udl_http(self, message):
        """
        Send a UDL message via HTTP to the Kernel.
        Returns the JSON response (dict) or None on error.
        """
        try:
            response = requests.post(self.http_url, json=message, timeout=5)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"[UnikernalClient] Error sending HTTP request: {e}")
            return None

    async def connect_ws(self):
        """
        Connect to the Kernel over WebSocket and register this service.
        Also starts a background listener task.
        """
        try:
            self.ws = await websockets.connect(self.ws_url)
            print(f"[UnikernalClient] Connected to Kernel at {self.ws_url}")

            # Registration message
            reg_msg = self.create_message(
                target="unikernal-core",
                intent="REGISTER",
                payload={"service_id": self.service_id},
            )
            await self.ws.send(json.dumps(reg_msg))

            # Start listener in the background
            asyncio.create_task(self._listen())

        except Exception as e:
            print(f"[UnikernalClient] WebSocket connection failed: {e}")

    async def _listen(self):
        """
        Internal listener loop for incoming WebSocket messages.
        """
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                except json.JSONDecodeError:
                    print(f"[UnikernalClient] Received non-JSON message: {message}")
                    continue

                if self.on_message_callback:
                    self.on_message_callback(data)
                else:
                    print("[UnikernalClient] Received UDL message:")
                    print(json.dumps(data, indent=2))
        except Exception as e:
            print(f"[UnikernalClient] WebSocket listener error: {e}")

    async def send_udl_ws(self, message):
        """
        Send a UDL message via WebSocket.
        """
        if self.ws:
            await self.ws.send(json.dumps(message))
        else:
            print("[UnikernalClient] WebSocket not connected")

    def set_on_message(self, callback):
        """
        Set a callback to be invoked when a UDL message is received over WebSocket.
        The callback should accept one argument: the decoded JSON dict.
        """
        self.on_message_callback = callback
