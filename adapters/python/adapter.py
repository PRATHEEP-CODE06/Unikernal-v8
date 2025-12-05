import asyncio
import websockets
import json
import sys
import io
from datetime import datetime

# -------------------------------
# Configuration
# -------------------------------
KERNEL_URL = "ws://localhost:3000/ws?serviceId=python-python"
ADAPTER_ID = "python-python"  # This must match the target you use from Node


def now_iso():
    return datetime.utcnow().isoformat() + "Z"


class PythonAdapter:
    def __init__(self):
        self.ws = None

    async def connect(self):
        print(f"[Python] Connecting to Kernel at {KERNEL_URL}...")
        async with websockets.connect(KERNEL_URL) as websocket:
            self.ws = websocket
            print(f"[Python] Connected as {ADAPTER_ID}")

            # 1) Register with kernel (control-plane, UDM v8)
            await self.send({
                "version": "8.0",
                "source": ADAPTER_ID,
                "target": "kernel",
                "intent": "register_adapter",
                "meta": {
                    "timestamp": now_iso(),
                    "trace_id": ADAPTER_ID,
                    "language": "python",
                    "adapter_version": "1.0",
                },
                "payload": {
                    "adapterId": ADAPTER_ID,
                    "capabilities": ["execute", "eval"],
                    "runtime": sys.version,
                },
            })

            # 2) Optional subscribe (kernel just acks it; safe to keep)
            await self.send({
                "version": "8.0",
                "source": ADAPTER_ID,
                "target": "kernel",
                "intent": "subscribe",
                "meta": {
                    "timestamp": now_iso(),
                    "trace_id": ADAPTER_ID + "-sub",
                },
                "payload": {
                    "topic": f"adapter:{ADAPTER_ID}:execute"
                },
            })

            print("[Python] Waiting for envelopes from Kernel...")

            # 3) Main receive loop – handle UDM v8 envelopes
            async for raw in websocket:
                await self.handle_envelope(raw)

    async def send(self, envelope: dict):
        text = json.dumps(envelope)
        await self.ws.send(text)

    async def handle_envelope(self, raw: str):
        print("[Python] Received raw:", raw)

        try:
            envelope = json.loads(raw)
        except Exception as e:
            print("[Python] Failed to parse JSON:", e)
            return

        intent = envelope.get("intent")
        source = envelope.get("source")
        target = envelope.get("target")
        meta = envelope.get("meta") or {}
        payload = envelope.get("payload") or {}
        trace_id = meta.get("trace_id") or meta.get("traceId")

        # Ignore kernel_control responses etc.
        if target == "kernel":
            print("[Python] Kernel-control reply, ignoring.")
            return

        if intent != "invoke":
            print(f"[Python] Non-invoke intent '{intent}', ignoring.")
            return

        # Expect payload.code with Python source
        code = payload.get("code")
        if not code:
            print("[Python] No 'code' field in payload, ignoring.")
            return

        print(f"[Python] Executing code for trace_id={trace_id} from {source}...")
        stdout_capture = io.StringIO()
        exec_error = None

        try:
            # Capture stdout
            old_stdout = sys.stdout
            sys.stdout = stdout_capture

            # Very basic exec – demo only, not secure for untrusted code
            exec(code, {}, {})

        except Exception as e:
            exec_error = str(e)
        finally:
            sys.stdout = old_stdout

        output = stdout_capture.getvalue()

        # Build UDM v8 response envelope
        reply = {
            "version": "8.0",
            "source": ADAPTER_ID,          # this adapter/service id
            "target": source,              # reply to original caller
            "intent": "response",
            "meta": {
                "timestamp": now_iso(),
                "trace_id": trace_id,
            },
            "payload": {
                "status": "ok" if exec_error is None else "error",
                "language": "python",
                "runtime": sys.version,
                "stdout": output,
                "error": exec_error,
                "original_code": code,
            },
        }

        print("[Python] Sending response envelope:")
        print(json.dumps(reply, indent=2))

        try:
            await self.send(reply)
        except Exception as e:
            print("[Python] Failed to send response:", e)


if __name__ == "__main__":
    adapter = PythonAdapter()
    try:
        asyncio.run(adapter.connect())
    except KeyboardInterrupt:
        print("[Python] Stopped")
