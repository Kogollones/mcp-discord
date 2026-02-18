/**
 * A unified error handler for Discord API errors
 * Provides consistent error handling with improved recovery mechanisms
 */

// Discord API error codes mapping
const DISCORD_ERROR_CODES = {
    UNKNOWN_ACCOUNT: 10001,
    UNKNOWN_APPLICATION: 10002,
    UNKNOWN_CHANNEL: 10003,
    UNKNOWN_GUILD: 10004,
    UNKNOWN_INTEGRATION: 10005,
    UNKNOWN_INVITE: 10006,
    UNKNOWN_MEMBER: 10007,
    UNKNOWN_MESSAGE: 10008,
    UNKNOWN_OVERWRITE: 10009,
    UNKNOWN_PROVIDER: 10010,
    UNKNOWN_ROLE: 10011,
    UNKNOWN_TOKEN: 10012,
    UNKNOWN_USER: 10013,
    UNKNOWN_EMOJI: 10014,
    UNKNOWN_WEBHOOK: 10015,
    UNKNOWN_BAN: 10026,
    UNKNOWN_GUILD_TEMPLATE: 10057,
    UNKNOWN_INTERACTION: 10062,
    UNKNOWN_APPLICATION_COMMAND: 10063,
    UNKNOWN_APPLICATION_COMMAND_PERMISSIONS: 10066,
    UNKNOWN_STAGE_INSTANCE: 10067,
    UNKNOWN_STICKER: 10080,
    UNKNOWN_GUILD_SCHEDULED_EVENT: 10081,

    BOT_PROHIBITED: 20001,
    BOT_ONLY: 20002,
    CHANNEL_WRITE_OVERRIDDEN: 20004,
    HYPESCHEDULED_EVENT_PERMISSION: 20009,
    MAXIMUM_GUILDS: 30001,
    MAXIMUM_FRIENDS: 30002,
    MAXIMUM_PINS: 30003,
    MAXIMUM_ROLES: 30005,
    MAXIMUM_WEBHOOKS: 30007,
    MAXIMUM_REACTIONS: 30010,
    MAXIMUM_CHANNELS: 30013,
    MAXIMUM_ATTACHMENTS: 30015,
    MAXIMUM_INVITES: 30016,
    GUILD_ALREADY_HAS_TEMPLATE: 30031,
    MAXIMUM_ANIMATED_EMOJIS: 30038,
    MAXIMUM_SERVERS: 30040,

    UNAUTHORIZED: 40001,
    USER_BANNED: 40007,
    MISSING_ACCESS: 50001,
    INVALID_ACCOUNT_TYPE: 50002,
    INVALID_DM_CHANNEL: 50003,
    INVALID_OAUTH2_STATE: 50009,
    INVALID_PERMISSIONS: 50010,
    INVALID_COOKIE: 50014,
    INVALID_GUILD: 50015,
    INVALID_INTENTS: 50016,
    INVALID_TOKEN: 50019,
    INVALID_NOTE: 50020,
    INVALID_GUILD_MEMBER: 50025,

    RATE_LIMITED: 429,
    CHANNEL_VERIFICATION_LEVEL: 50020,
    OAUTH2_APPLICATION_BOT_ABSENT: 50024,
    MAXIMUM_OAUTH2_APPLICATIONS: 50025,
    INVALID_LOCALE: 50030,
    INVALID_CHANNEL_TYPE: 50033,
    INVALID_STICKER_SENTENCE: 50039,
    INVALID_ACTIVITY_ACTION: 50046,
    INVALID_WEBHOOK_TOKEN: 50045,
    INVALID_ROLE: 50057,
    INVALID_RECIPIENT: 50050,
    INVALID_MESSAGE_TYPE: 50068,
};

// Rate limit state for tracking
const rateLimitState = {
    lastRateLimit: null,
    retryAfter: 0,
    globalLimit: false,
};

/**
 * Get retry delay from rate limit error
 * @param {object} error - Error object from Discord
 * @returns {number} - Delay in milliseconds
 */
