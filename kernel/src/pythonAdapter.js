// kernel/src/pythonAdapter.js
const { spawn } = require("child_process");
const path = require("path");

const pythonCmd = "python"; // or "python.exe" if needed on Windows

// Path to C:\Users\iriss\Unikernal\adapters\python\python-adapter.py
const adapterPath = path.join(__dirname, "..", "..", "adapters", "python", "python-adapter.py");

let pythonProcess = null;
let pendingPromise = null;

function startPythonAdapter() {
    if (pythonProcess) return;

    pythonProcess = spawn(pythonCmd, [adapterPath], {
        stdio: ["pipe", "pipe", "inherit"], // stdin, stdout, stderr
    });

    console.log("[NODE] Started python-adapter child process:", adapterPath);

    pythonProcess.stdout.on("data", (data) => {
        const text = data.toString().trim();
        if (!text) return;

        // We assume one JSON object per line
        try {
            const json = JSON.parse(text);
            if (pendingPromise) {
                pendingPromise.resolve(json);
                pendingPromise = null;
            } else {
                console.log("[NODE] Python adapter sent message without pending promise:", json);
            }
        } catch (err) {
            console.error("[NODE] Failed to parse JSON from python adapter:", text);
            if (pendingPromise) {
                pendingPromise.reject(err);
                pendingPromise = null;
            }
        }
    });

    pythonProcess.on("exit", (code) => {
        console.error(`[NODE] python-adapter exited with code ${code}`);
        pythonProcess = null;
        if (pendingPromise) {
            pendingPromise.reject(new Error("Python adapter exited"));
            pendingPromise = null;
        }
    });
}

function sendToPython(udm) {
    return new Promise((resolve, reject) => {
        if (!pythonProcess) {
            startPythonAdapter();
        }

        if (pendingPromise) {
            return reject(new Error("Python adapter: only one in-flight request supported in this simple version"));
        }

        pendingPromise = { resolve, reject };

        const line = JSON.stringify(udm) + "\n";
        pythonProcess.stdin.write(line, "utf8", (err) => {
            if (err) {
                pendingPromise = null;
                return reject(err);
            }
        });
    });
}

module.exports = {
    sendToPython,
};
