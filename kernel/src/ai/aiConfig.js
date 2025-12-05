/**
 * aiConfig.js
 * Central configuration for Unikernal v8 AI Pipeline.
 */

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
    // Master switch for AI features
    AI_ENABLED: process.env.UNIKERNAL_AI_ENABLED !== 'false', // default true

    // Selected provider: "mock", "deepseek", "openai", etc.
    AI_PROVIDER: process.env.UNIKERNAL_AI_PROVIDER || "mock",

    // Default model identifier
    AI_DEFAULT_MODEL: process.env.UNIKERNAL_AI_MODEL || "mock-v8-chat",

    // Timeout for AI requests in milliseconds
    TIMEOUT_MS: parseInt(process.env.UNIKERNAL_AI_TIMEOUT_MS, 10) || 15000,

    // Development mode flag
    DEV_MODE: isDev
};
