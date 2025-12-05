const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('typescript', {
    extension: 'ts',
    runCmd: 'npx ts-node "{source}"'
});

adapter.connect();
