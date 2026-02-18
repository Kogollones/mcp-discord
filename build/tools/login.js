import { DiscordLoginSchema } from '../schemas.js';
import { handleDiscordError } from "../errorHandler.js";
import { info, error } from '../logger.js';

/**
 * Waits for the Discord client to be ready with a timeout.
 * Uses discord.js's built-in once() wrapper which automatically cleans up listeners.
 *
 * @param {Object} client - Discord.js client instance
 * @param {string} token - Discord bot token
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns {Promise<Object>} The ready client instance
 */
async function waitForReady(client, token, timeoutMs = 30000) {
    // If client is already ready, return immediately
    if (client.isReady()) {
        info('Client is already ready');
        return client;
    }

    // Create a timeout promise that rejects if not ready in time
    const timeoutPromise = new Promise((_, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`Client ready event timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        // Ensure timeout is cleaned up
        timeout.unref?.();
    });

    // Create the ready promise using discord.js's built-in once() wrapper
    // This automatically cleans up the listener after resolution
    const readyPromise = client.once('ready');

    // Start login process
    info('Starting login process and waiting for ready event');
    const loginPromise = client.login(token);

    try {
        // Wait for login to complete
        await loginPromise;
        // Race between ready event and timeout
        await Promise.race([readyPromise, timeoutPromise]);
        info('Client ready event received');
        return client;
    } catch (err) {
        // Error is already handled by the promise rejection
        throw err;
    }
}
export const loginHandler = async (args, context) => {
    DiscordLoginSchema.parse(args);
    try {
        // Check if client is already logged in
        if (context.client.isReady()) {
            return {
                content: [{ type: "text", text: `Already logged in as: ${context.client.user?.tag}` }]
            };
        }
        // Use token from args if provided, otherwise fall back to the client's token
        const token = args.token || context.client.token;
        // Check if we have a token to use
        if (!token) {
            return {
                content: [{ type: "text", text: "Discord token not provided and not configured. Cannot log in. Please check the following: 1. Provide a token in the login command or make sure the token is correctly set in your config or environment variables. 2. Ensure all required privileged intents (Message Content, Server Members, Presence) are enabled in the Discord Developer Portal for your bot application." }],
                isError: true
            };
        }
        // If token is provided in args, update the client's token
        if (args.token) {
            context.client.token = args.token;
        }
        // Attempt to log in with the token and get the ready client
        const readyClient = await waitForReady(context.client, token);
        // Update the context client with the ready client
        context.client = readyClient;
        return {
            content: [{ type: "text", text: `Successfully logged in to Discord: ${context.client.user?.tag}` }]
        };
    }
    catch (err) {
        error(`Error in login handler: ${err instanceof Error ? err.message : String(err)}`);
        return handleDiscordError(err);
    }
};
