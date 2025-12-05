
/**
 * Unikernal CLI Debugger
 * Allows manual task submission and inspection.
 */

const WebSocket = require("ws");
const readline = require("readline");

const KERNEL_URL = "ws://localhost:4000/ws";
const ws = new WebSocket(KERNEL_URL);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let registered = false;

ws.on("open", () => {
  // 🔹 Step 1: Register this client with the kernel
  const registerMsg = {
    type: "register",
    service: "debugger",
    protocol: "cli-debugger",
    version: "1.0.0",
  };
  console.log("Connecting to kernel, sending registration...");
  ws.send(JSON.stringify(registerMsg));

  console.log("Debugger Connected. Type a command:");
  console.log("  submit <json_task>");
  console.log("  exit");
  prompt();
});

ws.on("message", (msg) => {
  try {
    const data = JSON.parse(msg.toString());

    // If the kernel ever sends back some kind of "registered" ack, you can detect here.
    if (data.type === "register_ack" && data.service === "debugger") {
      registered = true;
      console.log("[Kernel] Debugger registration acknowledged.");
      return;
    }

    console.log("\n[Kernel response]");
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("\n[Kernel raw message]");
    console.log(msg.toString());
  }
  prompt();
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err.message);
});

ws.on("close", () => {
  console.log("Disconnected from kernel.");
  rl.close();
});

function prompt() {
  rl.question("> ", (line) => {
    handleCommand(line);
  });
}

function handleCommand(line) {
  const trimmed = line.trim();
  const args = trimmed.split(" ");
  const cmd = args[0];

  if (cmd === "exit") {
    ws.close();
    return;
  } else if (cmd === "submit") {
    try {
      const jsonStr = trimmed.substring(7).trim(); // everything after 'submit '
      const task = JSON.parse(jsonStr);
      console.log("Submitting task:", task);

      // 🔹 Step 2: Send the task as-is. Kernel will treat it as a debug task.
      ws.send(JSON.stringify(task));
    } catch (e) {
      console.error("Invalid JSON:", e.message);
    }
  } else {
    console.log("Unknown command. Use:");
    console.log("  submit <json_task>");
    console.log("  exit");
  }

  prompt();
}
