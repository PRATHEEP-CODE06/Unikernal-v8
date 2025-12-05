const Kernel = require('./core/kernel');
const umb = require('./umb/umb');
const http = require('http');

async function test() {
    console.log('--- Starting Kernel Test ---');
    const kernel = new Kernel();
    await kernel.start();

    console.log('--- Testing UMB ---');

    // Test Pub/Sub
    const testTopic = 'test:event';
    const testPayload = { message: 'Hello UMB' };

    const eventPromise = new Promise(resolve => {
        umb.subscribe(testTopic, (msg) => {
            console.log(`[PASS] Received event on ${testTopic}:`, msg.payload);
            resolve();
        });
    });

    umb.publish(testTopic, testPayload);
    await eventPromise;

    // Test Request/Response (Mocked in Kernel)
    console.log('--- Testing Request/Response ---');
    try {
        const response = await umb.request('kernel:submit_task', { task_type: 'test' });
        console.log(`[PASS] Received response:`, response);
    } catch (err) {
        console.error(`[FAIL] Request failed:`, err);
    }

    console.log('--- Shutting Down ---');
    await kernel.shutdown();
}

test().catch(err => console.error(err));
