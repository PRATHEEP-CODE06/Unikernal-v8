#!/usr/bin/env python3
import sys
sys.path.append('../../sdk/python')
from unikernal import UnikernalClient
import time

class PythonDataProcessor:
    def __init__(self):
        self.client = UnikernalClient(
            service_id="python-service",
            api_key="adapter-key"
        )
        
    def start(self):
        self.client.connect()
        print("[Python Service] Started and connected to Unikernal")
        
        # Keep alive
        while True:
            time.sleep(1)

if __name__ == "__main__":
    service = PythonDataProcessor()
    service.start()
