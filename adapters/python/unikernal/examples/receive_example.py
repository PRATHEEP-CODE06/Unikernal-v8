import sys
import os
import asyncio

# Add parent directory to path to import unikernal package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from unikernal.client import UnikernalClient

async def main():
    # Initialize client
    client = UnikernalClient(service_id="python-receiver")
    
    # Define a callback for incoming messages
    def on_message(msg):
        print(f"\n[Received UDL] Source: {msg['source']}, Intent: {msg['intent']}")
        print(f"Payload: {msg['payload']}")

    client.set_on_message(on_message)
    
    print("Connecting to Kernel via WebSocket...")
    await client.connect_ws()
    
    # Keep the script running
    print("Listening for messages... (Ctrl+C to stop)")
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nExiting...")
