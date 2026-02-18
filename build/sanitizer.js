/**
 * Input sanitization module for MCP Discord server
 * Provides utilities to sanitize and validate user inputs
 */

// Maximum length limits for various inputs
const LIMITS = {
    MESSAGE_CONTENT: 4000, // Discord message limit
    CHANNEL_NAME: 100, // Discord channel name limit
    ROLE_NAME: 100, // Discord role name limit
    TOPIC: 1024, // Channel topic limit
    USERNAME: 32, // Username limit
    REASON: 512, // Audit log reason limit
    WEBHOOK_CONTENT: 6000, // Webhook content can be slightly higher
    FORUM_TITLE: 100, // Forum thread title limit
    EMOJI: 64, // Custom emoji limit
};

// Valid character patterns for Discord entities
const PATTERNS = {
    // Discord snowflake IDs (17-19 digit numeric strings)
    SNOWFLAKE: /^[0-9]{17,19}$/,
    // Channel names: alphanumeric, hyphens, underscores, no spaces
    CHANNEL_NAME: /^[a-zA-Z0-9-_]+$/,
    // Role names: cannot contain @ or special Discord characters
    ROLE_NAME: /^[^@#:<>]+$/,
    // Basic emoji (unicode) or custom emoji format
    EMOJI: /^(?:[\p{Emoji}\u200d]+|<a?:\w{2,32}:\d{17,19}>)/u,
};

/**
 * Sanitizes a string by truncating to maximum length
 * @param {string} str - The string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @param {string} fieldName - Field name for error messages
 * @returns {object} - { sanitized: string, wasTruncated: boolean, error?: string }
 */
export function truncate(str, maxLength, fieldName = 'input') {
    if (typeof str !== 'string') {
        return {
            sanitized: '',
            wasTruncated: false,
            error: `${fieldName} must be a string`
        };
    }

    if (str.length <= maxLength) {
        return { sanitized: str, wasTruncated: false };
    }

    return {
        sanitized: str.substring(0, maxLength),
        wasTruncated: true,
        truncated: str.length - maxLength
    };
}

/**
 * Validates a Discord snowflake ID format
 * @param {string} id - The ID to validate
 * @returns {object} - { valid: boolean, error?: string }
 */
export function validateSnowflake(id) {
    if (typeof id !== 'string') {
        return { valid: false, error: 'ID must be a string' };
    }

    if (!PATTERNS.SNOWFLAKE.test(id)) {
        return { valid: false, error: 'Invalid Discord ID format (must be 17-19 digit numeric string)' };
    }

    return { valid: true };
}

/**
 * Sanitizes a channel name
 * @param {string} name - The channel name to sanitize
 * @returns {object} - { sanitized?: string, error?: string }
 */
export function sanitizeChannelName(name) {
    if (typeof name !== 'string') {
        return { error: 'Channel name must be a string' };
    }

    // Check length
    if (name.length > LIMITS.CHANNEL_NAME) {
        return { error: `Channel name exceeds maximum length of ${LIMITS.CHANNEL_NAME} characters` };
    }

    if (name.length === 0) {
        return { error: 'Channel name cannot be empty' };
    }

    // Check for valid characters
    const sanitizedName = name.trim();
    if (!PATTERNS.CHANNEL_NAME.test(sanitizedName)) {
        return { error: 'Channel name contains invalid characters (use only letters, numbers, hyphens, and underscores)' };
    }

    return { sanitized: sanitizedName };
}

/**
 * Sanitizes a role name
 * @param {string} name - The role name to sanitize
 * @returns {object} - { sanitized?: string, error?: string }
 */
export function sanitizeRoleName(name) {
    if (typeof name !== 'string') {
        return { error: 'Role name must be a string' };
    }

    // Check length
    if (name.length > LIMITS.ROLE_NAME) {
        return { error: `Role name exceeds maximum length of ${LIMITS.ROLE_NAME} characters` };
    }

    if (name.length === 0) {
        return { error: 'Role name cannot be empty' };
    }

    // Trim whitespace
    const sanitizedName = name.trim();

    // Check for invalid characters (@, #, :, <, >)
    if (PATTERNS.ROLE_NAME.test(sanitizedName)) {
        return { sanitized: sanitizedName };
    }

    return { error: 'Role name contains invalid characters (cannot contain @, #, :, <, >)' };
}

/**
 * Sanitizes message content
 * @param {string} content - The message content to sanitize
 * @param {number} maxLength - Maximum allowed length (defaults to MESSAGE_CONTENT)
 * @returns {object} - { sanitized: string, wasTruncated: boolean, error?: string }
 */
export function sanitizeMessageContent(content, maxLength = LIMITS.MESSAGE_CONTENT) {
    if (typeof content !== 'string') {
        return {
            sanitized: '',
            wasTruncated: false,
            error: 'Message content must be a string'
        };
    }

    // Remove null bytes and other dangerous characters
    let cleaned = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Truncate if necessary
    const result = truncate(cleaned, maxLength, 'message content');

    return result;
}

/**
 * Sanitizes a forum post title
 * @param {string} title - The title to sanitize
 * @returns {object} - { sanitized?: string, error?: string }
 */
export function sanitizeForumTitle(title) {
    if (typeof title !== 'string') {
        return { error: 'Forum title must be a string' };
    }

    if (title.length > LIMITS.FORUM_TITLE) {
        return { error: `Forum title exceeds maximum length of ${LIMITS.FORUM_TITLE} characters` };
    }

    if (title.length === 0) {
        return { error: 'Forum title cannot be empty' };
    }

    // Trim and remove dangerous characters
    const sanitized = title.trim().replace(/[\x00-\x1F\x7F]/g, '');

    return { sanitized };
}

/**
 * Sanitizes a channel topic
 * @param {string} topic - The topic to sanitize
 * @returns {object} - { sanitized: string, wasTruncated: boolean, error?: string }
 */
export function sanitizeTopic(topic) {
    if (typeof topic !== 'string') {
        return {
            sanitized: '',
            wasTruncated: false,
            error: 'Topic must be a string'
        };
    }

    // Remove dangerous characters
    const cleaned = topic.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return truncate(cleaned, LIMITS.TOPIC, 'topic');
}

/**
 * Sanitizes an audit log reason
 * @param {string} reason - The reason to sanitize
 * @returns {object} - { sanitized: string, wasTruncated: boolean }
 */
export function sanitizeReason(reason) {
    if (!reason || typeof reason !== 'string') {
        return { sanitized: '', wasTruncated: false };
    }

    const cleaned = reason.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    return truncate(cleaned, LIMITS.REASON, 'reason');
}

/**
 * Validates an emoji string
 * @param {string} emoji - The emoji to validate
 * @returns {object} - { valid: boolean, error?: string }
 */
export function validateEmoji(emoji) {
    if (typeof emoji !== 'string') {
        return { valid: false, error: 'Emoji must be a string' };
    }

    if (emoji.length > LIMITS.EMOJI) {
        return { valid: false, error: `Emoji exceeds maximum length of ${LIMITS.EMOJI} characters` };
    }

    // Check if it's a valid emoji (unicode or custom)
    if (!PATTERNS.EMOJI.test(emoji)) {
        return { valid: false, error: 'Invalid emoji format' };
    }

    return { valid: true };
}

/**
 * Validates a user mention format
 * @param {string} mention - The mention to validate
 * @returns {object} - { valid: boolean, userId?: string, error?: string }
 */
export function validateUserMention(mention) {
    if (typeof mention !== 'string') {
        return { valid: false, error: 'Mention must be a string' };
    }

    // Check for raw ID
    if (PATTERNS.SNOWFLAKE.test(mention)) {
        return { valid: true, userId: mention };
    }

    // Check for mention format <@userId> or <@!userId>
    const mentionMatch = mention.match(/^<@!?(\d{17,19})>$/);
    if (mentionMatch) {
        return { valid: true, userId: mentionMatch[1] };
    }

    return { valid: false, error: 'Invalid user mention format' };
}

/**
 * Sanitizes webhook content (allows longer messages)
 * @param {string} content - The content to sanitize
 * @returns {object} - { sanitized: string, wasTruncated: boolean, error?: string }
 */
export function sanitizeWebhookContent(content) {
    return sanitizeMessageContent(content, LIMITS.WEBHOOK_CONTENT);
}

/**
 * Sanitizes a username for display
 * @param {string} username - The username to sanitize
 * @returns {object} - { sanitized: string, wasTruncated: boolean, error?: string }
 */
export function sanitizeUsername(username) {
    if (typeof username !== 'string') {
        return {
            sanitized: '',
            wasTruncated: false,
            error: 'Username must be a string'
        };
    }

    const cleaned = username.replace(/[\x00-\x1F\x7F]/g, '');
    return truncate(cleaned, LIMITS.USERNAME, 'username');
}

/**
 * Generic sanitization for any text input
 * @param {string} text - The text to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {object} - { sanitized: string, wasTruncated: boolean, error?: string }
 */
export function sanitizeText(text, maxLength = 1000) {
    if (typeof text !== 'string') {
        return {
            sanitized: '',
            wasTruncated: false,
            error: 'Input must be a string'
        };
    }

    // Remove null bytes and control characters
    const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    return truncate(cleaned, maxLength, 'text');
}

/**
 * Validates an array of IDs
 * @param {string[]} ids - Array of IDs to validate
 * @param {number} maxCount - Maximum number of IDs allowed
 * @returns {object} - { valid: boolean, error?: string }
 */
export function validateIdArray(ids, maxCount = 100) {
    if (!Array.isArray(ids)) {
        return { valid: false, error: 'IDs must be an array' };
    }

    if (ids.length > maxCount) {
        return { valid: false, error: `Cannot process more than ${maxCount} IDs at once` };
    }

    for (const id of ids) {
        const validation = validateSnowflake(id);
        if (!validation.valid) {
            return { valid: false, error: `Invalid ID in array: ${id}` };
        }
    }

    return { valid: true };
}

/**
 * Checks if a payload size is acceptable
 * @param {object|string} payload - The payload to check
 * @param {number} maxSizeBytes - Maximum size in bytes (default 256KB)
 * @returns {object} - { valid: boolean, size: number, error?: string }
 */
export function checkPayloadSize(payload, maxSizeBytes = 256 * 1024) {
    const size = Buffer.byteLength(JSON.stringify(payload), 'utf8');

    if (size > maxSizeBytes) {
        return {
            valid: false,
            size,
            error: `Payload size (${Math.round(size / 1024)}KB) exceeds maximum (${Math.round(maxSizeBytes / 1024)}KB)`
        };
    }

    return { valid: true, size };
}

// Export all limits for use in validation
export const Limits = LIMITS;
export const Patterns = PATTERNS;
