const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('java', {
    extension: 'java',
    // Java is tricky because class name must match file name.
    // For now, assuming single file execution via java 11+ source file mode
    runCmd: 'java "{source}"'
});

adapter.connect();
