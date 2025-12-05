/**
 * Unikernal System Monitor
 * Connects to Kernel and displays real-time status.
 */

const WebSocket = require('ws');

const KERNEL_URL = 'ws://localhost:3000';
const ws = new WebSocket(KERNEL_URL);

ws.on('open', () => {
    console.log('Connected to Unikernal v8 Kernel');
    // Subscribe to system events
    ws.send(JSON.stringify({ cmd: 'subscribe', topic: 'kernel:metrics' }));
    ws.send(JSON.stringify({ cmd: 'subscribe', topic: 'adapter:register' }));
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.cmd === 'event') {
        const { topic, payload } = msg;
        const time = new Date().toLocaleTimeString();

        if (topic === 'adapter:register') {
            console.log(`[${time}] [ADAPTER] New Adapter: ${payload.language} (${payload.adapterId})`);
        } else {
            console.log(`[${time}] [EVENT] ${topic}:`, payload);
        }
    }
});

ws.on('error', (err) => {
    console.error('Connection error:', err.message);
});
