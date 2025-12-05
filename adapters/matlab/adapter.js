const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('matlab', {
    extension: 'm',
    // Using -batch for non-interactive execution
    runCmd: 'matlab -batch "run(\'{source}\')"'
});

adapter.connect();
