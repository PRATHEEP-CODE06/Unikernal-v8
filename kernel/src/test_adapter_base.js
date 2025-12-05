const Kernel = require('./core/kernel');
const AdapterBase = require('./adapters/adapter-base');
const umb = require('./umb/umb');

class TestAdapter extends AdapterBase {
    async execute(task) {
        console.log(`[TestAdapter] Executing task: ${task.target.function}`);
        return { result: `Executed ${task.target.function} in TestAdapter` };
    }
}

async function test() {
    console.log('--- Starting Adapter Base Test ---');
    const kernel = new Kernel();
    await kernel.start();

    // 1. Initialize Adapter (it auto-registers)
    const adapter = new TestAdapter('test-lang');

    // Allow time for registration
    await new Promise(r => setTimeout(r, 100));

    // 2. Submit Task
    const task = {
        model_version: "5.0",
        task_type: "invoke",
        language: "test-lang",
        target: { function: "myFunc" },
        data: {}
    };

    try {
        const result = await umb.request('kernel:submit_task', task);
        console.log('[PASS] Task Result:', result);
    } catch (err) {
        console.error('[FAIL] Task Submission Failed:', err);
    }

    await kernel.shutdown();
}

test().catch(err => console.error(err));
