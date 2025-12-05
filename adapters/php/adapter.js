const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('php', {
    extension: 'php',
    runCmd: 'php "{source}"'
});

adapter.connect();
