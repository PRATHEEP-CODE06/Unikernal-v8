const { UnikernalClient } = require("../client");

async function main() {
    const client = new UnikernalClient(
        "http://localhost:4000/udl",
        "ws://localhost:4000/ws",
        "node-test-service"
    );

    const message = client.createMessage(
        "string-service",     //  use string-service
        "PING",
        {
            operation: "upper",        // upper / lower / length / concat
            text: "unikernal from node"
        }
    );

    const response = await client.sendUdlHttp(message);
    console.log("Kernel response:", response);
}

main().catch(console.error);
