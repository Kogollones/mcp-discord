import { handleDiscordError } from "../errorHandler.js";
import { info, error } from "../logger.js";

/**
 * Error response for when client is not ready
 */
function createNotReadyResponse() {
    return {
        content: [{ type: "text", text: "Discord client not logged in." }],
        isError: true
    };
}

/**
 * Wraps a handler function with client ready check and error handling.
 *
 * @param {Function} handler - The handler function to wrap
 * @param {boolean} requireReady - Whether to require client to be ready (default: true)
 * @returns {Function} Wrapped handler function
 */
export function withHandler(handler, requireReady = true) {
    return async (args, context) => {
        try {
            // Check if client is ready (for all Discord API tools except login)
            if (requireReady && !context.client.isReady()) {
                return createNotReadyResponse();
            }

            // Call the original handler
            return await handler(args, context);
        } catch (err) {
            return handleDiscordError(err);
        }
    };
}

/**
 * Validates that the client is ready before executing a handler.
 * Throws an error if client is not ready.
 *
 * @param {Object} context - Tool context containing client
 * @throws {Error} If client is not ready
 */
export function requireClientReady(context) {
    if (!context.client.isReady()) {
        throw new Error("Discord client not logged in.");
    }
}

/**
 * Creates a handler wrapper that includes both client ready check and schema validation.
 *
 * @param {Function} handler - The handler function to wrap
 * @param {Object} schema - Zod schema for validation
 * @param {boolean} requireReady - Whether to require client to be ready (default: true)
 * @returns {Function} Wrapped handler function with validation
 */
export function withValidation(handler, schema, requireReady = true) {
    return async (args, context) => {
        try {
            // Parse and validate arguments
            const parsedArgs = schema.parse(args);

            // Check if client is ready (for all Discord API tools except login)
            if (requireReady && !context.client.isReady()) {
                return createNotReadyResponse();
            }

            // Call the original handler with parsed args
            return await handler(parsedArgs, context);
        } catch (err) {
            return handleDiscordError(err);
        }
    };
}

/**
 * Creates a response object for successful tool execution.
 *
 * @param {string} text - Response text
 * @returns {Object} Formatted response object
 */
export function createSuccessResponse(text) {
    return {
        content: [{ type: "text", text }]
    };
}

/**
 * Creates a response object for failed tool execution.
 *
 * @param {string} text - Error message text
 * @returns {Object} Formatted error response object
 */
export function createErrorResponse(text) {
    return {
        content: [{ type: "text", text }],
        isError: true
    };
}

/**
 * Attempts to reconnect the Discord client using its existing token.
 * Returns true if reconnection was successful, false otherwise.
 *
 * @param {Object} client - Discord.js client instance
 * @returns {Promise<boolean>} True if reconnected successfully
 */
export async function attemptReconnect(client) {
    if (!client.token) {
        return false;
    }

    info("Has token but not ready - attempting to force reconnect");
    try {
        await client.login(client.token);
        const success = client.isReady();
        info(`Force reconnect ${success ? 'successful' : 'failed'}: ${success}`);
        return success;
    } catch (reconnectError) {
        error(`Reconnect failed: ${reconnectError instanceof Error ? reconnectError.message : String(reconnectError)}`);
        return false;
    }
}
