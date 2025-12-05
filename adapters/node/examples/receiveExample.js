const { UnikernalClient } = require('../index');

async function main() {
    const client = new UnikernalClient(
        'http://localhost:4000/udl',
        'ws://localhost:4000/ws',
        'node-receiver'
    );

    client.onMessage((msg) => {
        console.log(`\n[Received UDL] Source: ${msg.source}, Intent: ${msg.intent}`);
        console.log('Payload:', msg.payload);
    });

    console.log('Connecting to Kernel via WebSocket...');
    try {
        await client.connectWs();
        console.log('Listening for messages... (Ctrl+C to stop)');
    } catch (err) {
        console.error('Failed to connect:', err);
    }
}

main().catch(console.error);
