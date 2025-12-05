const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('ruby', {
    extension: 'rb',
    runCmd: 'ruby "{source}"'
});

adapter.connect();
