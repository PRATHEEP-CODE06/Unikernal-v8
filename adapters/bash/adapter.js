const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('bash', {
    extension: 'sh',
    runCmd: 'bash "{source}"'
});

adapter.connect();