function getRateLimitDelay(error) {
    if (error?.retryAfter) {
        return Math.ceil(error.retryAfter * 1000);
    }
    return 1000; // Default 1 second
}

/**
 * Handle rate limit errors with retry information
 * @param {object} error - Error object from Discord API
 * @param {string} clientId - Optional Discord Client ID
 * @returns {object} Standard error response with retry info
 */
function handleRateLimit(error, clientId) {
    const retryAfter = error?.retryAfter || 1;
    const isGlobal = error?.global || false;

    // Update rate limit state
    rateLimitState.lastRateLimit = Date.now();
    rateLimitState.retryAfter = retryAfter * 1000;
    rateLimitState.globalLimit = isGlobal;

    const retryTime = new Date(Date.now() + rateLimitState.retryAfter).toLocaleTimeString();

    let message = `Discord API rate limit ${isGlobal ? '(global) ' : ''}reached.\n\n`;
    message += `Please wait ${retryAfter.toFixed(1)} seconds before retrying (until ${retryTime}).\n`;
    message += `If this persists, consider spacing out your requests further.`;

    return {
        content: [{ type: "text", text: message }],
        isError: true,
        retryAfter: rateLimitState.retryAfter,
        isGlobal
    };
}

/**
 * Handle permission errors
 * @param {number} code - Discord error code
 * @param {string} message - Error message
 * @param {string} clientId - Discord Client ID
 * @returns {object} Standard error response
 */
function handlePermissionError(code, message, clientId) {
    const inviteLink = clientId
        ? `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot&permissions=8`
        : "https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=8";

    let errorMsg = `Permission Denied (code ${code}): ${message}\n\n`;

    if (code === DISCORD_ERROR_CODES.MISSING_ACCESS) {
        errorMsg += `The bot lacks access to this resource.\n\n`;
        errorMsg += `Solutions:\n`;
        errorMsg += `1. Ensure the bot is in the server\n`;
        errorMsg += `2. Check the bot has the required permissions\n`;
        errorMsg += `3. Verify channel-specific permission overrides\n`;
        if (clientId) {
            errorMsg += `\nRe-authorize bot: ${inviteLink}`;
        }
    } else if (code === DISCORD_ERROR_CODES.BOT_PROHIBITED) {
        errorMsg += `Bots are not allowed to perform this action.\n\n`;
        errorMsg += `This action requires user account permissions.`;
    } else if (code === DISCORD_ERROR_CODES.INVALID_PERMISSIONS) {
        errorMsg += `Invalid permissions specified.\n\n`;
        errorMsg += `Check that permission flags are valid for this context.`;
    } else if (code === DISCORD_ERROR_CODES.INVALID_INTENTS) {
        errorMsg += `Invalid or missing privileged intents.\n\n`;
        errorMsg += `Solution: Enable the required intents (Message Content, Server Members, Presence) `;
        errorMsg += `in the Discord Developer Portal for your bot application.`;
    } else {
        errorMsg += `The bot lacks the required permissions for this action.\n\n`;
        errorMsg += `Solution: Grant the bot appropriate permissions or check channel overrides.`;
    }

    return {
        content: [{ type: "text", text: errorMsg }],
        isError: true,
        code
    };
}

/**
 * Handle resource not found errors
 * @param {number} code - Discord error code
 * @param {string} message - Error message
 * @returns {object} Standard error response
 */
