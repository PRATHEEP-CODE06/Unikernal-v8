const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('c', {
    extension: 'c',
    compileCmd: 'gcc "{source}" -o "{output}"',
    runCmd: '"{output}"'
});

adapter.connect();
