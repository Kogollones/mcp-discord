#!/usr/bin/env node
import { Client, GatewayIntentBits } from "discord.js";
import { DiscordMCPServer } from './server.js';
import { StdioTransport, StreamableHttpTransport } from './transport.js';
import { info, error } from './logger.js';
import config from './config.js';

// Configuration is now centralized in config.js
// Priority: CLI args > ENV vars > config file > defaults
const DISCORD_TOKEN = config.discord.token;
const TRANSPORT = config.transport;
const HTTP_PORT = config.server.port;
const HEARTBEAT_INTERVAL = config.discord.heartbeatInterval;

// Map intent names from config to GatewayIntentBits
function getIntentBits(intentNames) {
    const intentMap = {
        'Guilds': GatewayIntentBits.Guilds,
        'GuildMembers': GatewayIntentBits.GuildMembers,
        'GuildModeration': GatewayIntentBits.GuildModeration,
        'GuildEmojisAndStickers': GatewayIntentBits.GuildEmojisAndStickers,
        'GuildIntegrations': GatewayIntentBits.GuildIntegrations,
        'GuildWebhooks': GatewayIntentBits.GuildWebhooks,
        'GuildInvites': GatewayIntentBits.GuildInvites,
        'GuildVoiceStates': GatewayIntentBits.GuildVoiceStates,
        'GuildPresences': GatewayIntentBits.GuildPresences,
        'GuildMessages': GatewayIntentBits.GuildMessages,
        'GuildMessageReactions': GatewayIntentBits.GuildMessageReactions,
        'GuildMessageTyping': GatewayIntentBits.GuildMessageTyping,
        'DirectMessages': GatewayIntentBits.DirectMessages,
        'DirectMessageReactions': GatewayIntentBits.DirectMessageReactions,
        'DirectMessageTyping': GatewayIntentBits.DirectMessageTyping,
        'MessageContent': GatewayIntentBits.MessageContent,
        'GuildScheduledEvents': GatewayIntentBits.GuildScheduledEvents,
        'AutoModerationConfiguration': GatewayIntentBits.AutoModerationConfiguration,
        'AutoModerationExecution': GatewayIntentBits.AutoModerationExecution
    };

    return intentNames.reduce((bits, name) => {
        if (intentMap[name] !== undefined) {
            bits |= intentMap[name];
        }
        return bits;
    }, 0);
}

// Create Discord client with configurable intents
const client = new Client({
    intents: getIntentBits(config.discord.gatewayIntents)
});

// Save token to client for login handler
if (DISCORD_TOKEN) {
    client.token = DISCORD_TOKEN;
}

// Auto-login on startup if token is available
const autoLogin = async () => {
    const token = DISCORD_TOKEN;
    if (token) {
        try {
            await client.login(token);
            info('Successfully logged in to Discord');
        }
        catch (err) {
            if (typeof err.message === 'string' && err.message.includes('Privileged intent provided is not enabled or whitelisted')) {
                error('Login failed: One or more privileged intents are not enabled in the Discord Developer Portal. Please enable the required intents.');
            }
            else {
                error('Auto-login failed: ' + String(err));
            }
        }
    }
    else {
        info("No Discord token found in config, skipping auto-login");
    }
};

// Initialize transport based on configuration
const initializeTransport = () => {
    switch (TRANSPORT.toLowerCase()) {
        case 'http':
            info(`Initializing HTTP transport on 0.0.0.0:${HTTP_PORT}`);
            return new StreamableHttpTransport(HTTP_PORT);
        case 'stdio':
            info('Initializing stdio transport');
            return new StdioTransport();
        default:
            error(`Unknown transport type: ${TRANSPORT}. Falling back to stdio.`);
            return new StdioTransport();
    }
};

// Start auto-login process
await autoLogin();

// Create and start MCP server with selected transport
const transport = initializeTransport();
const mcpServer = new DiscordMCPServer(client, transport);

try {
    await mcpServer.start();
    info('MCP server started successfully');

    // Keep the Node.js process running
    if (TRANSPORT.toLowerCase() === 'http') {
        // Use configurable heartbeat interval to keep the process alive
        setInterval(() => {
            info('MCP server is running');
        }, HEARTBEAT_INTERVAL);

        // Handle termination signals
        process.on('SIGINT', async () => {
            info('Received SIGINT. Shutting down server...');
            await mcpServer.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            info('Received SIGTERM. Shutting down server...');
            await mcpServer.stop();
            process.exit(0);
        });
        info('Server running in keep-alive mode. Press Ctrl+C to stop.');
    }
}
catch (err) {
    error('Failed to start MCP server: ' + String(err));
    process.exit(1);
}
