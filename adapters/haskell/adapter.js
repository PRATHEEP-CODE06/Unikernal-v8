const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('haskell', {
    extension: 'hs',
    runCmd: 'runhaskell "{source}"'
});

adapter.connect();
