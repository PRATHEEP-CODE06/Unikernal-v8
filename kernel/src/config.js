const PORT = process.env.PORT || 3000;
const HTTP_PATH = "/udl";
const WS_PATH = "/ws";

// Version Constants
const VERSION = "8.0.0";
const API_VERSION = "8.0";
const PROTOCOL_VERSION = "8.0";
const KERNEL_NAME = "Unikernal";
const BUILD_HASH = process.env.BUILD_HASH || "dev";

module.exports = {
  PORT,
  HTTP_PATH,
  WS_PATH,
  VERSION,
  API_VERSION,
  PROTOCOL_VERSION,
  KERNEL_NAME,
  BUILD_HASH
};
