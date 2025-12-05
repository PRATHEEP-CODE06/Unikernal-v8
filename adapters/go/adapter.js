const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('go', {
    extension: 'go',
    runCmd: 'go run "{source}"'
});

adapter.connect();
