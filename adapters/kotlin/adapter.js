const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('kotlin', {
    extension: 'kt',
    compileCmd: 'kotlinc "{source}" -include-runtime -d "{output}.jar"',
    runCmd: 'java -jar "{output}.jar"'
});

adapter.connect();
