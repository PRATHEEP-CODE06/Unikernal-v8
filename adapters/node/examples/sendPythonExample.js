const axios = require("axios");

async function main() {
    const udl = {
        udl_version: "2.0",
        intent: "compute",
        service: "python-math-service", // 👈 hits the Python branch
        values: [10, 20, 30],
        source: "node-python-test",
    };

    console.log("Sending UDL to Unikernal:", udl);

    const res = await axios.post("http://localhost:4000/udl", udl);
    console.log("Kernel response:", res.data);
}

main().catch((err) => {
    console.error("Error:", err.message || err);
});