function handleNotFoundError(code, message) {
    let resourceType = 'resource';
    let suggestion = '';

    switch (code) {
        case DISCORD_ERROR_CODES.UNKNOWN_CHANNEL:
            resourceType = 'channel';
            suggestion = '\n\nCheck that the channel ID is correct and the bot has access to it.';
            break;
        case DISCORD_ERROR_CODES.UNKNOWN_GUILD:
            resourceType = 'server';
            suggestion = '\n\nCheck that the server ID is correct and the bot is a member.';
            break;
        case DISCORD_ERROR_CODES.UNKNOWN_MEMBER:
            resourceType = 'member';
            suggestion = '\n\nCheck that the user ID is correct and the user is a member of the server.';
            break;
        case DISCORD_ERROR_CODES.UNKNOWN_MESSAGE:
            resourceType = 'message';
            suggestion = '\n\nCheck that the message ID is correct and in the correct channel.';
            break;
        case DISCORD_ERROR_CODES.UNKNOWN_ROLE:
            resourceType = 'role';
            suggestion = '\n\nCheck that the role ID is correct and exists in the server.';
            break;
        case DISCORD_ERROR_CODES.UNKNOWN_WEBHOOK:
            resourceType = 'webhook';
            suggestion = '\n\nCheck that the webhook ID is correct and the token is valid.';
            break;
        case DISCORD_ERROR_CODES.UNKNOWN_EMOJI:
            resourceType = 'emoji';
            suggestion = '\n\nCheck that the emoji is available in the server or use a standard emoji.';
            break;
        default:
            resourceType = 'resource';
    }

    return {
        content: [{
            type: "text",
            text: `Resource not found (code ${code}): ${resourceType} could not be found.${suggestion}`
        }],
        isError: true,
        code
    };
}

/**
 * Handle validation errors
 * @param {number} code - Discord error code
 * @param {string} message - Error message
 * @returns {object} Standard error response
 */
function handleValidationError(code, message) {
    let errorMsg = `Validation Error (code ${code}): ${message}\n\n`;

    switch (code) {
        case DISCORD_ERROR_CODES.INVALID_TOKEN:
            errorMsg += `The bot token is invalid.\n\n`;
            errorMsg += `Solution: Check the bot token in the Discord Developer Portal.`;
            break;
        case DISCORD_ERROR_CODES.INVALID_ACCOUNT_TYPE:
            errorMsg += `Invalid account type for this operation.`;
            break;
        case DISCORD_ERROR_CODES.INVALID_CHANNEL_TYPE:
            errorMsg += `This operation is not supported for this channel type.\n\n`;
            errorMsg += `For example, you cannot send messages to a voice channel.`;
            break;
        case DISCORD_ERROR_CODES.MAXIMUM_PINS:
            errorMsg += `Maximum number of pinned messages reached (50).`;
            break;
        case DISCORD_ERROR_CODES.MAXIMUM_ROLES:
            errorMsg += `Maximum number of roles reached (250).`;
            break;
        case DISCORD_ERROR_CODES.MAXIMUM_WEBHOOKS:
            errorMsg += `Maximum number of webhooks reached (10 per channel).`;
            break;
        case DISCORD_ERROR_CODES.MAXIMUM_CHANNELS:
            errorMsg += `Maximum number of channels reached (500).`;
            break;
        default:
            errorMsg += `Check that the provided parameters are valid.`;
    }

    return {
        content: [{ type: "text", text: errorMsg }],
        isError: true,
        code
    };
}

/**
 * A unified error handler for Discord API errors
 * @param error - The error object from Discord API calls
 * @param clientId - Optional Discord Client ID for custom invite links
 * @returns A standard tool response with error message and potential solution
 */
