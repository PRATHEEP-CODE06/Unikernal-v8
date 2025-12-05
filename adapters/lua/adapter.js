const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('lua', {
    extension: 'lua',
    runCmd: 'lua "{source}"'
});

adapter.connect();
