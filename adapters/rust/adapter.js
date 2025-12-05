const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('rust', {
    extension: 'rs',
    compileCmd: 'rustc "{source}" -o "{output}"',
    runCmd: '"{output}"'
});

adapter.connect();
