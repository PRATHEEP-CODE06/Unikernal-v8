const UDMv7 = require("../kernel/src/udm/UDMv7");
const UDLv7Parser = require("../kernel/src/udl/UDLv7Parser");
const fs = require('fs');
const util = require('util');

// Setup logging to file
const logFile = fs.createWriteStream('test_udl_udm_results.txt', { flags: 'w' });
const logStdout = process.stdout;
console.log = function (d) {
    logFile.write(util.format(d) + '\n');
    logStdout.write(util.format(d) + '\n');
};

async function runTests() {
    console.log("=== Starting UDL/UDM v7 Verification ===");

    // 1. Test UDM Creation
    console.log("\n--- Test 1: UDM Creation ---");
    const udm = UDMv7.create("struct", { id: 1, name: "Test" });
    console.log("UDM:", JSON.stringify(udm));

    const valid = UDMv7.validate(udm);
    console.log("Valid:", valid.valid);

    // 2. Test UDL Parsing (JSON)
    console.log("\n--- Test 2: UDL Parsing (JSON) ---");
    const jsonUDL = JSON.stringify({
        systems: { sys1: { type: "python" } },
        routes: [{ from: "sys1", to: "sys2" }]
    });
    const parsedJson = UDLv7Parser.parse(jsonUDL, 'json');
    console.log("Parsed JSON UDL:", JSON.stringify(parsedJson));

    // 3. Test UDL Parsing (YAML)
    console.log("\n--- Test 3: UDL Parsing (YAML) ---");
    const yamlUDL = `
systems:
  sys1:
    type: python
routes:
  - from: sys1
    to: sys2
`;
    const parsedYaml = UDLv7Parser.parse(yamlUDL, 'yaml');
    console.log("Parsed YAML UDL:", JSON.stringify(parsedYaml));

    console.log("\n=== Verification Complete ===");
}

runTests().catch(console.error);
