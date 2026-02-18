import config from './config.js';

// Log level priorities (lower number = higher priority)
const LOG_LEVELS = {
    'debug': 0,
    'info': 1,
    'warn': 2,
    'error': 3
};

// Get configured log level
const configuredLevel = config.server.logLevel || 'info';
const minPriority = LOG_LEVELS[configuredLevel] ?? 1;

/**
 * Patterns for detecting and redacting sensitive information
 * These patterns match common sensitive data formats that should not appear in logs
 */
const SENSITIVE_PATTERNS = [
    // Discord bot tokens (typically starts with specific prefixes)
    {
        pattern: /(M[Tt][A-Za-z0-9_-]{23,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{27,})/g,
        placeholder: '[BOT_TOKEN_REDACTED]'
    },
    // Discord user tokens (base64-like strings)
    {
        pattern: /([A-Za-z0-9+/]{30,}={0,2}\.[A-Za-z0-9+/]{30,}={0,2})/g,
        placeholder: '[USER_TOKEN_REDACTED]'
    },
    // Discord webhook URLs
    {
        pattern: /(https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+)/g,
        placeholder: '[WEBHOOK_URL_REDACTED]'
    },
    // Discord webhook tokens in messages
    {
        pattern: /(webhook.*?:\s*[A-Za-z0-9_-]{60,})/gi,
        placeholder: '[WEBHOOK_TOKEN_REDACTED]'
    },
    // Generic API keys (common patterns)
    {
        pattern: /(['"`]?(?:api[_-]?key|apikey|api_key|secret|auth[_-]?token|access[_-]?token)['"`]?\s*[:=]\s*['"`]?)([A-Za-z0-9_\-\.]{20,})(['"`]?)/gi,
        placeholder: '$1[API_KEY_REDACTED]$3'
    },
    // Bearer tokens
    {
        pattern: /(Bearer\s+)([A-Za-z0-9_\-\.]{20,})/gi,
        placeholder: '$1[BEARER_TOKEN_REDACTED]'
    },
    // Authorization headers
    {
        pattern: /(['"`]authorization['"`]\s*:\s*['"`])([^'"`]+)(['"`])/gi,
        placeholder: '$1[AUTHORIZATION_REDACTED]$3'
    },
    // Password fields
    {
        pattern: /(['"`]password['"`]\s*:\s*['"`])([^'"`]*)(['"`])/gi,
        placeholder: '$1[PASSWORD_REDACTED]$3'
    },
    // Token fields
    {
        pattern: /(['"`]token['"`]\s*:\s*['"`])([^'"`]{10,})(['"`])/gi,
        placeholder: '$1[TOKEN_REDACTED]$3'
    },
];

/**
 * Additional patterns to redact from JSON objects
 * These are field names that should be redacted in logged objects
 */
const SENSITIVE_FIELDS = [
    'token',
    'password',
    'api_key',
    'apikey',
    'api_key_secret',
    'secret',
    'webhook_token',
    'webhookToken',
    'authorization',
    'auth_token',
    'access_token',
    'refresh_token',
    'client_secret',
    'bearer',
    'webhook_url',
    'webhookUrl',
];

/**
 * Redact sensitive information from a string
 * @param {string} message - The message to redact
 * @returns {string} The redacted message
 */
function redactSensitiveInfo(message) {
    if (typeof message !== 'string') {
        return message;
    }

    let redacted = message;

    // Apply all sensitive patterns
    for (const { pattern, placeholder } of SENSITIVE_PATTERNS) {
        redacted = redacted.replace(pattern, placeholder);
    }

    return redacted;
}

/**
 * Redact sensitive fields from an object
 * @param {object} obj - The object to redact
 * @param {number} depth - Current recursion depth
 * @returns {object|string} The redacted object or string
 */
function redactObject(obj, depth = 0) {
    const MAX_DEPTH = 10;

    if (depth > MAX_DEPTH) {
        return '[MAX_DEPTH_REACHED]';
    }

    // Handle primitives
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'string') {
        return redactSensitiveInfo(obj);
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => redactObject(item, depth + 1));
    }

    // Handle objects - redact sensitive fields
    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // Check if this is a sensitive field
        if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
            redacted[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            redacted[key] = redactObject(value, depth + 1);
        } else if (typeof value === 'string') {
            redacted[key] = redactSensitiveInfo(value);
        } else {
            redacted[key] = value;
        }
    }

    return redacted;
}

/**
 * Sanitize log message by redacting sensitive information
 * @param {any} message - The message to sanitize
 * @returns {string} The sanitized message
 */
function sanitizeMessage(message) {
    // If it's an object, redact sensitive fields
    if (typeof message === 'object' && message !== null) {
        // Handle Error objects specially
        if (message instanceof Error) {
            const redactedObj = {
                name: message.name,
                message: redactSensitiveInfo(String(message.message)),
                stack: redactSensitiveInfo(String(message.stack || ''))
            };
            // Include any other properties from the error
            for (const key in message) {
                if (key !== 'name' && 'message' && 'stack') {
                    const lowerKey = key.toLowerCase();
                    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
                        redactedObj[key] = '[REDACTED]';
                    } else {
                        redactedObj[key] = message[key];
                    }
                }
            }
            return JSON.stringify(redactedObj);
        }
        return JSON.stringify(redactObject(message));
    }

    // For strings and primitives, just apply string redaction
    return redactSensitiveInfo(String(message));
}

/**
 * Check if a log level should be logged based on configured level
 */
function shouldLog(level) {
    const priority = LOG_LEVELS[level] ?? 1;
    return priority >= minPriority;
}

/**
 * Core logging function with automatic redaction
 * @param {any} message - The message to log
 * @param {string} level - Log level (debug, info, warn, error)
 * @param {object} metadata - Optional metadata to include
 */
export function log(message, level = 'info', metadata = {}) {
    if (!shouldLog(level)) {
        return; // Skip logging if level is below configured minimum
    }

    // Sanitize the primary message
    const sanitizedMessage = sanitizeMessage(message);

    // Build the log entry
    const logEntry = {
        level,
        message: sanitizedMessage,
        timestamp: new Date().toISOString()
    };

    // Add sanitized metadata if provided
    if (Object.keys(metadata).length > 0) {
        logEntry.metadata = sanitizeMessage(metadata);
    }

    const logMessage = {
        jsonrpc: '2.0',
        method: 'log',
        params: logEntry
    };

    process.stdout.write(JSON.stringify(logMessage) + '\n');
}

export function info(message, metadata) {
    log(message, 'info', metadata);
}

export function warn(message, metadata) {
    log(message, 'warn', metadata);
}

export function error(message, metadata) {
    log(message, 'error', metadata);
}

export function debug(message, metadata) {
    log(message, 'debug', metadata);
}

/**
 * Log sanitization utility - can be used externally
 * @param {any} data - Data to sanitize for logging
 * @returns {string} Sanitized string representation
 */
export function sanitizeForLog(data) {
    return sanitizeMessage(data);
}

/**
 * Redact a string (utility for external use)
 * @param {string} str - String to redact
 * @returns {string} Redacted string
 */
export function redact(str) {
    return redactSensitiveInfo(str);
}

export function setLogLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
        configuredLevel = level;
        minPriority = LOG_LEVELS[level];
    }
}

export function getLogLevel() {
    return configuredLevel;
}

// Export the redaction utilities for use in other modules
export { SENSITIVE_PATTERNS, SENSITIVE_FIELDS };