export function handleDiscordError(error, clientId) {
    // Ensure error is in the expected format for checking
    const errorMessage = typeof error === 'string'
        ? error
        : error?.message || String(error);
    const errorCode = error?.code;

    // Check for privileged intents errors (special case - no code)
    if (errorMessage.includes('Privileged intent provided is not enabled or whitelisted')) {
        return {
            content: [{
                type: "text",
                text: `Error: Privileged intents are not enabled.

Solution: Please enable the required intents (Message Content, Server Members, Presence) in the Discord Developer Portal for your bot application.

For detailed instructions, check the Prerequisites section in our README.`
            }],
            isError: true,
            code: 'INTENTS_ERROR'
        };
    }

    // Rate limit handling (check code first, then message)
    if (errorCode === DISCORD_ERROR_CODES.RATE_LIMITED || errorMessage.toLowerCase().includes('rate limit')) {
        return handleRateLimit(error, clientId);
    }

    // Permission errors
    if (errorCode === DISCORD_ERROR_CODES.MISSING_ACCESS ||
        errorCode === DISCORD_ERROR_CODES.BOT_PROHIBITED ||
        errorCode === DISCORD_ERROR_CODES.INVALID_PERMISSIONS ||
        errorCode === DISCORD_ERROR_CODES.INVALID_INTENTS ||
        errorMessage.includes('Missing Access') ||
        errorMessage.includes('Missing Permissions')) {
        return handlePermissionError(errorCode, errorMessage, clientId);
    }

    // Not found errors
    if (errorCode === DISCORD_ERROR_CODES.UNKNOWN_CHANNEL ||
        errorCode === DISCORD_ERROR_CODES.UNKNOWN_GUILD ||
        errorCode === DISCORD_ERROR_CODES.UNKNOWN_MEMBER ||
        errorCode === DISCORD_ERROR_CODES.UNKNOWN_MESSAGE ||
        errorCode === DISCORD_ERROR_CODES.UNKNOWN_ROLE ||
        errorCode === DISCORD_ERROR_CODES.UNKNOWN_WEBHOOK ||
        errorCode === DISCORD_ERROR_CODES.UNKNOWN_EMOJI ||
        errorMessage.includes('Unknown Guild') ||
        errorMessage.includes('Unknown Channel')) {
        return handleNotFoundError(errorCode, errorMessage);
    }

    // Validation errors
    if (errorCode === DISCORD_ERROR_CODES.INVALID_TOKEN ||
        errorCode === DISCORD_ERROR_CODES.INVALID_ACCOUNT_TYPE ||
        errorCode === DISCORD_ERROR_CODES.INVALID_CHANNEL_TYPE ||
        errorCode === DISCORD_ERROR_CODES.MAXIMUM_PINS ||
        errorCode === DISCORD_ERROR_CODES.MAXIMUM_ROLES ||
        errorCode === DISCORD_ERROR_CODES.MAXIMUM_WEBHOOKS ||
        errorCode === DISCORD_ERROR_CODES.MAXIMUM_CHANNELS ||
        errorCode >= 30000 && errorCode < 40000) {
        return handleValidationError(errorCode, errorMessage);
    }

    // Default error response
    return {
        content: [{
            type: "text",
            text: `Discord API Error${errorCode ? ` (code ${errorCode})` : ''}: ${errorMessage}`
        }],
        isError: true,
        code: errorCode
    };
}

/**
 * Check if currently rate limited
 * @returns {object} - { isLimited: boolean, retryAfter?: number }
 */
export function getRateLimitStatus() {
    if (!rateLimitState.lastRateLimit) {
        return { isLimited: false };
    }

    const elapsed = Date.now() - rateLimitState.lastRateLimit;
    if (elapsed >= rateLimitState.retryAfter) {
        // Rate limit period has passed
        rateLimitState.lastRateLimit = null;
        rateLimitState.retryAfter = 0;
        return { isLimited: false };
    }

    return {
        isLimited: true,
        retryAfter: rateLimitState.retryAfter - elapsed,
        isGlobal: rateLimitState.globalLimit
    };
}

/**
 * Reset rate limit state (for testing or manual reset)
 */
export function resetRateLimitState() {
    rateLimitState.lastRateLimit = null;
    rateLimitState.retryAfter = 0;
    rateLimitState.globalLimit = false;
}

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {object} options - Optional parameters
 * @returns {object} Standard error response
 */
export function createErrorResponse(message, options = {}) {
    return {
        content: [{ type: "text", text: message }],
        isError: true,
        ...options
    };
}

/**
 * Wrap a handler with error handling
 * @param {Function} handler - The handler function to wrap
 * @param {string} context - Context description for errors
 * @returns {Function} Wrapped handler
 */
export function withErrorHandling(handler, context = 'Operation') {
    return async (...args) => {
        try {
            return await handler(...args);
        } catch (error) {
            console.error(`Error in ${context}:`, error);
            return handleDiscordError(error);
        }
    };
}

// Export error codes for external use
export { DISCORD_ERROR_CODES };
