import sys
import os

# Add parent directory to path to import unikernal package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from unikernal.client import UnikernalClient

def main():
    # Initialize client
    client = UnikernalClient(service_id="python-sender")
    
    # Create a message
    message = client.create_message(
        target="node-receiver",
        intent="GREETING",
        payload={"msg": "Hello from Python!"}
    )
    
    print("Sending message via HTTP...")
    response = client.send_udl_http(message)
    
    if response:
        print("Response received:")
        print(response)

if __name__ == "__main__":
    main()
