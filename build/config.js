/**
 * Centralized configuration management for MCP Discord server
 * Configuration priority: CLI args > ENV vars > config file > defaults
 */

import { config as dotenvConfig } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    server: {
        port: 8080,
        statusCheckInterval: 10000,
        logLevel: 'info'
    },
    discord: {
        token: null,
        heartbeatInterval: 30000,
        gatewayIntents: [
            'Guilds',
            'GuildMessages',
            'MessageContent'
        ],
        reactionDelays: {
            single: 300,
            multiple: 500
        },
        maxCacheSize: 1000
    },
    cache: {
        ttlGuilds: 300000,    // 5 minutes
        ttlChannels: 120000,  // 2 minutes
        ttlRoles: 300000,     // 5 minutes
        ttlMembers: 60000     // 1 minute
    },
    rateLimiter: {
        maxConcurrent: 5,
        highThreshold: 3,
        queueTimeout: 30000
    }
};

/**
 * Parse command line arguments
 */
function parseCliArgs() {
    const args = {};
    const argv = process.argv.slice(2);

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const nextArg = argv[i + 1];

        if (arg === '--config' && nextArg) {
            args.configPath = nextArg;
            i++;
        } else if (arg === '--port' && nextArg) {
            args.port = parseInt(nextArg, 10);
            i++;
        } else if (arg === '--token' && nextArg) {
            args.token = nextArg;
            i++;
        } else if (arg === '--transport' && nextArg) {
            args.transport = nextArg;
            i++;
        } else if (arg === '--log-level' && nextArg) {
            args.logLevel = nextArg;
            i++;
        } else if (arg === '--heartbeat-interval' && nextArg) {
            args.heartbeatInterval = parseInt(nextArg, 10);
            i++;
        } else if (arg === '--status-check-interval' && nextArg) {
            args.statusCheckInterval = parseInt(nextArg, 10);
            i++;
        }
    }

    return args;
}

/**
 * Load configuration from a JSON file
 */
function loadConfigFile(configPath) {
    const pathsToTry = configPath
        ? [resolve(configPath)]
        : [
            resolve(process.cwd(), 'config.json'),
            resolve(__dirname, '..', 'config.json'),
            resolve(process.cwd(), 'config.example.json')
        ];

    for (const path of pathsToTry) {
        if (existsSync(path)) {
            try {
                const content = readFileSync(path, 'utf-8');
                return JSON.parse(content);
            } catch (err) {
                // Silently skip invalid config files
                continue;
            }
        }
    }

    return {};
}

/**
 * Get configuration value from environment variable
 */
function getEnvValue(key, defaultValue = undefined) {
    // Map config keys to environment variable names
    const envMappings = {
        'server.port': 'DISCORD_PORT',
        'server.logLevel': 'DISCORD_LOG_LEVEL',
        'server.statusCheckInterval': 'DISCORD_STATUS_CHECK_INTERVAL',
        'discord.token': 'DISCORD_TOKEN',
        'discord.heartbeatInterval': 'DISCORD_HEARTBEAT_INTERVAL',
        'discord.maxCacheSize': 'DISCORD_MAX_CACHE_SIZE',
        'cache.ttlGuilds': 'CACHE_TTL_GUILDS',
        'cache.ttlChannels': 'CACHE_TTL_CHANNELS',
        'cache.ttlRoles': 'CACHE_TTL_ROLES',
        'cache.ttlMembers': 'CACHE_TTL_MEMBERS',
        'rateLimiter.maxConcurrent': 'RATE_LIMIT_MAX_CONCURRENT',
        'rateLimiter.highThreshold': 'RATE_LIMIT_HIGH_THRESHOLD',
        'rateLimiter.queueTimeout': 'RATE_LIMIT_QUEUE_TIMEOUT'
    };

    const envVar = envMappings[key];
    if (envVar && process.env[envVar] !== undefined) {
        return process.env[envVar];
    }

    return defaultValue;
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
    const result = { ...target };

    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }

    return result;
}

/**
 * Set nested value in object
 */
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
}

/**
 * Apply CLI arguments to configuration
 */
function applyCliArgs(config, cliArgs) {
    const result = { ...config };

    if (cliArgs.port !== undefined) {
        setNestedValue(result, 'server.port', cliArgs.port);
    }
    if (cliArgs.token !== undefined) {
        setNestedValue(result, 'discord.token', cliArgs.token);
    }
    if (cliArgs.logLevel !== undefined) {
        setNestedValue(result, 'server.logLevel', cliArgs.logLevel);
    }
    if (cliArgs.heartbeatInterval !== undefined) {
        setNestedValue(result, 'discord.heartbeatInterval', cliArgs.heartbeatInterval);
    }
    if (cliArgs.statusCheckInterval !== undefined) {
        setNestedValue(result, 'server.statusCheckInterval', cliArgs.statusCheckInterval);
    }

    return result;
}

/**
 * Apply environment variables to configuration
 */
function applyEnvVars(config) {
    const result = { ...config };

    // Apply environment variables with proper type conversion
    for (const key of Object.keys(result)) {
        applyEnvVarsRecursive(result[key], key);
    }

    return result;
}

/**
 * Recursively apply environment variables
 */
function applyEnvVarsRecursive(obj, path) {
    const result = { ...obj };

    for (const key of Object.keys(obj)) {
        const fullPath = `${path}.${key}`;
        const envValue = getEnvValue(fullPath);

        if (envValue !== undefined) {
            // Convert to appropriate type
            if (typeof obj[key] === 'number') {
                result[key] = parseInt(envValue, 10);
            } else if (typeof obj[key] === 'boolean') {
                result[key] = envValue === 'true' || envValue === '1';
            } else if (Array.isArray(obj[key])) {
                // Handle arrays (comma-separated strings)
                result[key] = envValue.split(',').map(s => s.trim());
            } else {
                result[key] = envValue;
            }
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            result[key] = applyEnvVarsRecursive(obj[key], fullPath);
        }
    }

    return result;
}

/**
 * Get the transport type from CLI or environment
 */
function getTransportType(cliArgs) {
    // First check CLI args
    if (cliArgs.transport) {
        return cliArgs.transport;
    }
    // Then check environment
    if (process.env.DISCORD_TRANSPORT) {
        return process.env.DISCORD_TRANSPORT;
    }
    // Default to stdio
    return 'stdio';
}

/**
 * Load and build the final configuration
 */
function loadConfig() {
    const cliArgs = parseCliArgs();

    // Load config file if specified or found
    const configFile = loadConfigFile(cliArgs.configPath);

    // Merge: defaults -> config file -> env vars -> CLI args
    let config = deepMerge(DEFAULT_CONFIG, configFile);
    config = applyEnvVars(config);
    config = applyCliArgs(config, cliArgs);

    // Add transport type separately (not nested in config structure)
    config.transport = getTransportType(cliArgs);

    return config;
}

/**
 * Get the configuration object
 */
export function getConfig() {
    return loadConfig();
}

/**
 * Get a specific configuration value by path
 */
export function getConfigValue(path, defaultValue = undefined) {
    const config = getConfig();
    const keys = path.split('.');
    let current = config;

    for (const key of keys) {
        if (current && key in current) {
            current = current[key];
        } else {
            return defaultValue;
        }
    }

    return current;
}

export default getConfig();
