const Kernel = require('./core/kernel');
const umb = require('./umb/umb');
const router = require('./routing/router');

async function test() {
    console.log('--- Starting Routing Test ---');
    const kernel = new Kernel();
    await kernel.start();

    // 1. Register a Mock Adapter for Python
    const mockAdapterId = 'adapter-python-mock-1';
    umb.publish('adapter:register', { language: 'python', adapterId: mockAdapterId });

    // 2. Set up Mock Adapter Handler
    umb.handle(`adapter:${mockAdapterId}:execute`, async (task) => {
        console.log(`[Mock Adapter] Executing task:`, task);
        return { result: "Executed by Python Mock" };
    });

    // 3. Submit a Task
    console.log('--- Submitting Task ---');
    const task = {
        model_version: "5.0",
        task_type: "invoke",
        language: "python",
        target: { function: "print" },
        data: { message: "Hello World" }
    };

    try {
        const result = await umb.request('kernel:submit_task', task);
        console.log('[PASS] Task Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('[FAIL] Task Submission Failed:', err);
    }

    console.log('--- Shutting Down ---');
    await kernel.shutdown();
}

test().catch(err => console.error(err));
