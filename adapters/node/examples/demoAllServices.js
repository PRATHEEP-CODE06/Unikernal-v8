// adapters/node/examples/demoAllServices.js
const axios = require("axios");
const { UnikernalClient } = require("../client");

async function callStringService() {
  const client = new UnikernalClient(
    "http://localhost:4000/udl",
    "ws://localhost:4000/ws",
    "demo-client" // service id / source
  );

  const message = client.createMessage(
    "string-service",      // target
    "PING",                // intent
    {
      operation: "upper",  // upper / lower / length / concat
      text: "unikernal from node demo",
    }
  );

  console.log("\n--- Calling Node string-service ---");
  console.log("UDL:", message);

  const response = await client.sendUdlHttp(message);
  console.log("Response:", response);
}

// Python math-service in LIST mode (values[])
async function callPythonMathServiceList() {
  async function callOp(operation, values) {
    const udl = {
      udl_version: "2.0",
      intent: "compute",
      service: "python-math-service",
      mode: "list",             // list math mode
      operation,                // "sum", "product", "average", "min", "max", "subtract", "divide"
      values,
      source: "demo-client",
    };

    console.log(`\n--- Python math-service list (${operation}) ---`);
    console.log("UDL:", udl);

    const res = await axios.post("http://localhost:4000/udl", udl);
    console.log("Response:", res.data);
  }

  await callOp("sum",      [10, 20, 30]);
  await callOp("product",  [2, 3, 4]);
  await callOp("average",  [10, 20, 30]);
  await callOp("min",      [99, 3, 42]);
  await callOp("max",      [99, 3, 42]);
  await callOp("subtract", [100, 10, 5]);
  await callOp("divide",   [100, 2, 5]);
}

// Python math-service in CALCULATOR mode (a, b, op)
async function callPythonMathServiceCalc() {
  async function calc(operation, a, b) {
    const udl = {
      udl_version: "2.0",
      intent: "compute",
      service: "python-math-service",
      mode: "calc",             // calculator mode
      operation,                // "add", "sub", "mul", "div", "mod", "pow"
      a,
      b,
      source: "demo-client",
    };

    console.log(`\n--- Python math-service calc (${a} ${operation} ${b}) ---`);
    console.log("UDL:", udl);

    const res = await axios.post("http://localhost:4000/udl", udl);
    console.log("Response:", res.data);
  }

  await calc("add", 10, 5);
  await calc("sub", 10, 5);
  await calc("mul", 7, 6);
  await calc("div", 100, 4);
  await calc("mod", 10, 3);
  await calc("pow", 2, 8);
}

async function main() {
  try {
    await callStringService();         // Node string-service
    await callPythonMathServiceList(); // Python list math
    await callPythonMathServiceCalc(); // Python calculator
    console.log("\n✅ Demo finished successfully.");
  } catch (err) {
    console.error("\n❌ Demo error:", err.response?.data || err.message || err);
  }
}

main();
