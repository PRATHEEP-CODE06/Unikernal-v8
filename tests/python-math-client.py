import asyncio
import json
import websockets
import time

WS_URL = "ws://localhost:3000/ws"

async def main():
    envelope = {
        "version": "8.0",
        "source": "python-math-client",
        "target": "math-service",
        "intent": "invoke",
        "meta": {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "trace_id": "py-math-test-1"
        },
        "payload": {
            "operation": "add",
            "a": 3,
            "b": 9
        }
    }

    async with websockets.connect(WS_URL) as ws:
        print("[PyMathClient] Connected ✅")
        print("[PyMathClient] Sending envelope:")
        print(json.dumps(envelope, indent=2))

        await ws.send(json.dumps(envelope))
        reply_raw = await ws.recv()
        reply = json.loads(reply_raw)

        print("\n[PyMathClient] Received reply:")
        print(json.dumps(reply, indent=2))

        payload = reply.get("payload", {})
        if payload.get("status") == "ok" and payload.get("result") == 12:
            print("\n[PyMathClient] ✅ SUCCESS: math-service returned correct result")
        else:
            print("\n[PyMathClient] ❌ FAIL: unexpected response")

if __name__ == "__main__":
    asyncio.run(main())
