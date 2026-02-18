# Examples

This folder contains practical examples for using the MCP Discord server.

## Quick Start

1. Copy `.env.example` to `.env` and add your bot token
2. Run any example: `node examples/<filename>.js`

## Available Examples

| File | Description |
|------|-------------|
| `create-private-channel.js` | Create a private channel with specific users/roles |
| `send-announcement.js` | Send a formatted announcement to a channel |
| `list-server-info.js` | Display server roles, channels, and members |
| `bulk-role-assign.js` | Assign a role to multiple users |
| `test-connection.js` | Simple connection test |

## Using the CLI

The CLI provides a simpler interface for common operations:

```bash
# List all commands
node cli.js help

# Test connection
node cli.js login

# List roles
node cli.js list-roles

# Create private channel
node cli.js channel-create --name my-channel --private --users user1,user2

# Send message
node cli.js message-send --channel 123456789 --message "Hello!"

# List channels
node cli.js list-channels
```
