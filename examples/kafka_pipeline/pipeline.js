const { executePipeline } = require('../../kernel/src/routingKernel');

const pipeline = {
    steps: [
        { name: "validate", target: "echo-service" },
        { name: "transform", target: "echo-service" },
        { name: "store", target: "echo-service" }
    ]
};

const initialData = {
    event: "user_signup",
    user_id: 123,
    timestamp: new Date().toISOString()
};

executePipeline(pipeline, initialData)
    .then(result => {
        console.log("Pipeline completed:", result);
    })
    .catch(err => {
        console.error("Pipeline failed:", err);
    });
