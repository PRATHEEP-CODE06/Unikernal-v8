const NativeAdapter = require('../../kernel/src/adapters/native-adapter');

const adapter = new NativeAdapter('csharp', {
    extension: 'cs',
    // Using csc (C# Compiler) if available, or dotnet script
    // Assuming simple single file compilation for now
    compileCmd: 'csc "{source}" /out:"{output}"',
    runCmd: '"{output}"'
});

adapter.connect();
