const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('cpp', {
    extension: 'cpp',
    compileCmd: 'g++ "{source}" -o "{output}"',
    runCmd: '"{output}"'
});

adapter.connect();
