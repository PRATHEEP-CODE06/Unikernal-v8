const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('swift', {
    extension: 'swift',
    runCmd: 'swift "{source}"'
});

adapter.connect();
