const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('r', {
    extension: 'R',
    runCmd: 'Rscript "{source}"'
});

adapter.connect();
